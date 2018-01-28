'use strict';

module.exports = {
  command: 'config <command>',
  desc   : 'Allow setting and getting Gogs CLI configuration options',
  builder: (yargs) => {
    return yargs
      .commandDir('config-commands')
      .demandCommand()
      .help();
  },
  handler: () => {}
};
