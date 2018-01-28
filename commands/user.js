'use strict';

module.exports = {
  command: 'user <command>',
  desc   : 'Perform actions with user in gogs',
  builder: (yargs) => yargs.commandDir('user-commands').demandCommand(),
  handler: () => {}
};
