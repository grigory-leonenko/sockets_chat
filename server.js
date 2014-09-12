var http = require('http');
var sockjs = require('sockjs');
var handler_service = require('./handlers');
var socket = sockjs.createServer();
var clients = {};
var _handlers = new handler_service();

console.log(handler_service)

socket.on('connection', function(conn) {

    clients[conn.id] = {connection: conn, id: conn.id, subscriptions: {}, user: {}};

    conn.on('data', function(data) {
        var _data = JSON.parse(data);
        switch (_data.method){
            case 'subscribe':
                clients[conn.id].subscriptions[_data.event] = _data.event;
                break;
            case 'unsubscribe':
                delete clients[conn.id].subscriptions[_data.event];
                break;
            case 'emit':
                _handlers.emitHandler(_data.event, _data.data, clients[conn.id]);
        };
    });

    conn.on('close', function() {
        delete clients[conn.id];
    });

});



_handlers.registerHandler('REGISTER_USER', function(params, client){
    if(client && params.name){
        client.name = params.name;
        write(client, {event: 'REGISTER_SUCCEED', data: {name: params.name}});
        for(var i in clients){
            var _client = clients[i];
            if(_client.name && _client.subscriptions['USER_LIST']) _handlers.emitHandler('USER_LIST', null, _client);
        };
    };
});

_handlers.registerHandler('USER_LIST', function(params, client){
    if(client){
        var _users = []
        for(var i in clients){
            console.log('client id', i, client.id)
            var _client = clients[i];
            if(i != client.id && _client.name){
                _users.push({
                    name: _client.name,
                    id: _client.id
                })
            };
        };
        write(client, {event: 'USER_LIST', data: _users})
    };
});

_handlers.registerHandler('ADD_MESSAGE', function(params, id){
    if(params.id && params.message){
        write(id, {event: 'MESSAGE_ADDED', message: params.message})
        write(params.id, {event: 'MESSAGE_ADDED', message: params.message, id: id})
    };
});

function write(client, message){
    client.connection.write(JSON.stringify(message));
};


var server = http.createServer();
socket.installHandlers(server, {prefix:'/echo'});
server.listen(9007);