var http = require('http');
var send = require('./lib/http-stream/send.js');
var receive = require('./lib/http-stream/receive.js');
var StreamOutput = require('./lib/stream-output.js');

var colors = require('colors');
var exec = require('child_process').exec;

var buffer = new Buffer('asd');
var count = 0;

var winterfell = new (require('events').EventEmitter);

var out1 = (require('stream').PassThrough)();
var out2 = (require('stream').PassThrough)();

var streamOutput = StreamOutput();
var x = 0;

function handle(req, res) {
  if (x === 0) {

  var foo = exec('uname -a');
  foo.stdout.on('end', function() {
    out1.end('Command exited with code 0'.bold.green);
  });
  foo.stdout.pipe(out1, {end: false});

  var bar = exec('uname -a');
  bar.stdout.on('end', function() {
    out2.end('Command exited with code 0'.bold.green);
  });
  bar.stdout.pipe(out2, {end: false});

  var thingy = es.merge(out1.pipe(es.split()).pipe(es.map(function(d, c) {c(null, '' + '[Ubuntu]'.bold + ' ' + d + '\n');})), 
    out2.pipe(es.split()).pipe(es.map(function(d, c) {c(null, '' + '[Mac]'.bold + '' + ' ' + d + '\n');})));

  thingy.pipe(streamOutput);

  x = 1;
  }

 if (streamOutput.finished) {
    send.sendComplete(req, res, streamOutput.output);
  } else {
    streamOutput.once('progress', function() {
      send.sendPartial(req, res, streamOutput.output);
    });
  }
}

http.createServer(handle).listen(3000);

var es = require('event-stream');

var r = receive('http://localhost:3000');

r.pipe(process.stdout);
r.on('end', function() {
  process.exit(0);
});
