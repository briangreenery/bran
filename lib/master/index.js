var bodyParser = require('body-parser'),
  express = require('express'),
  pushover = require('pushover'),
  Q = require('q'),
  request = require('request');

module.exports = function(options) {
  var app = express(),
    repos = pushover('.'),
    workers = Workers(),
    exec = Exec();

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

  app.post('/exec', bodyParser.json(), function(req, res) {
    exec.queue(req.body.id, req.body.command, workers.all());
    res.end();
  });

  app.get('/exec/:id', function(req, res) {
    sendOutput(req, res, exec.output(req.params.id));
  });

  app.all('*', function(req, res) {
    repos.handle(req, res);
  });

  app.listen(options.port);
};
