'use strict';

module.exports = {
  command: 'util <command>',
  desc   : 'Utility command to improve the experience of the Gogs CLI',
  builder: (yargs) => yargs.commandDir('util-commands').demandCommand(),
  handler: () => {},
};
