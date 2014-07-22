var AnsiToHtml = require('ansi-to-html'),
  express = require('express'),
  Job = require('./lib/job'),
  path = require('path');

var app = express(),
  job = null,
  ansiToHtml = new AnsiToHtml();

function sendStatus(res, job, since) {
  var status = {
    active: job ? job.active : false,
    output: job ? job.output.slice(since) : ''
  }

  res.json(status);
}

app.get('/', function(req, res) {
  var since = parseInt(req.query.since || '0', 10);

  if (job && job.active && since === job.output.length) {
    job.once('progress', function() {
      sendStatus(res, job, since);
    });
  } else {
    sendStatus(res, job, since);
  }
});

app.post('/', function(req, res) {
  if (!job || !job.active) {
    //job = new Job('C:\\build');
    job = new Job('/home/greenb/Desktop/build');
  }

  res.end('ok');
});

app.use(express.static(path.join(__dirname, '/public')));

app.listen(3000);
