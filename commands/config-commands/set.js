'use strict';
const config = require('../../lib/config');

module.exports = {
  command: 'set <option> <value>',
  desc   : 'Set a configuration option',
  builder: function(yargs) {
    return yargs.positional('option', {
      describe: 'the option to set the value for',
      type    : 'string',
      choices : config.allowedOptions
    });
  },
  handler: (argv) => {
    config[argv.option] = argv.value;
    console.log(`Successfully set ${argv.option}`);
  }
};
