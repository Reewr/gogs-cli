'use strict';
const yargs = require('yargs');
const path = require('path');
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

module.exports.run = async function(args) {
  return await module.exports.getOutput(() => {
    const result = yargs(args)
      .commandDir('../../commands')
      .exitProcess(false)
      .wrap(null)
      .demandCommand()
      .help()
      .argv;

    return result._getResult(result);
  });
};

module.exports.checkEnvironment = function() {
  const failed = [];

  if (!process.env.GOGS_CLI_TEST_HOST)
    failed.push('GOGS_CLI_TEST_HOST');

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
  config.token = process.env.GOGS_CLI_TEST_TOKEN;
  config.host = process.env.GOGS_CLI_TEST_HOST;
  config.port = process.env.GOGS_CLI_TEST_PORT || undefined;
};
