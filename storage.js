var data = function(){
    this.data = {};
};

data.prototype.$write = function(storage, key, data){
    if(!this.data[storage]){this.data[storage] = {}};
    this.data[storage][key] = data;
};

data.prototype.$read = function(storage, key){
    return this.data[storage][key];
};

data.prototype.$delete = function(storage, key){
    delete  this.data[storage][key];
}

data.prototype.$map = function(storage, fn){
    var _collection = this.data[storage];
    for(var i in _collection){
        fn(_collection[i], i);
    };
};

module.exports = new data();