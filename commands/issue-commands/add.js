'use strict';
const request = require('../../lib/request');
const editor  = require('../../lib/editor');
const errors  = require('../../lib/errors');
const mkHandler  = require('../../lib/handler').mkHandler;
const InvalidArgument = errors.InvalidArgument;

module.exports = {
  command: 'add <repository> [title]',
  desc   : 'Add an issue to a repository',
  builder: function(yargs) {
    return yargs
      .positional('title', {
        describe: 'The title of the issue'
      }).option('m', {
        alias   : 'message',
        describe: 'If present, expects the content after it, otherwise ' +
                  'your favourite editor is opened for you to write your ' +
                  'message, much like a git commit',
        type: 'string'
      })
      .option('c', {
        alias   : 'closed',
        describe: 'If present, the issue will be added as closed',
        boolean : true
      })
      .option('a', {
        alias   : 'assignee',
        describe: 'The username of the user that the issue should be assigned to',
        type    : 'string'
      })
      .option('i', {
        alias   : 'milestone',
        describe: 'The id of the milestone to add to the issue',
        type    : 'number'
      });
  },
  handler: mkHandler(async function(argv) {
    const [username, repository] = argv.repository.split('/');

    if (!repository || !username)
      throw new InvalidArgument('username and repository as USERNAME/REPOSITORY');

    if (!argv.title)
      throw new InvalidArgument('title');

    let message = argv.message;

    if (!argv.message) {
      message = await editor('md', [
        '',
        `Current title: ${argv.title}`,
      ].join('\n'));
    }

    const options = {
      title    : argv.title,
      body     : message,
      assignee : argv.assignee,
      milestone: argv.milestone,
      closed   : argv.closed || false
    };

    const fullname = `${username}/${repository}`;
    const url      = `/repos/${fullname}/issues`;
    const res      = request.post(url, options);

    return res.then(() => {
      return `The issue "${argv.title}" was added in ${fullname}`;
    });
  })
};
