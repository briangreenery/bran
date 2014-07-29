function register(options) {
  var url, body;

  url = 'http://' + options.master + '/workers';
  body = {
    name: options.name,
    port: options.port
  }

  if (options.verbose) {
    console.error('Registering with %s', options.master);
  }

  request.post(url, {json: body}, function(err, res) {
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

    setTimeout(register.bind(undefined, options), 10000);
  });
}

module.exports = register;
