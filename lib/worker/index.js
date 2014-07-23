var colors = require('colors'),
  express = require('express'),
  mkdirp = require('mkdirp'),
  Q = require('q'),
  qs = require('querystring'),
  request = require('request'),
  run = require('../run.js');

function init(options) {
  return Q.nfcall(mkdirp, options.dir)
    .then(function() {
      return run('git --git-dir=bran --work-tree="' + options.dir + '" init',
                 options);
    })
}

function register(options) {
  var url, form;

  url = 'http://' + options.master + '/register-worker';
  form = {
    name: options.name,
    port: options.port
  }

  if (options.verbose) {
    console.error('Registering with %s', options.master);
  }

  request.post(url, {form: form}, function(err, res) {
    if (err) {
      console.error('Failed to register with master: %s'.bold.red, err.message);
    } else if (res.statusCode !== 200) {
      console.error(
        'Failed to register with master: status %d'.bold.red, res.statusCode);
    } else {
      if (options.verbose) {
        console.error('Registration successful');
      }
    }
  });
}

function work(options) {
  var registerWithOptions = register.bind(undefined, options);

  process.nextTick(registerWithOptions);
  setInterval(registerWithOptions, 30000);
}

module.exports = function(options) {
  init(options)
    .then(function() {
      work(options);
    })
    .fail(function(err) {
      console.error('Error: %s'.bold.red, err.message);
      process.exit(1);
    })
    .done();
};
