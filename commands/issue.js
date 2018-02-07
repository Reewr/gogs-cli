'use strict';

module.exports = {
  command: 'issue <command>',
  desc   : 'Perform operations with issues on Gogs',
  builder: (yargs) => yargs.commandDir('issue-commands').demandCommand(),
  handler: () => {}
};
