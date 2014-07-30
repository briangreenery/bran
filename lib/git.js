var colors = require('colors'),
  exec = require('child_process').exec,
  os = require('os'),
  Q = require('q'),
  format = require('util').format;

function git(cmd, options, ignoreErrors) {
  var deferred = Q.defer();

  cmd = format('git --git-dir="%s" --work-tree="%s" %s',
               options.gitDir,
               options.workTree,
               cmd);

  if (options.verbose) {
    console.error(('$ ' + cmd).bold);
  }

  exec(cmd, function(err, stdout, stderr) {
    var message;

    if ((err && !ignoreErrors) || options.verbose) {
      if (stdout) {
        console.log(stdout.trim());
      }

      if (stderr) {
        console.error(stderr.trim());
      }
    }

    if (err && !ignoreErrors) {
      message = 'Command "' + cmd + '" failed with code ' + err.code;
      return deferred.reject(new Error(message));
    }

    deferred.resolve(stdout.trim());
  });

  return deferred.promise;
};

module.exports.init = function(options) {
  return git('init', options);
};

module.exports.gc = function(options) {
  return git('gc', options);
};

module.exports.addAll = function(options) {
  return git('add -A .', options, true);
};

module.exports.commit = function(options) {
  return git('commit -m hodor', options, true);
};

module.exports.forcePush = function(options) {
  var url = 'http://' + options.master + '/repo.git';
  var branch = os.hostname();
  return git('push --force ' + url + ' master:' + branch, options);
};

module.exports.fetch = function(options) {
  var url = 'http://' + options.master + '/repo.git';
  return git('fetch ' + url);
};

module.exports.checkout = function(options, commit) {
  return git('checkout -qf ' + commit);
};

module.exports.clean = function(options) {
  return git('clean -qfd');
}

module.exports.getHeadRef = function(options) {
  return git('rev-parse HEAD', options)
    .then(function(ref) {
      options.ref = ref;
    });
};

module.exports.getMaster = function(options) {
  return git('config bran.master', options)
    .then(function(master) {
      options.master = master;
    });
};

module.exports.setMaster = function(options) {
  return git('config bran.master ' + options.master, options);
};

module.exports.setUser = function(options) {
  return git('config user.name "Brandon Stark"', options);
};

module.exports.setEmail = function(options) {
  return git('config user.email "bran@example.com"', options);
};
