var bodyParser = require('body-parser'),
  express = require('express'),
  Output = require('../output'),
  pushover = require('pushover'),
  Q = require('q'),
  request = require('request'),
  Workers = require('./workers.js'),
  Build = require('./build.js');

module.exports = function(options) {
  var app = express(),
    repos = pushover('.'),
    workers = Workers(),
    build = Build();

  repos.on('push', function (push) {
    console.log('Push %s/%s (%s)', push.repo, push.commit, push.branch);
    push.accept();
  });

  repos.on('fetch', function (fetch) {
    console.log('Fetch %s', fetch.commit);
    fetch.accept();
  });

  app.post('/workers', bodyParser.json(), function(req, res) {
    workers.add(req.body.name, req.connection.remoteAddress, req.body.port);
    res.end();
  });

  app.get('/workers', function(req, res) {
    res.json(workers.all());
  });

  app.post('/build', bodyParser.json(), function(req, res) {
    build.queue(req.body.id,
                req.body.ref,
                req.body.branch,
                req.body.clean,
                workers.all());
    res.end();
  });

  app.get('/build/:id', function(req, res) {
    var output = build.output(req.params.id);

    if (output) {
      Output.send(req, res, build.output(req.params.id));
    } else {
      res.status(404);
      res.end('No build output for ' + req.params.id);
    }
  });

  app.all('*', function(req, res) {
    repos.handle(req, res);
  });

  app.listen(options.port);
};
