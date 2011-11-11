// A module for interacting with a MongoDB 
// store of Script and Revision entries.
//
// API documentation at the bottom of the file.
//
// Author: Curran Kelleher
// Last updated 11/11/2011

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
}

function findAllRevisions(name, callback){
  Revision.find({ name: name }, callback);
}

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
    //TODO handle errors when:
    // - syntax error (wrong number of tokens)
    // - @depends or @embed points to nonexistent revisions
    // - @embed target doesn't contain exactly one '${code}'
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
      // TODO report error when multiple '@embed in's are found
      revisionInDB.template = {
        name: name, version: version
      };
    }
    //TODO parse occurances of '${code}'
    //TODO report error when '${code}' is present with 
    //     either '@depends on' or '@embed in'
  });
  revisionInDB.save(callback);
}

function incrementLatestVersion(name, callback){
  Script.findOne({ name: name }, function(err, script){
    if(err) callback(err);
    else{
      //TODO use strings to always get nice looking versions
      // of the form X+.XX
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

// insertNewScript(name, firstVersion, callback(error))
//
// Inserts a new Script entry into the database with
// the given 'name', then inserts a new Revision entry 
// into the database has the version number 'firstVersion'.
module.exports.insertNewScript = insertNewScript;


// saveRevision(revision, callback(error))
//
// Saves the given 'revision' to the database, which is
// expected to be an object with the following properties:
//  - name:String - The name of the Script to which this
//                  revision belongs.
//  - version:String - The version number of this revision.
//  - message:String - The commit message for this revision
//  - content:String - The code content of this revision,
//                     used only for extracting occurances of
//                     '@depends on', '@embed in', and '${code}'.
//                     The content is not stored in the database.
module.exports.saveRevision = saveRevision;

// incrementLatestVersion(name, callback(error, latestVersion))
//
// Increments the latest version of the Script database entry
// with the given 'name' and passes the new latest version number
// to the callback.
module.exports.incrementLatestVersion = incrementLatestVersion;

// findAllScripts(callback(error, allScripts))
// 
// Finds all Script entries in the database.
// The callback argument 'allScripts' is an array
// of objects which each have the following properties:
//  - name: String - The name of the script
//  - latestVersion: String - The latest version of the script
module.exports.findAllScripts = findAllScripts;

// findAllRevisions(callback(error, allRevisions))
//
// Finds all revisions of the given script. The callback
// argument 'allRevisions' is an array of objects which 
// each have the following properties:
//  - name: String - The name of the Script to which 
//                   this revision belongs.
//  - version: Number - The version of this revision
//  - dependencies: [{name: , version: }] 
//    - The dependencies of this revision, an array of
//      objects referring to Revisions by name and version.
//  - template: {name: , version: } - A reference to the script
//                                    which serves as a template
//                                    for this revision.
//  - message: String - The commit message of this revision.
module.exports.findAllRevisions = findAllRevisions;

// findRevision(name, version, callback(error, revision))
//
// Finds the revision with the given name and version.
// The callback argument 'revision' has:
//  - name: String - The name of the Script to which 
//                   this revision belongs.
//  - version: Number - The version of this revision
//  - dependencies: [{name: , version: }] 
//    - The dependencies of this revision, an array of
//      objects referring to Revisions by name and version.
//  - template: {name: , version: } - A reference to the script
//                                    which serves as a template
//                                    for this revision.
//  - message: String - The commit message of this revision.
module.exports.findRevision = findRevision;

/******************************************
 * Methods below intended for use only by *
 * import, export, and testing scripts.   *
 ******************************************/

// clearDB(callback(error))
//
// Clear the entire database.
module.exports.clearDB = clearDB;

// disconnect()
//
// Disconnects from MongoDB so the Node process can end.
module.exports.disconnect = mongoose.disconnect;
