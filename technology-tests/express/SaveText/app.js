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

app.get('/', function(req, res){
  res.render('root', {locals: {
    scripts: scripts.all
  }});
});

var scripts = require('./scripts');

app.get('/scripts/new', function(req, res){
  res.render('scripts/new', {locals: {
    script: scripts.new()
  }});
});

app.post('/scripts', function(req, res){
  var id = scripts.insert(req.body.script);
  res.redirect('/scripts/' + id);
});

app.get('/scripts/:id', function(req, res) {
  var script = scripts.find(req.params.id);
  res.render('scripts/edit', {locals: {
    script: script
  }});
});

app.put('/scripts/:id', function(req, res){
  var id = req.params.id;
  scripts.setContent(id, req.body.script.content);
  res.redirect('/scripts/'+id);
});

app.listen(4000);
