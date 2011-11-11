var db  = require('./db'),
    git = require('./git');

// The version number used as the first version for new scripts.
// TODO make this into a string
var firstVersion = 0;

function insertNew(name, callback) {
  db.insertNewScript(name, firstVersion, function(err){
    if(err) callback(err);
    else git.createRepo(name,function(err){
      if(err) callback(err);
      else git.tagRepo(name, firstVersion, callback);
    });
  });
}

function setContent(name, content, message, callback) {
  db.incrementLatestVersion(name, function(err, latestVersion){
    db.saveRevision({
      name: name,
      content: content,
      message: message,
      version: latestVersion
    },function(err){
      if(err) callback(err);
      else git.setContent(name, content, function(err){
        if(err) callback(err);
        else git.tagRepo(name, latestVersion, function(err){
          callback(err, latestVersion);
        });
      });
    });
  });
};

function findRevisionWithContent(name, version, callback){
  db.findRevision(name, version, function(err, revision){
    if(err) callback(err);
    else git.getContent(name, version, function(err, content){
      if(err) callback(err);
      else{
        revision.content = content;
        callback(err, revision);
      }
    });
  });
}

// gets the content of the given revision
// getContent(name, version, callback(err, content))
module.exports.getContent = git.getContent;

function addScriptToDependencies(script, dependencies, callback){
  var scriptAlreadyInDependencies = false;
  // if the script is already in the list but using an older version,
  for(var i in dependencies){
    var dependency = dependencies[i];
    if(dependency.name == script.name){
      scriptAlreadyInDependencies = true;
      // use the latest version of the script instead
      if(dependency.version < script.version)
        dependencies[i] = script;
    }
  }
  
  // otherwise just add the script to the end of the list
  if(!scriptAlreadyInDependencies)
    dependencies.push(script);
  
  callback();
}

function addDependenciesOfScript(script, dependencies, callback){
  if(script.dependencies.length != 0){
    var left = script.dependencies.length;
    // this approach parallelizes IO for each dependency of a script,
    // which works because the order of dependencies of a given script 
    // doesn't matter, and this code ensures that all dependencies are
    // in the dependency list before the scripts that depend on them.
    script.dependencies.forEach(function(dependency){
      db.findRevision(dependency.name, dependency.version,
                   function(err, dependency){
        // add this script's dependencies to the dependency list,
        addDependenciesOfScript(dependency,dependencies,function(){
          if(--left === 0)
            // then add this script itself to the dependency list
            // and call the callback
            addScriptToDependencies(script,dependencies,callback);
        });
      });
    });
  }
  else
    addScriptToDependencies(script,dependencies,callback);
}

function evaluateDependencies(name,version,callback){
  db.findRevision(name, version, function(err,revision){
    var dependencies = [];
    addDependenciesOfScript(revision,dependencies,function(){
      callback(dependencies);
    });
  });
}

// Finds the revision with the given name and version.
// callback(error, revision) where 'revision' has:
//  - name: String
//  - version: Number
//  - dependencies: [{name: String, version: Number}]
//  - template: {name: String, version: Number}
//  - message: String
//  - content: String <- retrieved from the Git repository
module.exports.findRevisionWithContent = findRevisionWithContent;

// Sets the content of the given script. This causes the following:
//  - The 'latestRevision' of this Script database entry is incremented.
//  - A new Revision entry is inserted into the database, storing
//    the 'message' argument.
//  - The content of the Git repository associated with the Script
//    is updated to the given content, and tagged with the new version.
// The callback is called with the new version number.
//
// setContent(name, content, message, callback(error, newVersion))
module.exports.setContent = setContent;

// Inserts a new empty script with the given name and version.
// This creates a new Script entry in the database, a first
// Revision entry in the database, and also initializes a new
// Git repository for the new script.
// insertNew(name, callback(error))
module.exports.insertNew = insertNew;

// The version number used as the first version for new scripts.
module.exports.FIRST_VERSION = firstVersion;

// sets the prefix of the directory path used.
// stays the default when running app.js
// must be changed when node working dir is different (e.g. in export.js)
module.exports.setDirectoryPrefix = git.setDirectoryPrefix;

// Evaluates the dependencies of the given revision.
// If two versions of the same script are required, only the most
// recent version is included.
// The callback is called with 'dependencies', a list of objects
// each with the properties
//  - name
//  - version
// in topologically sorted order (including the given script).
//
// evaluateDependencies(name,version,callback(dependencies))
module.exports.evaluateDependencies = evaluateDependencies;

// Finds and returns the given revision (only metadata, no content)
// callback(err, revision)
module.exports.findRevision = db.findRevision;

// Finds all scripts.
// findAllScripts(callback(err, allScripts)) where allScripts is an 
// array of objects which each have the following properties:
//  - name: String,
//  - latestVersion: Number
module.exports.findAllScripts = db.findAllScripts;
module.exports.findAllRevisions = db.findAllRevisions;
