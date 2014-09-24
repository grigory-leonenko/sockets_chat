var http = require('http');
var sockjs = require('sockjs');
var handler_service = require('./handlers');
var storage = require('./storage');
var socket = sockjs.createServer();
var clients = {};
var _handlers = new handler_service();

console.log(handler_service)

socket.on('connection', function(conn) {
    // Create user for connection and send it to client
    storage.$write('sessions', conn.id, {connection: conn, id: conn.id, subscribes: {}});
    storage.$write('users', conn.id, {name: null, auth: false, id: conn.id});

    var _session = storage.$read('sessions', conn.id);

    write(_session, 'user', storage.$read('users', conn.id));

    conn.on('data', function(data) {
        var _data = JSON.parse(data);
        _handlers.emitHandler(_data.model, _data.data, _session);
    });

    conn.on('close', function() {
        storage.$delete('sessions', conn.id);
        storage.$delete('users', conn.id);
        clearChats(conn.id);
    });

});

var guid = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };
})();





_handlers.registerHandler('user', function(data, client){
    var _user = {name: data.name, id: client.id, auth: true};
    storage.$write('users', client.id, _user);
    write(client, 'user', _user);
    generateChatsForUser(_user)
});

_handlers.registerHandler('chat', function(data, client){
      if(data.id){
          var _id = data.id;
      } else {
          var _id = guid();
      }
      storage.$write('chats', _id, {id: _id, users: data.users});
      sendChatList();
});

function generateChatsForUser(client){
    storage.$map('users', function(user, userId){
        if(userId == client.id || !user.auth) return;
        var _chat = {id: guid(), users: {}};
        _chat['users'][client.id] = client;
        _chat['users'][user.id] = user;
        storage.$write('chats', _chat.id, _chat);
    });
    sendChatList();
};

function clearChats(clientId){
    storage.$map('chats', function(chat, chatId){
        if(chat['users'][clientId]){
            if(Object.keys(chat['users']).length < 4){
                storage.$delete('chats', chatId);
            } else {
                delete chat['users'][clientId];
            };
        };
    });
    sendChatList();
};

function sendChatList(){
    console.log(storage.$read('chats'));
    storage.$map('sessions', function(client, clientId){
        var _chats = [];
        storage.$map('chats', function(chat, chatId){
            if(chat['users'][clientId]){
                _chats.push(chat);
            };
        })
        write(client, 'chats', _chats);
    });
};

_handlers.registerHandler('message', function(data, client){
    var _chat = storage.$read('chats', data.chatId);
    console.log(_chat)
    mapObject(_chat.users, function(user, userId){
        write(storage.$read('sessions', userId), 'message', {text: data.text, chatId: data.chatId, user: storage.$read('users', client.id)});
    });
});

function write(client, storage, data){
    client.connection.write(JSON.stringify({model: storage, data: data}));
};

function mapObject(obj, fn){
    Object.keys(obj).map(function(key){
        fn(obj[key],key);
    });
};


var server = http.createServer();
socket.installHandlers(server, {prefix:'/echo'});
server.listen(9007);