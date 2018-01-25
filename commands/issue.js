'use strict';

module.exports = {
  command: 'issue <command>',
  desc   : 'Perform actions with issues from gogs',
  builder: (yargs) => yargs.commandDir('issue-commands'),
  handler: () => {}
};
