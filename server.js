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
        switch (_data.method){
            case 'write':
                _handlers.emitHandler(_data.model, _data.data, _session);
        };
    });

    conn.on('close', function() {
        storage.$delete('sessions', conn.id);
        storage.$delete('users', conn.id);
    });

});



_handlers.registerHandler('user', function(data, client){
      storage.$write('users', client.id, {name: data.name, id: client.id, auth: true});
      write(client, 'user', storage.$read('users', client.id))
      storage.$map('sessions', function(client, clientId){
          var _users = [];
          storage.$map('users', function(user, userId){
              if(userId != clientId){
                  _users.push(user);
              };
          });
          write(client, 'users', _users);
      });
});

_handlers.registerHandler('message', function(params, id){
    if(params.id && params.message){
        write(id, {event: 'MESSAGE_ADDED', message: params.message})
        write(params.id, {event: 'MESSAGE_ADDED', message: params.message, id: id})
    };
});

function write(client, storage, data){
    client.connection.write(JSON.stringify({model: storage, data: data}));
};


var server = http.createServer();
socket.installHandlers(server, {prefix:'/echo'});
server.listen(9007);