// var bodyParser = require('body-parser'),
//   colors = require('colors'),
//   express = require('express'),
//   mkdirp = require('mkdirp'),
//   Q = require('q'),
//   qs = require('querystring'),
//   request = require('request'),
//   run = require('../run.js');

// function createBuildDir(options) {
//   return Q.nfcall(mkdirp, options.dir);
// }

// function register(options) {
//   var url, form;

//   url = 'http://' + options.master + '/register-worker';
//   form = {
//     name: options.name,
//     port: options.port
//   }

//   if (options.verbose) {
//     console.error('Registering with %s', options.master);
//   }

//   request.post(url, {form: form}, function(err, res) {
//     if (err) {
//       console.error('Failed to register with master: %s'.bold.red, err.message);
//     } else if (res.statusCode !== 200) {
//       console.error(
//         'Failed to register with master: status %d'.bold.red, res.statusCode);
//     } else {
//       if (options.verbose) {
//         console.error('Registration successful');
//       }
//     }
//   });
// }

// function keepRegistering(options) {
//   var registerWithOptions = register.bind(undefined, options);
//   process.nextTick(registerWithOptions);
//   setInterval(registerWithOptions, 10000);
// }

// function work(options) {
//   var app = express();

//   app.use(bodyParser.urlencoded({extended: false}));

//   app.post('/queue-build', function(req, res) {
//     console.error('Build requested %s', req.body.commit);
//     queueBuilds(workers, req.body)
//       .then(function() {
//         res.end()
//       })
//       .fail(function(err) {
//         res.status(500).end(err.toString());
//       })
//       .done();
//   });

//   app.listen(options.port);
// }

// module.exports = function(options) {
//   createBuildDir(options)
//     .then(function() {
//       return gitInit(options);
//     })
//     .then(function() {
//       return keepRegistering(options);
//     })
//     .then(function() {
//       return work(options);
//     })
//     .fail(function(err) {
//       console.error('Error: %s'.bold.red, err.message);
//       process.exit(1);
//     })
//     .done();
// };
