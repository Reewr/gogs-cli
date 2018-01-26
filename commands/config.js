'use strict';

module.exports = {
  command: 'config <command>',
  desc   : 'Allow setting and getting configuration options',
  builder: (yargs) => {
    return yargs
      .commandDir('config-commands')
      .demandCommand()
      .help();
  },
  handler: () => {}
};
