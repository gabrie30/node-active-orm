var _ = require('underscore');
var Model = require('../lib/model.js').Model;
var PgAdapter = require('../lib/pg_adapter.js').pgAdapter;
var ActiveRecord = require('../lib/active_record.js').ActiveRecord;


describe("Model", function(){
	var adapter = new pgAdapter("postgres://postgres@localhost/test");
	var model = new Model('User', adapter);	

	describe("#validatesWith", function(){
		
	});

	describe("#validates", function(){
		
	});

	describe("#validate", function(){
		
	});

	describe("#isValid", function(){
		
	});


	describe("#new", function(){
		
	});

	describe("#count", function(){
		
	});	

	describe("#all", function(){
		
	});

	describe("#first", function(){
		
	});

	describe("#last", function(){
		
	});

	describe("#find", function(){
		
	});

	describe("#update", function(){
		
	});

	describe("#create", function(){
		
	});

	describe("#findBy", function(){
		
	});

	describe("#findOrCreate", function(){
		
	});

	describe("#findOrCreateBy", function(){
		
	});

	describe("#where", function(){
		
	});


})