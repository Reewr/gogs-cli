#!/usr/bin/node
'use strict';
const gogs = require('../index');
const ora  = require('ora');
const GogsCliError = require('../lib/errors').GogsCliError;

gogs(process.argv.slice(2))
  .then((msg) => {
    if (msg)
      console.log(msg);
  })
  .catch(err => {
    if (err instanceof GogsCliError) {
      ora().fail(err.message);
      process.exit(err.exitCode || 1);
    } else {
      console.error(err);
      process.exit(1);
    }
  });
