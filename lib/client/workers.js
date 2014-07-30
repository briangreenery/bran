var colors = require('colors'),
  fatal = require('../fatal.js'),
  git = require('../git.js'),
  Q = require('q'),
  request = require('request'),
  textTable = require('text-table');

function getWorkers(options) {
  return Q.nfcall(request, 'http://' + options.master + '/workers');
}

function printWorkers(body) {
  var table, workers;

  workers = JSON.parse(body);

  if (workers.length === 0) {
    console.log('No workers active');
  } else {
    table = [['Name', 'Host', 'Last Heartbeat']];

    workers.forEach(function(worker) {
      table.push([worker.name, worker.host, worker.heartbeat]);
    });

    console.log(textTable(table));
  }
}

module.exports = function(options) {
  options.gitDir = '.bran';
  options.workTree = '.';

  git.getMaster(options)
    .then(function() {
      return getWorkers(options); 
    })
    .spread(function(res, body) {
      return printWorkers(body);
    })
    .fail(function(err) {
      fatal(err);
    })
    .done();
};
