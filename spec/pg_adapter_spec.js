var _ = require('underscore');
var PgAdapter = require('../lib/pg_adapter.js').pgAdapter;

describe("PgAdapter", function(){
	var adapter = new pgAdapter("postgres://postgres@localhost/test");
	
	describe("connection", function(){
		it("is defined with query", function(){
			expect(adapter.connection).toExist();
			expect(adapter.connection.query).toExist();
		});
	});	

	describe("#castAttributes", function(){
		it("casts attributes to pg compatible formats", function(){
			//add specs
		});
	});	

	describe("#uncastAttributes", function(){
		it("casts attributes to js compatible formats", function(){
			//add specs
		});
	});	

})