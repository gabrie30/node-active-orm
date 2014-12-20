var _ = require('lodash');
var adapter = require('./pg_adapter.js').pgAdapter;
var ActiveRecord = require('./active_record.js').ActiveRecord;

exports.Model = function(tableName, adapter){
	var self = this;
	var adapter = adapter;
	var primaryKey = "id";
	var validators = [];
	var attrReaders = {};
	var attrAccessors = {};
	var hookCallbacks = {};
	var triggers = {};
	var activateRow = function(row){
		var record = row ? new ActiveRecord( self , row ) : null;
		return record;
	}
	var cast = adapter.castAttributes;
	var uncast = adapter.uncastAttributes;
	var formatQueryParams = adapter.formatQueryParams;
	
	var HOOKS = Object.freeze([
		"beforeSave", "afterSave",
		"beforeUpdate", "afterUpdate",
		"beforeInitialize","afterInitialize", 
		"beforeDestroy", "afterDestroy",
		"beforeCreate","afterCreate",
		"beforeValidation","afterValidation",
		"beforeDestroy", "afterDestroy"
	]);

	self.connection = {
		query: adapter.connection.query
	}

	self.__defineSetter__("primaryKey", function(value){ 
		if(!self.attrAccessors[value]) throw "primary key must be a member of attribute accessors" 
		primaryKey = value 
	});

	self.__defineGetter__("primaryKey", function(value){ return primaryKey });
	self.__defineSetter__("attrAccessors", function(list){ attrAccessors = list });
	self.__defineGetter__("attrAccessors", function(){ return attrAccessors });
	self.__defineSetter__("attrReaders", function(list){ attrReaders = list });
	self.__defineGetter__("attrReaders", function(){ return attrReaders });

	HOOKS.forEach(function(hook){
		this[hook] = function(fn){
			hookCallbacks[hook] && hookCallbacks[hook].push(fn) || (hookCallbacks[hook] = [fn]);
		};

		triggers[hook] = function(activeRecord){
			var callbacks = hookCallbacks[hook] || [];
			callbacks.forEach(function(callback){
				callback.apply(activeRecord);
			} , this);
		}

	}, this);


	this.validatesWith = function(validator){
		validators.push(validator);
	}

	this.validates = function(attribute, validationType){
		var validator = Validation[validationType]
		validators.push(validator);	
	}

	this.validate = function(activeRecord){
		var errors = [];
		var attributes = activeRecord.toJSON();

		validators.forEach(function(validator){
			var err
			if( !validator.fn(attributes) ){
				err = ( typeof validator.errorMessage == 'function' ) && validator.errorMessage(obj) || validator.errorMessage;
				if(validator.throw){
					throw err;
				}else{
					errors.push(err);
				}	
			}
		})

		if(errors.length){ activeRecord.errors = errors; }

		return activeRecord
	}

	this.isValid = function(activeRecord){
		return !this.validate(activeRecord).errors;
	}

	this.new = function(){
		triggers.beforeInitialize();
		return new ActiveRecord(this,{})
		triggers.afterInitialize();
	}

	this.count = function(callback){

	}

	this.all = function(callback){
		this.connection.query("SELECT * from " + tableName + ";", {}, function (error, result) {
			var rows = _.map( result.rows || [] , function(row){ return new ActiveRecord(this, row )});
			callback && callback(error, rows);
		})	
	}

	this.first = function (callback) {
		this.connection.query("SELECT * from " + tableName + " limit 1;", {}, function (error, result) {
			callback && callback(error, activateRow(result && result.rows[0]));
		})		
	}
	this.last = function (callback) {
		this.connection.query("SELECT * from " + tableName + " order by " + this.primaryKey + " desc limit 1;", {}, function (error, result) {
			callback && callback(error, activateRow(result && result.rows[0]));
		})		
	}

	this.find = function (id, callback, options) {
		var params = {};
		params[this.primaryKey] = id;
		params = formatQueryParams(params);
		this.connection.query("SELECT * from " + tableName + " where ( " + params.keys + " ) = ( "+ params.values +" );", {}, function (error, result) {
			callback && callback(error, activateRow(result && result.rows[0]));
		})
	};

	this.update = function(id, params , callback){
		var activeRecord = new ActiveRecord(this,params);
		var params = cast( activeRecord.toJSON(), this.attrAccessors);
		var params = formatQueryParams(params);
		console.info("params", params);

		var idParams = {}
		idParams[this.primaryKey] = id;
		idParams = formatQueryParams(idParams);

		triggers.beforeSave(activeRecord);
		triggers.beforeUpdate(activeRecord);

		query = 'UPDATE ' + tableName + ' SET (' + params.keys + ') = ( '+ params.values +' ) WHERE '+ idParams.keys +'=' + idParams.values + ' RETURNING * ;'
		
		console.info(query)
		
		this.connection.query( query , {}, function (error, result) {
			var activeRecord = activateRow(result && result.rows[0]);
			triggers.afterSave(activeRecord);
			triggers.afterUpdate(activeRecord);
			callback && callback(error, activeRecord);
		});
	}

	this.create = function (params, callback, force) {
		var activeRecord = new ActiveRecord(this,params);
		var self = this;
		triggers.beforeSave(activeRecord);
		triggers.beforeCreate(activeRecord);

		if( this.isValid(activeRecord) ){
			activeRecord.created_at = new Date();
			activeRecord.updated_at = new Date();
			var params = adapter.formatQueryParams(activeRecord.toJSON());
			console.info(params)
			var query = "INSERT into " + tableName + " ( " + params.keys + " ) VALUES ( " + params.values + " ) RETURNING *;"
			this.connection.query( query , {}, function (error, result) {
				var activeRecord = result && result.rows[0] && ( new ActiveRecord( self ,result.rows[0] ));
				callback && callback(error, activeRecord);
				triggers.afterCreate(activeRecord) && triggers.afterSave(activeRecord);
			})	
		}else{
			callback && callback(params._errors , params);
		}
	};

	this.findBy = function (params, callback) {
		var params = formatQueryParams(params)
		this.connection.query("SELECT * from " + tableName + " where ( " + params.keys + " ) = ( "+ params.values +" );", {}, function (error, result) {
			var activeRecord = result && result.rows[0] && ( new ActiveRecord( self ,result.rows[0] ));
			callback && callback(error, activeRecord);
		})
	};

	this.findOrCreate = function (id, params, callback) {
		this.find(id, function (error, result) {
			if (result) {
				callback && callback(error, record);
			} else {
				klass.create(params, function (error, result) {
					callback && callback(error, record);
				})
			}
		})
	};

	this.findOrCreateBy = function (params, callback) {
		this.findBy(params, function (error, result) {
			if (result) {
				callback && callback(error, result);
			} else {
				klass.create(_.extend(record_params, search_params), function (error, result) {
					callback && callback(error, result);
				})
			}
		});
	}

	this.where = function (query, callback) {
		this.connection.query('SELECT * from ' + tableName + ' where ' + query + ";", {}, function (error, result) {
			var records = result ? result.rows : []; 
			callback && callback(error, records);
		});
	}

}
