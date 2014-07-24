var bodyParser = require('body-parser'),
  express = require('express'),
  pushover = require('pushover'),
  Q = require('q'),
  request = require('request');

function queueBuild(worker, params) {
  console.error('Queueing %s on %s (%s:%s)',
                params.commit,
                worker.name,
                worker.ip,
                worker.port);

  var url = 'http://' + worker.ip + ':' + worker.port + '/queue-build';
  var body = {form: params};
  return Q.nfcall(request.post, url, body);
}

function queueBuilds(workers, params) {
  var promises = [];

  for (worker in workers) {
    promises.push(queueBuild(workers[worker], params));
  }

  return Q.all(promises);
}

module.exports = function(options) {
  var app = express(),
    repos = pushover('.'),
    workers = {};

  repos.on('push', function (push) {
    console.log('Push %s/%s (%s)', push.repo, push.commit, push.branch);
    push.accept();
  });

  repos.on('fetch', function (fetch) {
    console.log('Fetch %s', fetch.commit);
    fetch.accept();
  });

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
    console.error('Build requested %s', req.body.commit);
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
