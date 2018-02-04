#!/usr/bin/node
'use strict';
const yargs = require('yargs');
const ora   = require('ora');

module.exports = async function(args) {
  const result = yargs(args)
    .usage('$0 <command>')
    .recommendCommands(true)
    .commandDir('commands')
    .demandCommand()
    .help()
    .argv;

  result._icon = ora();
  if (typeof result._getResult === 'function')
    return await result._getResult(result);
  return Promise.resolve();
};
