var colors = require('colors'),
  es = require('event-stream'),
  http = require('http'),
  moment = require('moment'),
  Q = require('q'),
  run = require('../run.js'),
  table = require('text-table');

function getStatus(master) {
  var options, deferred = Q.defer();

  options = {
    host: master.split(':')[0],
    port: master.split(':')[1],
    path: '/status'
  };

  http.request(options, function(res) {
    if (res.statusCode !== 200) {
      return deferred.reject('Bad status code: ' + res.statusCode);
    }

    res.pipe(es.wait(function(err, text) {
      if (err) {
        return deferred.reject(err);
      }

      deferred.resolve(text);
    }));
  })
  .on('error', function(err) {
    deferred.reject(err);
  })
  .end();

  return deferred.promise;
}

function printStatus(text) {
  var worker, workers = [], status = JSON.parse(text);

  workers.push(['Name', 'Host', 'Last Heartbeat']);

  for (worker in status) {
    workers.push([
      status[worker].name,
      status[worker].ip + ':' + status[worker].port,
      moment(status[worker].heartbeat).fromNow()
    ])
  }

  if (workers.length == 0) {
    console.log('No workers active');
  } else {
    console.log(table(workers));
  }
}

module.exports = function(options) {
  run('git --git-dir=.bran config bran.master', options)
    .then(function(master) {
      return getStatus(master);
    })
    .then(function(status) {
      return printStatus(status);
    })
    .fail(function(err) {
      console.error('Error: %s'.bold.red, err.message);
      process.exit(1);
    })
    .done();
};
