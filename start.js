var request = require('request');

function Build(host) {
  if (!(this instanceof Build)) {
    return new Build(host);
  }

  this.since = 0;
  this.host = host;
}

Build.prototype.start = function() {
  var self = this;

  request.post('http://' + self.host, function(err, res, body) {
    if (err) {
      console.log(err);
      process.exit(1);
    }

    self.poll();
  });
};

Build.prototype.poll = function() {
  var self = this, url = 'http://' + self.host + '?since=' + this.since;

  request.get(url, function(err, res, body) {
    var status;

    if (err) {
      console.log(err);
      process.exit(1);
    }

    status = JSON.parse(body);

    process.stdout.write(status.output);
    self.since += status.output.length;

    if (status.active) {
      process.nextTick(function() {
        self.poll();
      });
    }
  });
};

var windows = Build('192.168.56.2:3000');
var linux = Build('192.168.56.5:3000');

if (process.argv[2] === 'linux') {
  linux.start();
} else if (process.argv[2] === 'windows') {
  windows.start();
} else {
  linux.start();
  windows.start();
}
