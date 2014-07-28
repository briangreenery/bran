
    workers[req.body.name] = {
      name: req.body.name,
      ip: req.connection.remoteAddress,
      port: req.body.port,
      heartbeat: new Date(),
    };

function queueBuild(worker, params) {
  console.error('Queueing %s on %s (%s:%s)',
                params.commit,
                worker.name,
                worker.ip,
                worker.port);

  var url = 'http://' + worker.ip + ':' + worker.port + '/queue-build';
  var body = {form: params};
  return Q.nfcall(request.post, url, body);
}

function queueBuilds(workers, params) {
  var promises = [];

  for (worker in workers) {
    promises.push(queueBuild(workers[worker], params));
  }

  return Q.all(promises);
}

function sendOutput(req, res, output) {
  if (output.finished) {
    httpStream.sendComplete(req, res, output);
  } else {
    output.on('progress', function() {
      httpStream.sendPartial(req, res, )
    });
  }
}

function Workers() {
  if (!(this instanceof Workers)) {
    return new Workers();
  }

  this.add = add.bind(this);
  this.all = all.bind(this);

  this.workers = {};
};

module.exports = Workers();
