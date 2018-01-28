'use strict';
const chalk           = require('chalk');
const wrapAnsi        = require('wrap-ansi');
const errors          = require('../../lib/errors');
const mkHandler       = require('../../lib/handler').mkHandler;
const getIssue        = require('../issue').get;
const getComments     = require('../issue').getComments;
const InvalidArgument = errors.InvalidArgument;

const formatAuthor = function(user) {
  let author = user.username;

  if (user.full_name !== '')
    author = `${user.full_name}(${user.username})`;

  return author;
};

const formatComment = function(comment, maxNumColumns) {
  return [
    chalk`{yellow Author}: ${formatAuthor(comment.user)}`,
    chalk`{yellow Date  }: ${comment.created_at}`,
    '',
    wrapAnsi(comment.body, maxNumColumns),
  ].join('\n');
};

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

    const issue      = await getIssue(username, repo, number);
    const comments   = await getComments(username, repo, number);
    const stateColor = issue.state === 'closed' ? 'red' : 'green';
    const body = issue.body === '' ? 'There is no content yet' : issue.body;
    const content = [
      chalk`{green #${issue.number}} ${issue.title}`,
      chalk`{yellow State }: {${stateColor} ${issue.state}}`,
      chalk`{yellow Author}: ${formatAuthor(issue.user)}`,
      chalk`{yellow Date  }: ${issue.created_at}`,
      `${wrapAnsi(body, argv['max-columns'])}`,
      '---',
    ];

    content.push(
      comments
        .map(x => formatComment(x, argv['max-columns']))
        .join('\n---\n'));

    return content.join('\n');
  })
};
