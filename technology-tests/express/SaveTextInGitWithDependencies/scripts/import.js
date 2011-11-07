// Imports the content of the given export file (generated by export.js)
// It is assumed that before running this script, the script clearStore.sh
// is run first.

var scripts = require('../modules/scripts'),
    fs = require('fs'),
    lazy = require("lazy");

var arguments = process.argv.splice(2);
if(!arguments[0])
  console.log("An argument is expected which specifies the input JSON text file.");
else{
  var inputFileName = arguments[0];
  var inFileStream = fs.createReadStream(inputFileName, { 'bufferSize': 1  });
  inFileStream.on('close', function () {
    console.log('done reading file');
    scripts.disconnect();
  });
  scripts.setDirectoryPrefix('..');
  new lazy(inFileStream)
    .lines
    .forEach(
      function(line) 
      { 
        var object = JSON.parse(line);
        
        inFileStream.pause();
        
        if(object.type == 'script'){
          var script = object;
          console.log('got script: '+script.name);
          scripts.insertNew(script.name,function(err, version){
            if(err) throw err;
              inFileStream.resume();
          });
        }
        
        else if(object.type == 'revision'){
          var revision = object;
          console.log('got revision: '+revision.name+revision.version);
          scripts.setContent(
            revision.name, 
            revision.content, 
            revision.message, function(err, version){
              if(version != revision.version)
                throw new Error('mismatched versions');
              inFileStream.resume();
            }
          );
        }
      }
    );
}
