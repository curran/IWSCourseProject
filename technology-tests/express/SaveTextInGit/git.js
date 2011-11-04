var spawn = require('child_process').spawn;
var fs = require('fs');

function dirFromName(name){ return './repos/'+name; }

function executeCommands(dir, queue, callback){
  (function iterate(){
    if(queue.length === 0)
      callback();
    else{
      var task = queue.splice(0,1)[0];
      var child = spawn(task.command,task.args,{ 
        cwd: dir, env: process.env, 
        customFds: [-1, -1, -1]});
      
      child.on('exit', function(code){
        console.log('done');
        iterate();
      });
    }
  })();
}

// creates a new Git repository with the given name,
// containing a single file called content.txt
// callback(err)
module.exports.createRepo = function(name,callback){
  executeCommands(dirFromName(name),[
    {command:'touch', args:['content.txt']},
    {command:'git', args:['init']},
    {command:'git', args:['add','*']},
    {command:'git', args:['commit','-m','Initial Creation']},
  ], callback);
}

// tags a the given git repository name with the given version
// callback(err)
module.exports.tagRepo = function(name, version, callback){
  executeCommands(dirFromName(name),[
    {command:'git', args:['commit','-m','made change']},
    {command:'git', args:['tag','-a',version,'-m','new version']}
  ], callback);
}
