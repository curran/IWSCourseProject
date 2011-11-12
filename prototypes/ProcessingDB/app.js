var express = require('express'),
    scripts = require('./modules/scripts');;

var app = express.createServer();

app.configure(function(){
  app.use(express.logger());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/static'));
});

// NODE_ENV=development node app.js
app.configure('development',function(){
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

// NODE_ENV=production node app.js
app.configure('production',function(){
  app.use(express.errorHandler());
});

app.set('view engine','jade');
app.set('views',__dirname + '/views');

app.get('/', function(req, res){
  scripts.findAllScripts(function(err, allScripts){
    if(err) throw err;
    res.render('root', {locals: {
      scripts: allScripts
    }});
  });
});

app.get('/about', function(req, res){
  res.render('about');
});

app.get('/scripts/new', function(req, res){
  res.render('scripts/new', {locals:{hasError:false}});
});

app.post('/scripts', function(req, res){
  var name = req.body.script.name;
  scripts.insertNew(name, function(err){
    if(err){
      if(err.toString().indexOf("File exists") != -1)
        // TODO change this to AJAX validation
        // (only show 'Create' button when name is not taken)
        res.render('scripts/new', {locals:{
          hasError:true,
          error:"Oops! The script name \""+name
               +"\" is already taken. Please choose another name.",
          name:name}});
      else
        res.render('scripts/error', {locals: {error:err}});
      console.log('"'+err+'"');
    }
    else res.redirect('/scripts/'+name+'/'+scripts.FIRST_VERSION);
  });
});

app.get('/scripts/:name/versions', function(req, res) {
  scripts.findAllRevisions(req.params.name,function(err, revisions){
    if(err)
      res.render('scripts/error', {locals: {error:err}});
    else 
      res.render('scripts/versions', {locals: {
        name:req.params.name,
        revisions: revisions
      }});
  });
});

app.get('/scripts/:name/:version', function(req, res) {
  scripts.findRevisionWithContent(req.params.name,
                                  req.params.version,
                                  function(err, revision){
    if(err)
      res.render('scripts/error', {locals: {error:err}});
    else 
      res.render('scripts/edit', {locals: {revision: revision}});
  });
});

app.get('/scripts/:name/:version/run', function(req, res) {
  var name = req.params.name, version = req.params.version;
  
  scripts.findRevision(name, version, function(err, revision){
    function getTemplatePieces(callback){
      if(revision.template)
        scripts.getContent(revision.template.name,
                           revision.template.version,
                           function(err, content){
          var pieces = content.split('${code}');
          callback(true,pieces[0], pieces[1]);
        });
      else
        callback(false,null,null);
    }
    
    getTemplatePieces(function(hasTemplate, firstHalf, secondHalf){
      scripts.evaluateDependencies(name,version,function(dependencies){
        if(hasTemplate)
          res.write(firstHalf);
        res.write('// scripts included: ');
        for(var i in dependencies){
          var d = dependencies[i];
          res.write(' '+d.name+' v'+d.version);
        }
        res.write('\n');
        
        // TODO handle errors
        (function iterate(){
          if(dependencies.length === 0){
            if(hasTemplate)
              res.write(secondHalf);
            res.end();
          }
          else{
            var d = dependencies.splice(0,1)[0];
            scripts.getContent(d.name, d.version, function(err, content){
              if(err) throw err;
              var lines = content.split('\n');
              for(var i = 0; i < lines.length; i++){
                var line = lines[i];
                if(line.indexOf('@depends') === -1 &&
                   line.indexOf('@embed') === -1)
                  res.write(line + '\n');
              }
              iterate();
            });
          }
        })();
      });
    });
  });
});

app.put('/scripts/:name', function(req, res){
  var name = req.params.name;
  var content = req.body.revision.content;
  var message = req.body.revision.message;
  
  scripts.setContent(name, content, message, function(err, version){
    if(err) throw err;
    res.redirect('/scripts/'+name+'/'+version);
  });
});

app.listen(4000);
