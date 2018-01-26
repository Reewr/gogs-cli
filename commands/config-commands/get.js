'use strict';
const config = require('../../lib/config');

module.exports = {
  command: 'get <option>',
  desc   : 'get a configuration option.',
  builder: function(yargs) {
    return yargs.positional('option', {
      describe: 'the option to retrieve the value for',
      type    : 'string',
      choices : config.allowedOptions
    });
  },
  handler: (argv) => {
    console.log(`"${argv.option}" = ${config[argv.option]}`);
  }
};
