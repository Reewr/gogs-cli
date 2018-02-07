'use strict';
const yargs = require('yargs');
const path = require('path');
const http = require('http');
const config = require('../../lib/config');

module.exports.getOutput = async function(fn) {
  const log = console.log;
  const warn = console.warn;
  const err = console.error;

  const logs = [];
  const warns = [];
  const errs = [];

  console.log = (msg) => logs.push(msg);
  console.warn = (msg) => warns.push(msg);
  console.error = (msg) => errs.push(msg);

  const ret = {value: null, err: null};

  try {
    ret.value = await fn();
  } catch (error) {
    ret.err = error;
  }

  console.log = log;
  console.warn = warn;
  console.error = err;

  return {
    value: ret.value,
    err  : ret.err,
    logs : logs,
    warns: warns,
    errs : errs
  };
};

module.exports.setupLocalServer = function(port) {
  let onRequest;
  const normalOnRequest = (_, res) => {
    console.log('normal request');
    res.end();
  };
  const server = http.createServer((...args) => {
    onRequest(...args);
  });

  server.waitForRequest = function(run) {
    return new Promise((resolve) => {
      const onDone = new Promise((r1, r2) => {
        onRequest = (req, res) => {
          resolve({req, res, onDone});
          onRequest = normalOnRequest;
        };
        setTimeout(() => {
          run().then(r1, r2);
        }, 1);
      });
    });
  };

  return new Promise((resolve, reject) => {
    server.listen(port, (err) => err ? reject(err) : resolve(server));
  });
};

module.exports.run = async function(args) {
  return await module.exports.getOutput(() => {
    const result = yargs(args)
      .commandDir('../../commands')
      .exitProcess(false)
      .wrap(null)
      .demandCommand()
      .help()
      .argv;

    let tmpText = '';

    result._icon = {
      set text(a) {
        tmpText = a;
        console.log(a);
      },
      get text() { return tmpText; },
      stop(a) {
        if (a)
          console.log(a);
        return result._icon;
      },
      clear() { return result._icon; },
      start(text) {
        result._icon.text = text;
        return result._icon;
      },
      succeed(text) {
        result._icon.text = text;
        return result._icon;
      },
      fail(text) {
        console.error(text);
        return result._icon;
      }
    };

    return result._getResult(result);
  });
};

module.exports.checkEnvironment = function() {
  const failed = [];

  if (!process.env.GOGS_CLI_TEST_HOSTNAME)
    failed.push('GOGS_CLI_TEST_HOSTNAME');

  if (!process.env.GOGS_CLI_TEST_TOKEN)
    failed.push('GOGS_CLI_TEST_TOKEN');

  if (!process.env.GOGS_CLI_TEST_CONFIG_PATH)
    process.env.GOGS_CLI_TEST_CONFIG_PATH = path.resolve('./test/config.json');

  if (!process.env.GOGS_CLI_TEST_USERNAME)
    failed.push('GOGS_CLI_TEST_USERNAME');

  if (!process.env.GOGS_CLI_TEST_ORGANIZATION)
    failed.push('GOGS_CLI_TEST_ORGANIZATION');

  if (failed.length)
    throw Error('These env variables must be defined for tests:\n\t' + failed.join('\n\t'));

  process.env.GOGS_CLI_CONFIG_PATH = process.env.GOGS_CLI_TEST_CONFIG_PATH;
  config.setOption('token', process.env.GOGS_CLI_TEST_TOKEN);
  config.setOption('hostname', process.env.GOGS_CLI_TEST_HOSTNAME);
};
