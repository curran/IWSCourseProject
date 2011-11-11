// Module documentation at the bottom of the file.

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var RevisionPointers = new Schema({
  name: String,
  version: Number
});

var Revisions = new Schema({
  name: String,
  version: Number,
  dependencies: [RevisionPointers],
  template: {
    name: String,
    version: Number
  },
  message: {type: String, default:''}
});

var Scripts = new Schema({
  name: String,
  latestVersion: Number
});

mongoose.connect('mongodb://localhost/mydatabase');
var Script = mongoose.model('Script', Scripts);
var Revision = mongoose.model('Revision', Revisions);

function clearDB(callback){
  Revision.remove({},function(){
    Script.remove({},callback);
  });
}

function findAllScripts(callback){
  Script.find({},callback);
};

function findAllRevisions(name, callback){
  Revision.find({ name: name }, callback);
};

function insertNewScript(name, firstVersion, callback){
  var script = new Script(), revision = new Revision();
  script.name = revision.name = name;
  script.latestVersion = revision.version = firstVersion;
  script.save(function(err){
    if(err) callback(err);
    else revision.save(callback);
  });
}

// Parses the dependencies out of the given script content.
// callbacks.dependsOn(name, version) is called for each '@depends' occurance.
// callbacks.embedIn(name, version) is called for each '@embed in' occurance.
function parseContent(content, callbacks){
  var lines = content.split('\n');
  for(var i = 0; i < lines.length; i++){
    var line = lines[i];
    var dependsOn = line.indexOf('@depends') != -1;
    var embedIn = line.indexOf('@embed') != -1;
    
    if(dependsOn || embedIn){
      var tokens = line.split(' ');
      var name = tokens[2];
      var version = tokens[3];
      if(dependsOn)
        callbacks.dependsOn(name, version);
      else if(embedIn)
        callbacks.embedIn(name, version);
    }
  }
}

function saveRevision(revision, callback){
  var revisionInDB = new Revision();
  revisionInDB.name = revision.name;
  revisionInDB.version = revision.version;
  revisionInDB.message = revision.message;
  parseContent(revision.content, {
    dependsOn: function(name, version){
      revisionInDB.dependencies.push({
        name: name, version: version
      });
    },
    embedIn: function(name, version){
      revisionInDB.template = {
        name: name, version: version
      };
    }
  });
  revisionInDB.save(callback);
}

function incrementLatestVersion(name, callback){
  Script.findOne({ name: name }, function(err, script){
    if(err) callback(err);
    else{
      script.latestVersion = Math.round(script.latestVersion*100+1)/100.0;
      // script.latestVersion + 0.01 leads to stuff like 0.10999999999999999
      script.save(function(err){
        callback(err, script.latestVersion);
      });
    }
  });
}

function findRevision(name, version, callback){
  Revision.findOne({
    name: name, version: version
  }, function(err, revision){
    if(err) callback(err);
    else callback(null, revision.toObject());
  });
};

// inserts a new script and its first version into
// the database, with the given name and blank content.
// callback(error)
module.exports.insertNewScript = insertNewScript;

// Clear the DB for testing
// callback(error)
module.exports.clearDB = clearDB;

// Saves the given revision to the database.
// saveRevision(revision, )
// revision = { name:,  version:, message:, content:}
// callback(error)
module.exports.saveRevision = saveRevision;

// Increments the latest version of the script with the given name,
// and calls the callback with the new latest version number.
// incrementLatestVersion(name, callback(error, latestVersion))
module.exports.incrementLatestVersion = incrementLatestVersion;

// Disconnects from MongoDB (useful only for import/export scripts)
module.exports.disconnect = mongoose.disconnect;

// Finds all scripts.
// findAllScripts(callback(err, allScripts)) where allScripts is an 
// array of objects which each have the following properties:
//  - name: String,
//  - latestVersion: Number
module.exports.findAllScripts = findAllScripts;

// Finds all revisions of the given script.
// findAllRevisions(callback(err, allRevisions)) where allRevisions is an 
// array of objects which each have the following properties:
//  - name: String
//  - version: Number
//  - dependencies: [{name: String, version: Number}]
//  - template: {name: String, version: Number}
//  - message: String
module.exports.findAllRevisions = findAllRevisions;

// Finds the revision with the given name and version.
// callback(error, revision) where 'revision' has:
//  - name: String
//  - version: Number
//  - dependencies: [{name: String, version: Number}]
//  - template: {name: String, version: Number}
//  - message: String
module.exports.findRevision = findRevision;
