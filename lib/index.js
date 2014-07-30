var program = require('commander'),
  master = require('./master'),
  client = require('./client'),
  worker = require('./worker');

function ensurePresent(option, message) {
  if (!option) {
    console.error(message);
    process.exit(1);
  }
}

program
  .version(require('../package.json').version)

program
  .command('master')
  .option('-p, --port <port>', 'port to listen on')
  .description('Start a master node')
  .action(function(options) {
    options.port = options.port || 7000;
    master(options);
  });

program
  .command('worker')
  .option('-n, --name <name>', 'worker name')
  .option('-p, --port <port>', 'port to listen on')
  .option('-m, --master <host>', 'master node')
  .option('-d, --dir <dir>', 'build directory')
  .option('-v, --verbose', 'verbose output')
  .description('Start a worker node')
  .action(function(options) {
    ensurePresent(options.master, 'Must specify master node.');
    ensurePresent(options.port, 'Must specify port to listen on.');

    options.name = options.name || process.platform;
    options.workTree = options.dir || 'build';
    worker(options);
  });

program
  .command('init')
  .option('-m, --master <host>', 'master node')
  .option('-v, --verbose', 'verbose output')
  .description('Initialize a bran client')
  .action(function(options) {
    ensurePresent(options.master, 'Must specify master node.');
    client.init(options);
  });

program
  .command('workers')
  .option('-v, --verbose', 'verbose output')
  .description('Print the status of the workers')
  .action(function(options) {
    client.workers(options);
  });

program
  .command('build')
  .option('-c, --clean', 'clean build')
  .option('-v, --verbose', 'verbose output')
  .description('Start a build')
  .action(function(options) {
    client.build(options);
  });

program
  .command('exec <command>')
  .description('Execute a command on the workers')
  .action(function(command) {
    client.exec(command);
  });

program.parse(process.argv);
