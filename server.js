var http = require('http');
var sockjs = require('sockjs');

var socket = sockjs.createServer();
var clients = {};
var _handlers = new handlerService();

socket.on('connection', function(conn) {

    clients[conn.id] = {connection: conn, subscriptions: {}, user: {}};

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



_handlers.registerHandler('REGISTER_USER', function(params, id){
    if(id && params.name){
        clients[id].name = params.name;
        write(id, {event: 'REGISTER_SUCCEED', data: {name: params.name}})
    };
});

_handlers.registerHandler('GET_USER_LIST', function(params, id){
    if(id){
        var _users = []
        for(var i in clients){
            if(i != id && clients[i].name){
                _users.push({
                    name: clients[i].name,
                    id: id
                })
            };
        };
        write(id, {event: 'USER_LIST', data: _users})
    };
});

_handlers.registerHandler('ADD_MESSAGE', function(params, id){
    if(params.id && params.message){
        write(id, {event: 'MESSAGE_ADDED', message: params.message})
        write(params.id, {event: 'MESSAGE_ADDED', message: params.message, id: id})
    };
});

function write(id, message){
    clients[id].connection.write(JSON.stringify(message));
};

function handlerService(){
    this.handlers = {};
};

handlerService.prototype.registerHandler = function(name, fn){
    if(this.handlers[name]){
        console.error('Handler already registered for:', name);
    } else {
        this.handlers[name] = fn;
    };
};

handlerService.prototype.emitHandler = function(name, data, client){
    if(this.handlers[name]){
        this.handlers[name](data, client)
    } else {
        console.error('No handler for:', name)
    };
};

var server = http.createServer();
socket.installHandlers(server, {prefix:'/echo'});
server.listen(9007);