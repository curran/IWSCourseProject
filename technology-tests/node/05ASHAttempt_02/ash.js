var ASH = (function() {
  // private members
  
  var resourceIdCounter = 0;
  
  var plugins = {};
  
  var resourceTypes = {}; //keys = resource ids, values = type ids

  function privateMethod () {
    // ...
  }

  return { // public interface
    registerPlugin: function (plugin) {
      plugins[plugin.type] = plugin;
    },
    genResourceID: function(){
      return (resourceIdCounter++).toString();
    },
    set: function (resource, property, value) {
      if(property == ASH.TYPE){
        var type = value;
        plugins[type].create(resource);
        resourceTypes[resource] = type;
      }
    },
    unset: function (resource, property) {
      if(property == ASH.TYPE)
        plugins[resourceTypes[resource]].delete(resource);
    },
    TYPE : "type"
  };
})();
