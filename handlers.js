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

module.exports = handlerService;