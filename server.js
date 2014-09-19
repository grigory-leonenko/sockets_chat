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
        console.log(_data);
        _handlers.emitHandler(_data.model, _data.data, _session);
    });

    conn.on('close', function() {
        storage.$delete('sessions', conn.id);
        storage.$delete('users', conn.id);
        generateUserList();
    });

});



_handlers.registerHandler('user', function(data, client){
      storage.$write('users', client.id, {name: data.name, id: client.id, auth: true});
      write(client, 'user', storage.$read('users', client.id));
      generateUserList();
});

function generateUserList(){
    storage.$map('sessions', function(client, clientId){
        var _users = [];
        storage.$map('users', function(user, userId){
            if(userId != clientId && user.auth){
                _users.push(user);
            };
        });
        write(client, 'users', _users);
    });
};

_handlers.registerHandler('message', function(data, client){
    write(client, 'message', {text: data.text, clientId: data.userId, user: storage.$read('users', client.id)});
    write(storage.$read('sessions', data.userId), 'message', {text: data.text, clientId: client.id, user: storage.$read('users', client.id)});
});

function write(client, storage, data){
    console.log(client.id, storage, data)
    client.connection.write(JSON.stringify({model: storage, data: data}));
};


var server = http.createServer();
socket.installHandlers(server, {prefix:'/echo'});
server.listen(9007);