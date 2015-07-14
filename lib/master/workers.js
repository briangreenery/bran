var moment = require('moment');

function add(name, ip, port) {
  this.workers[name] = {
    name: name,
    ip: ip,
    port: port,
    heartbeat: new Date()
  };
}

function host(ip, port) {
  if (ip.indexOf(':') !== -1) {
    return '[' + ip + ']:' + port;
  }

  return ip + ':' + port;
}

function all() {
  var worker, workers = [];

  for (worker in this.workers) {
    workers.push({
      name: this.workers[worker].name,
      host: host(this.workers[worker].ip, this.workers[worker].port),
      heartbeat: moment(this.workers[worker].heartbeat).fromNow()
    });
  }

  return workers;
}

function Workers() {
  if (!(this instanceof Workers)) {
    return new Workers();
  }

  this.add = add.bind(this);
  this.all = all.bind(this);

  this.workers = {};
};

module.exports = Workers;
