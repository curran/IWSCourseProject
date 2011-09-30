var ASH = (function() {
  var socket = io.connect('/');
  socket.on('executeTransaction', function (data) {
    actionSource = 'server';
    for(i in data){
      var tokens = data[i].split(" ");
      if(tokens[0] == 's')
      //commitTransaction("s "+resource+" "+property+" "+value);
        ASH.set(tokens[1],tokens[2],tokens[3]);
      else if(tokens[0] == 'us')
      //commitTransaction("us "+resource+" "+property);
        ASH.unset(tokens[1],tokens[2]);
    }
    actionSource = 'client';
  });
  
  function send(data){
    socket.emit('commitTransaction', data);
  }
  
  var resourceIdMin = -1; // assigned by the server
  var resourceIdMax = -1; // assigned by the server
  var resourceIdCounter = -1; // used by ASH.genResourceId()
  // always true: (resourceIdMin <= resourceIdCounter < resourceIdMax )
  
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
        if(inTransaction)
          currentTransaction.push("s "+resource+" "+property+" "+value);
        else
          console.error("ASH.set() was called outside a transaction. This should never happen. ASH.set() is meant to be called only after a call to ASH.begin() and before a subsequent call to ASH.commit(). This ensures that all changes made between begin() and commit() will be taken together, as one atomic set of actions ('actions' meaning calls to set() and unset()).");
        
      }
      else if(actionSource == 'server'){
        if(property == ASH.TYPE){
          var type = value;
          if(resourceTypes[resource] != undefined)
            console.error("Fatal error: creating a resource twice with the same Id: '"+resource+"'");
          resourceTypes[resource] = type;
          resources[resource] = plugins[type].create(resource);
        }
        else
          resources[resource].set(property,value);
      }
    },
    unset: function (resource, property) {
      if(actionSource == 'client'){
        if(inTransaction)
          currentTransaction.push("us "+resource+" "+property);
        else
          console.error("ASH.unset() was called outside a transaction. This should never happen. ASH.unset() is meant to be called only after a call to ASH.begin() and before a subsequent call to ASH.commit(). This ensures that all changes made between begin() and commit() will be taken together, as one atomic set of actions ('actions' meaning calls to set() and unset()).");
      }
      else if(actionSource == 'server'){
        if(property == ASH.TYPE)
          // TODO add console.log.error("attempted to delete a non-existent resource, with id '"+resource+"'")
          plugins[resourceTypes[resource]].delete(resource);
        else
          resources[resource].unset(property);
      }
    },
    begin: function (){
      if(inTransaction)
        console.error("ASH.begin() called twice in a row. This should never happen. Somewhere in the code there is a missing call to ASH.commit().");
      inTransaction = true;
    },
    commit: function(){
      if(inTransaction){
        send(currentTransaction);
        currentTransaction = [];
        inTransaction = false;
      }
      else
        console.error("ASH.commit() called without a matching ASH.begin(). This should never happen. To perform an ASH transaction, call ASH.begin(), do your (non-asynchronous!) stuff, then call ASH.commit(). There is not yet support for nested transactions.");
    },
    TYPE : "type"
  };
})();
