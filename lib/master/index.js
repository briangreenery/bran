var bodyParser = require('body-parser'),
  express = require('express'),
  pushover = require('pushover');

function queueBuild(worker, param) {
  var url = worker.makeUrl('/queue-build');
  var body = {form: param};
  return Q.nfcall(request.post, url, body);
}

function queueBuilds(workers, param) {
  var promises = [];

  workers.forEach(function(worker) {
    promises.push(queueSingleBuild(worker, param));
  });

  return Q.all(promises);
}

module.exports = function(options) {
  var app = express(),
    repos = pushover('.'),
    workers = {};

  app.use(bodyParser.urlencoded({extended: false}));

  app.post('/register-worker', function(req, res) {
    workers[req.body.name] = {
      name: req.body.name,
      ip: req.connection.remoteAddress,
      port: req.body.port,
      heartbeat: new Date(),
    };

    res.end();
  });

  app.get('/status', function(req, res) {
    res.json(workers);
  });

  app.post('/queue-build', function(req, res) {
    queueBuilds(workers, req.body)
      .then(function() {
        res.end()
      })
      .fail(function(err) {
        res.status(500).end(err.toString());
      })
      .done();
  });

  app.get('/build-status', function(req, res) {
    res.end('ok');
  });

  app.all('*', function(req, res) {
    repos.handle(req, res);
  });

  app.listen(options.port);
};
