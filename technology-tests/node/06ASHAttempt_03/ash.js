var ASH = (function() {
  var socket = io.connect('/');
  socket.on('executeTransaction', function (data) {
    console.log("receiving ("+data+")");
    var tokens = data.split(" ");
    actionSource = 'server';
    if(tokens[0] == 's')
    //commitTransaction("s "+resource+" "+property+" "+value);
      ASH.set(tokens[1],tokens[2],tokens[3]);
    else if(tokens[0] == 'us')
      ASH.set(tokens[1],tokens[2]);
    actionSource = 'client';
  });
  function commitTransaction(data){
    console.log("sending ("+data+")");
    socket.emit('commitTransaction', data);
  }
/*
  //send updates at most every Xms
  var millisec = 50;
  setInterval(function(){
      if(positionChanged){
        console.log("sending ("+x+","+y+")");
        send(x,y);
        positionChanged = false;
      }
    },millisec);
*/
  // private members
  
  var resourceIdCounter = 0;
  
  var plugins = {}; // keys = type ids, values = resource factories
  
  var resourceTypes = {}; // keys = resource ids, values = type ids
  
  var resources = {}; // keys = resource ids, values = objects with set(property,value) and unset(property)

  var actionSource = 'client'; // one of 'client' or 'server'

  return { // public interface
    registerPlugin: function (plugin) {
      plugins[plugin.type] = plugin;
    },
    genResourceId: function(){
      return (resourceIdCounter++).toString();
    },
    set: function (resource, property, value) {
      if(actionSource == 'client')
        commitTransaction("s "+resource+" "+property+" "+value);
      else if(actionSource == 'server'){
        if(property == ASH.TYPE){
          var type = value;
          resourceTypes[resource] = type;
          resources[resource] = plugins[type].create(resource);
        }
        else
          resources[resource].set(property,value);
      }
    },
    unset: function (resource, property) {
      if(actionSource == 'client')
        commitTransaction("us "+resource+" "+property);
      else if(actionSource == 'server'){
        if(property == ASH.TYPE)
          plugins[resourceTypes[resource]].delete(resource);
      }
    },
    TYPE : "type"
  };
})();
