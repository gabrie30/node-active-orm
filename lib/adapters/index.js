var adapters = {
  pg: require('./pg').pg
}

module.exports = function(adapter, options){
  return adapters[adapter](options['conString'], options)
}
