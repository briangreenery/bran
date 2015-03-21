# bran

bran is a tool for building the same source code across multiple remote platforms.

# Security Warning

This tool is completely insecure. It currently uses unauthenticated HTTP to send commands to workers.

## Simple Usage

### On the "master" (a server that your client and all your workers can access):

    $ sudo npm install -g bran
    $ bran master -p 7777

This will start a "master" node on port 7777.

### On each "worker" (a build machine):

    $ sudo npm install -g bran
    $ cd directory-that-has-space-to-build-in
    $ bran worker -n WORKER_1 -p 7777 -m MASTER.DNS.NAME:7777

This will start a "worker" node on port 7777 and specify that it should listen for instructions from the master at MASTER.DNS.NAME:7777. Any commands that the worker is told to run will run in the current working directory that the ```bran worker``` command is run from.

### On the "client" (where you edit your code):

    $ sudo npm install -g bran
    $ cd my-code-repo
    $ bran init -m MASTER.DNS.NAME:7777

This will create a .bran directory in the directory that ```bran init``` is run from, specifying that the master node is MASTER.DNS.NAME:7777. This directory should be the root of your project. Everything under this root will be transferred to the worker when a build is initiated, except exclusions specified in a ```.gitignore``` file.

Edit the ```.bran.yml``` file:

    WORKER_1:
      - make
      - make tests
      
    WORKER_2:
      - msbuild MY_PROJECT.sln
      - msbuild MY_TESTS.sln 

Now you're ready to build.

    $ bran build
    $ bran rebuild
