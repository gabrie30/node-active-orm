exports.ActiveRecord = function(klass, attributes){
	var self = this;
	var errors = null;
	var attributes = attributes || {};
	var hasChanged = false;

	Object.keys(klass.attrAccessors).forEach(function(key){	
		self.__defineGetter__(key, function(){ 
			return attributes[key] 
		});
		
		self.__defineSetter__(key, function(value){
			if( value !== attributes[key] ) {  hasChanged = true;  };
			attributes[key] = value;
		});
	});

	Object.keys(klass.attrReaders).forEach(function(key){	
		self.__defineGetter__(key, function(){ 
			return attributes[key] 
		});
	});

	self.__defineGetter__("errors", function(){ if(errors) return errors });
	self.__defineSetter__("errors", function(errorList){ errors = errorList });
	self.__defineGetter__("hasChanged", function(){ return !!hasChanged });

	this.toJSON = function(){
		return attributes;
	}

	this.update = function(attributes , callback){
		var self = this;
		var keys = Object.keys(klass.attrAccessors);
		
		keys.forEach(function(key){ 
			self[key] = attributes[key];
		});

		this.save(callback);
	}

	this.save = function(callback){
		if(hasChanged){
			if(this[klass.primaryKey]){
				klass.update(this[klass.primaryKey], this.toJSON(), callback);
			}else{
				klass.create(this.toJSON, callback);
			}
		}
		else{
			callback && callback(null, true)
		}
	}

}