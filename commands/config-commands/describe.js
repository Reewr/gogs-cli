'use strict';
const config = require('../../lib/config');
const {mkHandler} = require('../../lib/handler');

module.exports = {
  command: 'describe <option>',
  desc   : 'get a description of a configuration option.',
  builder: function(yargs) {
    return yargs.positional('option', {
      describe: 'the option to retrieve the value for',
      type    : 'string',
      choices : config.getAvailableOptions()
    });
  },
  handler: mkHandler(argv => {
    return `"${argv.option}": ${config.getDescriptionForOption(argv.option)}`;
  })
};
