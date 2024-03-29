
var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;
 
var Scripts = new Schema({
  name: String,
  content: String
});

mongoose.connect('mongodb://localhost/mydatabase');
mongoose.model('Script',Scripts);
var Script = mongoose.model('Script');



//clear and repopulate the DB for testing
Script.remove({},function(){
  console.log("db cleared");
  
  var scripts = [
  {
    name: 'A',
    content: 'Apple 13 inch macbook'
  },
  {
    name: 'B',
    content: 'Apple iPad'
  },
  {
    name: 'C',
    content: 'Apple iPhone'
  },
  {
    name: 'D',
    content: 'Apple iPhone 5'
  }
  ];
  
  var saveScript = function(script){
    var scriptInDB = new Script();
    scriptInDB.name = script.name;
    scriptInDB.content = script.content;
    scriptInDB.save(function(err){
      if(err){ console.log( err ); }
      console.log('saved '+script.name);
    });
  }
  for(i in scripts)
    saveScript(scripts[i]);
});

module.exports.all = function(callback){
  Script.find({},callback);
};

// finds the script with the given name.
// callback(error, script)
module.exports.find = function(name,callback){
  Script.findOne({name:name},callback);
};

// inserts a new script with the given name and blank content.
// callback(error)
module.exports.insertNew = function(name, callback) {
  var scriptInDB = new Script();
  scriptInDB.name = name;
  scriptInDB.content = '';
  scriptInDB.save(callback);
}

// sets the content of the script with the given name to the given value
// callback(error)
module.exports.setContent = function(name, content, callback) {
  Script.update({ name: name }, { content:content }, {}, callback)
};
