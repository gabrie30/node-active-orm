var _ = require('lodash');
var adapter = require('./pg_adapter.js').pgAdapter;
var ActiveRecord = require('./active_record.js').ActiveRecord;

exports.Model = function(tableName, adapter){
	var self = this;
	var adapter = adapter;
	var validators = [];
	var attr_readers = {};
	var attr_accessors = {};
	var hookCallbacks = {};
	var cast = adapter.castAttributes;
	var uncast = adapter.uncastAttributes;
	var formatQueryParams = adapter.formatQueryParams;
	var HOOKS = Object.freeze([
		"beforeSave", "afterSave", 
		"beforeInitialize","afterInitialize", 
		"beforeDestroy", "afterDestroy",
		"beforeCreate","afterCreate",
		"beforeValidation","afterValidation",
		"beforeDestroy", "afterDestroy"
	]);

	self.sql = adapter.sql;

	self.__defineSetter__("attr_accessors", function(list){ attr_accessors = list });
	self.__defineGetter__("attr_accessors", function(){ return attr_accessors });
	self.__defineSetter__("attr_readers", function(list){ attr_readers = list });
	self.__defineGetter__("attr_readers", function(){ return attr_readers });

	HOOKS.forEach(function(hook){
		this[hook] = function(){
			hookCallbacks[hook] && hookCallbacks[hook].push(fn) || (hookCallbacks[hook] = [fn]);
		};
		var triggerName = "_trigger" + hook.charAt(0).toUpperCase() + hook.slice(1);
		
		this[triggerName] = function(activeRecord){
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
		var attributes = activeRecord.toJSON;

		this.validators.forEach(function(validator){
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
		return !this.validate().errors;
	}

	this.new = function(){
		this._triggerBeforeInitialize();
		return new ActiveRecord(this,{})
		this._triggerAfterInitialize();
	}

	this.count = function(callback){

	}

	this.all = function(callback){
		this.sql("SELECT * from " + tableName + ";", {}, function (error, result) {
			var rows = _.map( result.rows || [] , function(row){ return new ActiveRecord(this, row )});
			callback && callback(error, rows);
		})	
	}

	this.first = function (callback) {
		this.sql("SELECT * from " + tableName + " limit 1;", {}, function (error, result) {
			var row = result && result.rows[0] && ( new ActiveRecord(self , result.row[0] ));
			callback && callback(error, row);
		})		
	}
	this.last = function (callback) {
		this.sql("SELECT * from " + tableName + " order by id desc limit 1;", {}, function (error, result) {
			var row = result && result.rows[0] && ( new ActiveRecord( self , result.row[0] ));
			callback && callback(error, activate(result && result.rows[0]));
		})		
	}

	this.find = function (id, callback, options) {
		this.sql("SELECT * from " + tableName + " where id=" + id + ";", {}, function (error, result) {
			var row = result && result.rows[0] && ( new ActiveRecord( self, result.row[0] ));
			callback && callback(error, row);
		})
	};

	this.update = function(id, attributes , callback){
		_triggerBeforeSave();
		_triggerBeforeUpdate();
		var params = cast(attributes);
		var formatQueryParams = formatQueryParams(params);
		
		query = 'UPDATE ' + tableName + ' SET (' + params.keys + ') = ( '+ params.values +' ) WHERE id = ' + obj.id + ' RETURNING * ;'
		
		this.sql( query , {}, function (error, result) {
			var activeRecord = result && result.rows[0] && ( new ActiveRecord( self ,result.row[0] ));
			callback && callback(error, activeRecord);
			_triggerAfterSave() && _triggerAfterUpdate ;
			
			if ( !error && activeRecord ) { 
				console.info(" updated " + tableName + " at record: " + activeRecord.id ) 
			};
		});
	}

	this.create = function (params, callback, force) {
		_triggerBeforeSave();
		_triggerBeforeCreate();
		
		var params = cast(params);
		if( this.isValid(params) ){
			_.extend(params, { created_at:"now()", updated_at: "now()" });
			var query = "INSERT into " + tableName + " ( " + params.keys + " ) VALUES ( " + params.values + " ) RETURNING *;"
			this.sql( query , {}, function (error, result) {
				debug(error);
				callback && callback(error, activate(result && result.rows[0]));
				_triggerAfterCreate() && _triggerAfterSave();
			})	
		}else{
			callback && callback(params._errors , params);
		}
	};

	this.findBy = function (params, callback) {
		var params = formatParams(params)
		this.sql("SELECT * from " + tableName + " where ( " + params.keys + " ) = ( "+ params.values +" );", {}, function (error, result) {
			debug(error);
			callback && callback(error, activate(result && result.rows[0]));
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
		this.sql('SELECT * from ' + tableName + ' where ' + query + ";", {}, function (error, result) {
			var records = result ? result.rows : []; 
			callback && callback(error, records);
		})
	}

}
