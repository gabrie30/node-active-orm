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
	typeCast = pgTypeCaster.castParams;
}

var pgTypeCaster = exports.pgTypeCaster = function(attributes){
	var attributes = attributes;
	this.castParams = function(params){
		_.keys(attributes).forEach(function(key){
			params[key] = typecasts[klass.attributes[key]](params[key]);
		})
		return params
	};
}
