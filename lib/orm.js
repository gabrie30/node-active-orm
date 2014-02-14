var _ = require('lodash');
var adapter = require('./pg_adapter');

exports.ORM = function(tableName, ){
	var adapter = adapter;
	var attr_accessors = {};
	var attr_reader = {};
	var validators = [];
	var sql = this.sql = adapter.sql;

	self.__defineSetter__("attr_accessor", function(value){ attr_accessors = value });
	self.__defineGetter__("attr_accessor", function(){ return attr_accessors });
	self.__defineSetter__("attr_reader", function(value){ attr_readers = value });
	self.__defineGetter__("attr_reader", function(){ return attr_readers });

	this.validatesWith = function(validator){
		validators.push(validator);
	}

	this.validates = function(attribute, validationType){
		var validator = Validation[validationType]
		validators.push(validator);	
	}

	this.validate = function(activeRecord){
		activeRecord.toJSON
		var errors = [];
	
		this.validators.forEach(function(validator){
			var err

			if( !validator.fn(obj) ){
				err = ( typeof validator.errorMessage == 'function' ) && validator.errorMessage(obj) || validator.errorMessage;
				if(validator.throw){
					throw err;		
				}else{
					errors.push(err);
				}	
			}
		})

		if(errors.length){ obj.errors = errors; }
	}

	this.isValid = function(activeRecord){
		return !this.validate().errors;
	}

	this.new = function(){
		return new activeRecord(this,{name:"ashod",phone:"okay"})
	}

	this.all = function(callback){
		sql("SELECT * from " + table_name + ";", {}, function (error, result) {
			var rows = _.map( result.rows || [] , function(row){ return new activeRecord(this, row )});
			callback && callback(error, rows);
		})	
	}

	this.first = function (callback) {
		sql("SELECT * from " + table_name + " limit 1;", {}, function (error, result) {
			var row = result && result.rows[0] && ( new activeRecord(result.row[0] ));
			callback && callback(error, row);
		})		
	}
	this.last = function (callback) {
		sql("SELECT * from " + table_name + " order by id desc limit 1;", {}, function (error, result) {
			var row = result && result.rows[0] && ( new activeRecord(result.row[0] ));
			callback && callback(error, activate(result && result.rows[0]));
		})		
	}

	this.find = function (id, callback, options) {
		sql("SELECT * from " + table_name + " where id=" + id + ";", {}, function (error, result) {
			var row = result && result.rows[0] && ( new activeRecord(result.row[0] ));
			callback && callback(error, row);
		})
	};

	this.create = function (params, callback, force) {
		var params = ;
		if( this.isValid(params) ){
			_.extend(params, { created_at:"now()", updated_at: "now()" });
			var params = formatParams(params);
			var query = "INSERT into " + table_name + " ( " + params.keys + " ) VALUES ( " + params.values + " ) RETURNING *;"
			sql( query , {}, function (error, result) {
				debug(error);
				callback && callback(error, activate(result && result.rows[0]));
			})	
		}else{
			callback && callback(params._errors , params);
		}
	};

	this.findBy = function (params, callback, options) {
		var params = formatParams(params)
		sql("SELECT * from " + table_name + " where ( " + params.keys + " ) = ( "+ params.values +" );", {}, function (error, result) {
			debug(error);
			callback && callback(error, activate(result && result.rows[0]));
		})
	};

	this.findOrCreate = function (id, params, callback) {
		this.find(id, function (error, result) {
			debug(error);
			if (result) {
				callback && callback(error, record);
			} else {
				klass.create(params, function (error, result) {
					callback && callback(error, record);
				})
			}
		})
	};

	this.findOrCreateBy = function (search_params , record_params , callback, options) {
		klass.findBy(search_params, function (error, result) {
			debug(error);
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
		sql('SELECT * from ' + table_name + ' where ' + query + ";", {}, function (error, result) {
			debug(error);
			var records = result ? result.rows : []; 
			callback && callback(error, records);
		})
	}

}
