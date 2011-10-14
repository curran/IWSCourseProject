// TODO have the script content backed by Git
// Curran 10/14/2011

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;
    
var Scripts = new Schema({
  name: String,
  version: Number
});


mongoose.connect('mongodb://localhost/mydatabase');
mongoose.model('Script',Scripts);
var Script = mongoose.model('Script');

//clear the DB because this is a test
Script.remove({},function(){
  console.log("db cleared");

  var script = new Script();
  script.name = 'a';
  script.version = 0.1;
  script.save(function(err){
    if(err){ console.log( err ); }
    console.log('saved');
    mongoose.disconnect();
  });

  Script.find({},function(err, scripts){
    scripts.forEach(function(script){
      console.log(script);
    });
  });
});
/*

var scripts =
[{
  name: 'a',
  version: 0.1,
  dependencies: []
},
{
  name: 'b',
  version: 0.1,
  dependencies: [
    {name:'a',version:0.1}
  ]
},
{
  name: 'a',
  version: 0.2,
  dependencies: []
},
{
  name: 'c',
  version: 0.1,
  dependencies: [
    {name:'b',version:0.1},
    {name:'a',version:0.2}
  ]
}];

function getScript(scriptInfo){
  for(i in scripts){
    var script = scripts[i];
    if(script.name == scriptInfo.name && script.version == scriptInfo.version)
      return script;
  }
}

// Evaluating dependencies of c0.1 should result in [a0.2,b0.1,c0.1]
function addDependencies(script, dependencies){
  var scriptAlreadyInDependencies = false;
  // if the script is already in the list but using an older version,
  for(var i in dependencies){
    var dependency = dependencies[i];
    if(dependency.name == script.name){
      scriptAlreadyInDependencies = true;
      // use the latest version of the script
      if(dependency.version < script.version)
        dependencies[i] = script;
    }
  }
  if(!scriptAlreadyInDependencies)
    dependencies.push(script);
  for(var i in script.dependencies){
    var dependency = getScript(script.dependencies[i]);
    addDependencies(dependency,dependencies);
  }
}

function evaluateDependencies(script){
  var dependencies = [];
  addDependencies(script,dependencies);
  return dependencies.reverse();
}

var script = scripts[3];
console.log(script.name+script.version+' depends:');
var dependencies = evaluateDependencies(script);
for(var i in dependencies){
  var d = dependencies[i];
  console.log(' '+d.name+d.version);
}*/
