var ASH = (function() {
  var socket = io.connect('/');
  socket.on('executeTransaction', function (data) {
    var tokens = data.split(" ");
    actionSource = 'server';
    if(tokens[0] == 's')
    //commitTransaction("s "+resource+" "+property+" "+value);
      ASH.set(tokens[1],tokens[2],tokens[3]);
    else if(tokens[0] == 'us')
    //commitTransaction("us "+resource+" "+property);
      ASH.unset(tokens[1],tokens[2]);
    actionSource = 'client';
  });
  function send(data){
    socket.emit('commitTransaction', data);
  }
  
  var resourceIdCounter = 0; // used by ASH.genResourceId()
  
  var plugins = {}; // keys = type ids, values = resource factories
  
  var resourceTypes = {}; // keys = resource ids, values = type ids
  
  var resources = {}; // keys = resource ids, values = objects with
  // set(property,value) and unset(property)

  var actionSource = 'client'; // one of 'client' or 'server'
  
  var inTransaction = false; // true during a transaction (after begin() and before commit())
  
  var currentTransaction = []; // a list of atomic action strings

  return { // public interface
    registerPlugin: function (plugin) {
      plugins[plugin.type] = plugin;
    },
    genResourceId: function(){
      return (resourceIdCounter++).toString();
    },
    set: function (resource, property, value) {
      if(actionSource == 'client'){
        if(inTransaction){
          //TODO implement the gizmo
        }
        else
          console.error("ASH.set() was called outside a transaction. This should never happen. ASH.set() is meant to be called only after a call to ASH.begin() and before a subsequent call to ASH.commit(). This ensures that all changes made between begin() and commit() will be taken together, as one atomic set of actions ('actions' meaning calls to set() and unset()).");
        send("s "+resource+" "+property+" "+value);
      }
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
        send("us "+resource+" "+property);
      else if(actionSource == 'server'){
        if(property == ASH.TYPE)
          plugins[resourceTypes[resource]].delete(resource);
      }
    },
    begin: function (){
      if(inTransaction)
        console.error("ASH.begin() called twice in a row. This should never happen. Somewhere in the code there is a missing call to ASH.commit().");
      inTransaction = true;
    },
    commit: function(){
      if(inTransaction){
        //TODO implement the gizmo
        inTransaction = false;
      }
      else
        console.error("ASH.commit() called without a matching ASH.begin(). This should never happen. To perform an ASH transaction, call ASH.begin(), do your (non-asynchronous!) stuff, then call ASH.commit(). There is not yet support for nested transactions.");
    },
    TYPE : "type"
  };
})();
