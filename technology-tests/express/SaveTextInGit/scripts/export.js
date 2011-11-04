var arguments = process.argv.splice(2);
if(!arguments[0])
  console.log("An argument is expected which specifies the output file.");
else{
  var scripts = require('../modules/scripts');
  scripts.setDirectoryPrefix('..');
  scripts.all(function(err, allScripts){
    (function iterateScript(){
      if(allScripts.length === 0)
        scripts.disconnect();
      else {
        var script = allScripts.splice(0,1)[0];
        scripts.findAllRevisions(script.name, function(err, allRevisions){
          console.log('script: '+script.name);
          (function iterateRevision(){
            if(allRevisions.length === 0)
              iterateScript();
            else {
              var revision = allRevisions.splice(0,1)[0];
              scripts.getContent(revision.name, revision.version, function(err, content){
                console.log('  content: '+content);
                console.log('');
                iterateRevision();
              });
            }
          })();
        });
      }
    })();
  });
}
