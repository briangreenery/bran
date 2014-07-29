var express = require('express'),
  fatal = require('../fatal.js'),
  init = require('./init.js'),
  register = require('./register.js');

function work(options) {
  var app = express();
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
