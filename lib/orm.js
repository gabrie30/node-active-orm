var pg = require('pg')
,	conString = process.env.DATABASE_URL || "postgres://postgres@localhost/dna"
, _ = require('lodash')
, strftime = require('strftime')
, hstore = require('./').hstore;


exports.pgQuery = function (query, params, callback) {
	callback = callback || params || function (){};
	params = callback && params || [];
	var client = new pg.Client(conString);
	client.connect(function (err) {
		if (err) {
			return callback && callback(err);
		}
		client.query(query, params, function (err, res) {
			callback && callback(err, res);
			client.end();
		});
	})
};

var sql = exports.sql = function(query, params , callback) {
	pg.connect(conString, function(err, client, done) {
		if (err) { return callback && callback(err) }
  		client.query(query, params, function(err, res) {
    		done();
    		return callback && callback(err, res);
  		});
	});
}

exports.ORM = function (table_name, options) {
	if (!table_name) throw "Must provide a table name";
	
	var klass = this;
	var table_name = table_name;
	var debug = function (error) {}

	this.attributes = options && options.attributes || {};
	this.validations = options && options.validations || [];
	this.defineAttributes = function(attributes){
		this.attributes = attributes;
	}

	var activate = function (record) {
		if(!record) return null
		return _.extend( klass.toJSON(record) , crud , { _cache: _.clone( klass.toJSON(record) ) } );
	}

	this.defineValidation = function(validation){
		if(!( validation  && validation.name && validation.fn && validation.errorMessage )){
			throw "A Validation Must Specify: name, fn , errorMessage [optional throw]";
		}else{
			this.validations.push(validation);	
		}
	}

	this.validate = function(obj){
		var errors = [];
		var errorMessage;
		delete obj["_errors"];
		this.validations.forEach(function(validation){
			if(!validation.fn(obj)){
				errorMessage = ( typeof validation.errorMessage == 'function' ) ? validation.errorMessage(obj) : validation.errorMessage;
				if(validation.throw){
					throw errorMessage;		
				}else{
					errors.push(errorMessage);
				}	
			}
		})
		if(errors.length){ obj._errors = errors; }
		return obj
	}

	this.isValid = function(obj){
		return !this.validate(obj)._errors;
	}

	this.typeCasts = {
		integer: function(i){
			var result
			try{ return result = _.isNaN(parseInt(i)) ? null : parseInt(i) } catch( e ){ throw e }
		},
		string: function(i){
			var result
			try{ 
				result = ( i == null || typeof i == 'undefined' ) ? 'null' :  i.toString() ;
				return result
			} catch( e ){ 
				throw e 
			}
		},
		hstore: function(i){
			var result 
			if(i){
				try{
					result = hstore.stringify(i);
					return result
				} catch( e ){ throw e }	
			}else{
				return 'null'
			}
			
		},
		date: function(i){
			var result;
			if(_.isDate(i)){
				return strftime('%Y-%m-%d' , i)
			}else if(typeof i == 'string'){
				try{
					var date = new Date(i);
					return strftime('%Y-%m-%d' , date)
				}catch(e){
					throw e;
				}
			}
			else{
				return null;
			}
		},
		datetime: function(i){
			var result;
			if(_.isDate(i)){
				return strftime('%Y-%m-%d %H:%M:%S.%L', i )
			}else{
				try{
					var date = new Date(i);
					return strftime('%Y-%m-%d %H:%M:%S.%L', i )
				}catch(e){
					throw e
				}
			}
		}
	}

	this.typeCastAttributes = function(params){
		var params = _.pick(params , _.keys(klass.attributes));
		_.keys(params).forEach(function(key){
			params[key] = klass.typeCasts[klass.attributes[key]](params[key]);
		})
		return params
	}

	this.toJSON = function(obj){
		var result = _.omit(obj , 'update' , 'save' ,'_cache' , 'hasChanged' );

		_.keys(obj).forEach(function(key){
			if( klass.attributes[key] == "hstore" && !_.isObject( obj[key] ) ){	
				try{
					result[key] = hstore.parse(obj[key]);
				} catch( e ){ 
					return result 
				}				
			}
		})

		return result
	}

	this.getColumns = function(callback){
		sql('select * from ' + table_name + ' limit 1;', function(error, result){
			if(error) { throw error }
				columns = result.fields;
			formattedColumns = []
			_.reduce(columns ,function(memo,value){ memo.push(value.name + ":" + value.format); return memo }, formattedColumns) 
			if(callback){
				callback(formattedColumns);
			}else{
				console.info(table_name + ":" , formattedColumns.join(' , '))
			}
		})
	}

	this.getColumnNames = function(callback){
		var columnNames
		this.getColumns(function(result){
			columnNames = _.pluck(result, 'name');
			if(callback){
				callback(columnNames);
			}else{
				console.info(table_name + ":" , columnNames.join(' , '))
			}
		})
	}

	this.build = function(params){
		return _.extend(params, crud )
	}


	var formatParams = function(params){
		var params = klass.typeCastAttributes(params);
		var keys = _.keys( params ).join(',');
		var values = _.map(_.values( params ),function (value) {
			if(typeof value === "number"){
				result = value.toString()	
			}else if( value === null || value === "null" ){
				result = 'null'
			}else{
				result = "'" + value.toString() + "'"
			}
			return result

		}).join(' , ');
		return {keys: keys , values: values}
	}

	this.sql = sql;	

	this.all = function(callback){
		sql("SELECT * from " + table_name + ";", {}, function (error, result) {
			debug(error);
			callback && callback(error, (result && result.rows));
		})	
	}

	this.first = function (callback) {
		sql("SELECT * from " + table_name + " limit 1;", {}, function (error, result) {
			debug(error);
			callback && callback(error, activate(result && result.rows[0]));
		})		
	}
	this.last = function (callback) {
		sql("SELECT * from " + table_name + " order by id desc limit 1;", {}, function (error, result) {
			debug(error);
			callback && callback(error, activate(result && result.rows[0]));
		})		
	}

	this.find = function (id, callback, options) {
		sql("SELECT * from " + table_name + " where id=" + id + ";", {}, function (error, result) {
			debug(error);
			callback && callback(error, activate(result && result.rows[0]));
		})
	};

	this.create = function (params, callback, force) {
		var params = this.validate(params);
		if(!params._errors){
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

	var crud = {
		hasChanged : function(){
			return !(_.isEqual(this._cache , klass.toJSON(this) ))
		},
		update: function (params, callback , force) {
			var hasChanged = this.hasChanged(this);
			var obj = klass.toJSON(_.extend(this, params));
			var params, query, record;

			if( hasChanged ){
				
				obj = force ? obj : klass.validate( obj );

				if(!obj._errors){
					params = formatParams(_.extend(params, {updated_at : new Date() }));
					query = 'UPDATE ' + table_name + ' SET (' + params.keys + ') = ( '+ params.values +' ) WHERE id = ' + obj.id + ' RETURNING * ;'
					sql( query , {}, function (error, result) {
						record = activate( result && result.rows[0] );
						if ( !error && record ) { console.info(" updated " + table_name + " at record: " + record.id ) };
						callback && callback(error, record);
					});
				}else{
					callback && callback( obj._errors , obj );
				}
			}else{
				callback && callback(null, obj);
			}
		},

		save: function(callback , force){
			var obj = this;
			if(obj.id){
				obj.update(obj , callback , force);
			}else{
				klass.create(obj, function(error, result){
					_.extend(obj, result);
					callback && callback(error, result);
				},force);
			}
		}
	}

};
