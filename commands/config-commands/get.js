'use strict';
const config = require('../../lib/config');
const {mkHandler} = require('../../lib/handler');

module.exports = {
  command: 'get <option>',
  desc   : 'get a configuration option.',
  builder: function(yargs) {
    return yargs
      .completion('option', function(current) {
        return config.allowedOptions.filter(x => x.indexOf(current !== -1));
      })
      .positional('option', {
        describe: 'the option to retrieve the value for',
        type    : 'string',
        choices : config.allowedOptions
      });
  },
  handler: mkHandler((argv) => {
    return `"${argv.option}" = ${config[argv.option]}`;
  })
};
