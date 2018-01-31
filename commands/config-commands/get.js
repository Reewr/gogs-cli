'use strict';
const config = require('../../lib/config');
const {mkHandler} = require('../../lib/handler');

module.exports = {
  command: 'get <option>',
  desc   : 'get a configuration option.',
  builder: function(yargs) {
    return yargs
      .completion('option', function(current) {
        return config
          .getAvailableOptions()
          .filter(x => x.indexOf(current !== -1));
      })
      .positional('option', {
        describe: 'the option to retrieve the value for',
        type    : 'string',
        choices : config.getAvailableOptions()
      });
  },
  handler: mkHandler((argv) => {
    return `"${argv.option}" = ${config.getOption(argv.option)}`;
  })
};
