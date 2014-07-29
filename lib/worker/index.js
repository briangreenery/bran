var bodyParser = require('body-parser'),
  Exec = require('./exec.js'),
  express = require('express'),
  fatal = require('../fatal.js'),
  init = require('./init.js'),
  Output = require('../output'),
  register = require('./register.js');

function work(options) {
  var app = express(),
    exec = Exec();

  app.post('/exec', bodyParser.json(), function(req, res) {
    exec.queue(req.body.id, req.body.command);
    res.end();
  });

  app.get('/exec/:id', function(req, res) {
    Output.send(req, res, exec.output(req.params.id));
  });

  app.listen(options.port);
}

module.exports = function(options) {
  options.gitDir = 'bran';

  init(options)
    .then(function() {
      return register(options);
    })
    .then(function() {
      return work(options)
    })
    .fail(function(err) {
      fatal(err);
    })
    .done();
};
