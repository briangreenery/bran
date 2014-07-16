var AnsiToHtml = require('ansi-to-html'),
  express = require('express'),
  Job = require('./lib/job'),
  path = require('path');

var app = express(),
  job = Job(),
  ansiToHtml = new AnsiToHtml();

app.get('/', function(req, res) {
  job.start();
  res.sendfile('public/index.html');
});

app.get('/status', function(req, res) {
  var status = {
    active: job.active,
    output: ansiToHtml.toHtml(job.currentOutput())
  }
  res.json(status);
});

app.use(express.static(path.join(__dirname, '/public')));

app.listen(3000);
