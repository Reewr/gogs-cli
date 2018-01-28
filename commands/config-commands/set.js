'use strict';
const config = require('../../lib/config');
const {mkHandler} = require('../../lib/handler');

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
  handler: mkHandler((argv) => {
    config[argv.option] = argv.value;
    return `Successfully set ${argv.option}`;
  })
};
