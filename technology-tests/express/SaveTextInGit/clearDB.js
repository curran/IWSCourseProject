var scripts = require('./scripts');
scripts.clearDB(function(){
  scripts.disconnect();
  console.log("Database cleared.");
});


