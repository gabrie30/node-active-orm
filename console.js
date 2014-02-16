var Adapter = require('./lib/pg_adapter').pgAdapter;
var Model = require('./lib/model').Model;
var User = new Model('users', new Adapter("postgres://postgres@localhost/test"));
var ActiveRecord = require('./lib/active_record.js').ActiveRecord;

var repl = require("repl")
, __ = require('lodash')
, lib = require('./lib')
, local , context , processExitCleanup;


processExitCleanup = function(callback){
	console.log('-> Bye!');
	callback && callback();
}

User.attrAccessors = {name:"string" , phone:"string", address:"string", data:"json" }
User.primaryKey="name"

context = {
	__ : __,
	Model: Model,
	Adapter: Adapter,
	ActiveRecord: ActiveRecord,
	User : User,
	cArgs: function(){console.log(arguments)},
	cResult: function(error, result){console.log(result)},
	cError: function(error, result){console.log(error)},
	cAssign: function(error, result){ x = result;}
};

local = repl.start("> ");

__.extend( local.context, context);

