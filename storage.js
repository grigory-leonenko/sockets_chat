var data = function(){
    this.data = {};
};

data.prototype.$write = function(storage, key, data){
    if(!this.data[storage]){this.data[storage] = {}};
    this.data[storage][key] = data;
};

data.prototype.$read = function(storage, key){
    if(storage == 'chats'){
        console.log(this.data[storage], key)
    }
    if(key){
        return this.data[storage][key];
    } else {
        return this.data[storage]
    };
};

data.prototype.$delete = function(storage, key){
    console.log(storage, key);
    delete  this.data[storage][key];
}

data.prototype.$keys = function(storage){
    if(!this.data[storage]) return 'empty storage';

    return Object.keys(this.data[storage]).map(function(key){
        return key;
    });
};

data.prototype.$map = function(storage, fn){
    var _collection = this.data[storage];
    for(var i in _collection){
        fn(_collection[i], i);
    };
};

module.exports = new data();