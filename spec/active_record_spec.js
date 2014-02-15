var _ = require('underscore');
var Model = require('../lib/model.js').Model;
var PgAdapter = require('../lib/pg_adapter.js').pgAdapter;
var ActiveRecord = require('../lib/active_record.js').ActiveRecord;


describe("ActiveRecord", function(){
	var User = new Model("user" , PgAdapter);
	User.attr_accessors = { name:"string", phone:"string", address:"string"};
	User.attr_readers = { last_updated:"string", friend_count:"integer"};


	var user = User.new();

	it("creates setters and getters for active record based on model attr_accessors", function(){
		_.each(User.attr_accessors , function(value,key){
			expect(user.hasOwnProperty(key)).toEqual(true)
		});
	});

	it("creates getters for active record based on model attr_readers", function(){
		_.each(User.attr_accessors , function(value,key){
			expect(user.hasOwnProperty(key)).toEqual(true);
		});
	});

	it("creates setters and getters for errors", function(){
		expect(user.hasOwnProperty("errors")).toEqual(true);
	});

	describe("#toJSON" , function(){
		it("returns hash of all active record attributes", function(){
			user.name = "ashod"
			user.phone = "408-123-4567"
			user.address = "123 main street"
			
			expect( user.toJSON() ).toEqual({
				name: "ashod",
				phone: "408-123-4567",
				address: "123 main street"
			})
		})
	})

})