var express = require('express');

var app = express.createServer();

app.configure(function(){
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

// NODE_ENV=scription node app.js
app.configure('scription',function(){
  app.use(express.logger());
  app.use(express.errorHandler());
});

app.set('view engine','jade');
app.set('views',__dirname + '/views');

var scripts = require('./scripts');

app.get('/', function(req, res){
  scripts.all(function(err, allScripts){
    if(err) throw err;
    res.render('root', {locals: {
      scripts: allScripts
    }});
  });
});

app.get('/scripts/new', function(req, res){
  res.render('scripts/new');
});

app.post('/scripts', function(req, res){
  var name = req.body.script.name;
  scripts.insertNew(name, function(err){
    if(err) throw err;
    res.redirect('/scripts/' + name);
  });
});

app.get('/scripts/:name', function(req, res) {
  scripts.find(req.params.name,function(err, script){
    if(err) throw err;
    res.render('scripts/edit', {locals: {
      script: script
    }});
  });
});

app.put('/scripts/:name', function(req, res){
  var name = req.params.name;
  scripts.setContent(name, req.body.script.content,function(err){
    if(err) throw err;
    res.redirect('/scripts/'+name);
  });
});

app.listen(4000);
