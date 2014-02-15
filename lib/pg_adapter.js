var pg = require('pg')
, _ = require('lodash')
, strftime = require('strftime')
, hstore = require('pg-hstore');

exports.pgAdapter = function(conString , options){
	var connectionString = conString;

	this.sql = function(query, params , callback) {
		pg.connect(conString, function(err, client, done) {
			if (err) { return callback && callback(err) }
				client.query(query, params, function(err, res) {
					done();
					return callback && callback(err, res);
				});
		});
	};

	this.castAttributes = function(attributes){
		_.keys(attributes).forEach(function(key){
			params[key] = typecasts["db"][klass.attributes[key]](params[key]);
		})
		return params
	};

	this.uncastAttributes = function(attributes){
		_.keys(attributes).forEach(function(key){
			params[key] = typecasts["js"][klass.attributes[key]](params[key]);
		})
		return params	
	};

	this.formatQueryParams = function(params){
		var keys = _.keys( params ).join(',');
		var values = _.map(_.values( params ),function (value) {
			return (value === null || value === "null") ? 'NULL' : "'" + value.toString() + "'"
		}).join(' , ');
		return {keys: keys , values: values}
	}
}

var typecasts = {
	db :{ 
		integer: function(i){
			try{ return _.isNaN(parseInt(i)) ? null : parseInt(i) } catch( e ){ throw e }
		},
		string: function(i){
			try { return (( i == null || typeof i == 'undefined' ) ? 'null' :  i.toString()) } 
			catch( error ){ throw error  }
		},
		hstore: function(i){
			if(i){
				try{
					return hstore.stringify(i)
				} catch( e ){ 
					throw e 
				}	
			}else{
				return 'null'
			}
		},
		date: function(i){
			if(_.isDate(i)){
				return strftime('%Y-%m-%d' , i)
			}else if(typeof i == 'string'){
				try{
					return strftime('%Y-%m-%d' , new Date(i) )
				}catch(e){
					throw e;
				}
			}
			else{
				return null;
			}
		},
		datetime: function(i){
			if(_.isDate(i)){
				return strftime('%Y-%m-%d %H:%M:%S.%L', i )
			}else{
				try{
					return strftime('%Y-%m-%d %H:%M:%S.%L', new Date(i) )
				}catch(e){
					throw e
				}
			}
		}
	},
	js:{}
}



