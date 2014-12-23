var Adapters = require('./adapters')
var Model = require('./model.js')

module.exports = {
  _adapter:null,
  _models:[],
  connect: function(conString, options){
    this._adapter = Adapters('pg', {conString: conString })
  },
  model: function(table_name){
    console.log(table_name, model)
    var model = Model(table_name, this._adapter);
    this._models.push( model );
    return model;
  }

}
