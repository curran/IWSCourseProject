
var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var Revisions = new Schema({
  name: String,
  version: Number,
  message: {type: String, default:''},
  content: {type: String, default:''}
});

var Scripts = new Schema({
  name: String,
  latestVersion: Number
});

mongoose.connect('mongodb://localhost/mydatabase');
mongoose.model('Script',Scripts);
mongoose.model('Revision',Revisions);

var Script = mongoose.model('Script');
var Revision = mongoose.model('Revision');

var git = require('./git');

// Clear the DB for testing
module.exports.clearDB = function(callback){
  Revision.remove({},function(){
    Script.remove({},callback);
  });
}

module.exports.all = function(callback){
  Script.find({},callback);
};

// finds the script with the given name.
// callback(error, script)
module.exports.findRevision = function(name, version, callback){
  Revision.findOne({name:name, version: version},callback);
};

// inserts a new script with the given name and blank content.
// callback(error, version)
module.exports.insertNew = function(name, callback) {
  var firstVersion = 0.00;
  var script = new Script();
  script.name = name;
  script.latestVersion = firstVersion;
  script.save(function(err){
    var revision = new Revision();
    revision.name = name;
    revision.version = firstVersion;
    revision.save(function(err){
      git.createRepo(name,function(err){
        if(err) throw err;
        git.tagRepo(name, firstVersion, function(err){
          console.log('repo tagged');
          callback(err,firstVersion);
        })
      });
    });
  });
}

// sets the content of the script with the given name to the given value
// callback(error, version)
module.exports.setContent = function(name, content, message, callback) {
  Script.findOne({ name: name }, function(err, script){
    script.latestVersion = Math.round(script.latestVersion*100+1)/100.0;
    // script.latestVersion + 0.01 leads to stuff like 0.10999999999999999
    
    script.save(function(err){
      var revision = new Revision();
      revision.name = name;
      revision.version = script.latestVersion;
      revision.content = content;
      revision.message = message;
      revision.save(function(err){
        callback(err,revision.version);
      });
    });
  });
};

module.exports.findAllRevisions = function(name, callback){
  Revision.find({ name: name }, callback);
};

module.exports.disconnect = function(){
  mongoose.disconnect();
};
