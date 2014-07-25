var colors = require('colors'),
  fatal = require('../fatal.js'),
  git = require('../git.js'),
  moment = require('moment'),
  Q = require('q'),
  request = require('request'),
  table = require('text-table');

function getStatus(options) {
  return Q.nfcall(request, 'http://' + options.master + '/status');
}

function printStatus(body) {
  var worker, workers = [], status = JSON.parse(body);

  workers.push(['Name', 'Host', 'Last Heartbeat']);

  for (worker in status) {
    workers.push([
      status[worker].name,
      status[worker].ip + ':' + status[worker].port,
      moment(status[worker].heartbeat).fromNow()
    ])
  }

  if (workers.length === 1) {
    console.log('No workers active');
  } else {
    console.log(table(workers));
  }
}

module.exports = function(options) {
  options.gitDir = '.bran';
  options.workTree = '.';

  git.getMaster(options)
    .then(function() {
      return getStatus(options); 
    })
    .spread(function(res, body) {
      return printStatus(body);
    })
    .fail(function(err) {
      fatal(err);
    })
    .done();
};
