exports.ActiveRecord = function(klass, attributes){
	var self = this;
	var cache = {}
	var klass = klass;
	var hasChanged = false;
	var errors = null;
	var attributes = attributes;

	Object.keys(klass.attr_accessors).forEach(function(key){	
		self.__defineGetter__(key, function(){ 
			return attributes[key] 
		});
		
		self.__defineSetter__(key, function(value){
			if( value !== attributes[key] ) {  hasChanged = true;  };
			attributes[key] = value;
		});
	});

	Object.keys(klass.attr_readers).forEach(function(key){	
		self.__defineGetter__(key, function(){ 
			return attributes[key] 
		});
	});

	self.__defineGetter__("errors", function(){ if(errors) return errors });
	self.__defineSetter__("errors", function(errorList){ errors = errorList });

	this.toJSON = function(){
		return attributes;
	}

	this.update = function(attributes , callback){
		var keys = Object.keys(klass.attr_accessors);

		keys.forEach(function(key){ self[key] = attributes[key]; });

		if( hasChanged ){
			// validate 
			// check for errors 
			// format params
			// sql query
			// add updated_at column
			// execute query and call callback 	
		
		}else{
			callback && callback(null, obj);
		}
	}

	this.save = function(callback){
		if(changed){

		}
		else{
			callback && callback(null, true)
		}
	}

}