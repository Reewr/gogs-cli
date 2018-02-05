'use strict';
const errors          = require('../../lib/errors');
const mkHandler       = require('../../lib/handler').mkHandler;
const InvalidArgument = errors.InvalidArgument;
const format          = require('../../lib/format');
const {gogs}          = require('../../lib/api');

module.exports = {
  command: 'read <repository> <number>',
  desc   : 'This can be used to read the issue and all its comments using less',
  builder: (yargs) => {
    return yargs.positional('number', {
      describe: 'The number of the issue to read',
      type    : 'number',
    }).option('c', {
      alias   : 'max-columns',
      describe: 'Sets the maximum number of columns',
      default : 80,
      type    : 'number'
    });
  },
  handler: mkHandler(async function(argv) {
    const [username, repo] = argv.repository.split('/');
    const number = argv.number;

    if (!repo || !username)
      throw new InvalidArgument('repository and username as USERNAME/REPOSITORY');

    if (typeof number !== 'number' || isNaN(number))
      throw new InvalidArgument('issue number');

    argv._icon.start(`Loading comments for ${username}/${repo}#${number}`);
    const issue      = await gogs.issue.get(username, repo, number);
    const comments   = await gogs.issue.comments.get(username, repo, number);

    argv._icon.text = 'Formatting data';

    const formattedIssue    = format.issue(issue, argv['max-columns']);
    const formattedComments = format.comments(issue, comments, argv['max-columns']);

    argv._icon.stop().clear();
    return formattedIssue + formattedComments + '\n';
  })
};
