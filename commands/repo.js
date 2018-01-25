'use strict';

module.exports = {
  command: 'repo <command>',
  desc   : 'Perform actions on and with repositories from Gogs',
  builder: (yargs) => yargs.commandDir('repo-commands'),
  handler: () => {}
};
