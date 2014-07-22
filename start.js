var request = require('request');

var since = 0;

function getStatus() {
  request.get('http://localhost:3000?since=' + since, function(err, res, body) {
    var status;

    if (err) {
      console.log(err);
      process.exit(1);
    }

    status = JSON.parse(body);

    process.stdout.write(status.output);
    since += status.output.length;

    if (status.active) {
      process.nextTick(getStatus);
    }
  });
}

request.post('http://localhost:3000', function(err, res, body) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  getStatus();
});
