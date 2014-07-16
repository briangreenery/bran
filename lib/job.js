var spawn = require('child_process').spawn;

function Job() {
  if (!(this instanceof Job)) {
    return new Job();
  }

  this.active = false;
  this.output = [];
}

Job.prototype.start = function() {
  var self, child, arguments, options;

  if (this.active) {
    return;
  }

  self = this;

  this.active = true;

  arguments = ['-q', '/dev/null', 'make', 'all', 'test'];
  options = {cwd: '/Users/briangreenery/Desktop/build'};

  child = spawn('script', arguments, options);

  this.output = [];

  child.stdout.on('readable', function() {
    var buffer = child.stdout.read();
    if (buffer)
      self.output.push(buffer);
  });

  child.stderr.on('readable', function() {
    var buffer = child.stdout.read();
    if (buffer)
      self.output.push(buffer);
  });

  child.on('close', function(code) {
    self.active = false;
  });
};

Job.prototype.currentOutput = function() {
  return Buffer.concat(this.output).toString();
};

module.exports = Job;
