'use strict';
const config = require('../../lib/config');

module.exports = {
  command: 'describe <option>',
  desc   : 'get a description of a configuration option.',
  builder: function(yargs) {
    return yargs.positional('option', {
      describe: 'the option to retrieve the value for',
      type    : 'string',
      choices : config.allowedOptions
    });
  },
  handler: (argv) => {
    console.log(`"${argv.option}": ${config.descriptions[argv.option]}`);
  }
};
