'use strict';
const request         = require('../../lib/request');
const editor          = require('../../lib/editor');
const errors          = require('../../lib/errors');
const mkHandler       = require('../../lib/handler').mkHandler;
const getIssue        = require('../issue').get;
const getComments     = require('../issue').getComments;
const wrapAnsi        = require('wrap-ansi');
const InvalidArgument = errors.InvalidArgument;

const formatAuthor = function(user) {
  let author = user.username;

  if (user.full_name !== '')
    author = `${user.full_name}(${user.username})`;

  return author;
};

const getLastXComments = async function(username, repository, id, numComments = 1) {
  if (numComments === 0)
    return '';

  const issue = await getIssue(username, repository, id);
  const comments = await getComments(username, repository, id);
  const include = comments.slice(comments.length - numComments);
  const remaining = comments.slice(0, comments.length - numComments);
  const body = issue.body === '' ? 'There is no content yet' : issue.body;

  const content = [
    `#${issue.number} ${issue.title}`,
    `**State** : ${issue.state}`,
    `**Author**: ${formatAuthor(issue.user)}`,
    `**Date**  : ${issue.created_at}`,
    `${wrapAnsi(body, 80)}`,
  ];

  if (remaining.length) {
    content.push('---');
    content.push(`${remaining.length} hidden comments`);
  }

  if (include.length) {
    include.forEach(x => {
      content.push('---');
      content.push(`**Author**: ${formatAuthor(x.user)}`);
      content.push(`**Date**  : ${x.created_at}`);
      content.push('');
      content.push(wrapAnsi(x.body, 80));
    });
  }

  return content.join('\n');
};

module.exports = {
  command: 'reply <repository> <issuenumber>',
  desc   : 'Reply to an issue in a repository',
  builder: function(yargs) {
    return yargs
      .option('m', {
        alias   : 'message',
        describe: 'If present, expects the content after it, otherwise ' +
                  'your favourite editor is opened for you to write your ' +
                  'message, much like a git commit',
        type: 'string'
      })
      .option('n', {
        alias   : 'no-include',
        describe: 'By default, it includes the last reply of the issue ' +
                  'as a comment in the text editor so that you can see ' +
                  'what you are replying to. Setting this flag will not ' +
                  'include any comments. If you use the -m flag, this flag ' +
                  'is implicitly added and cannot be overridden',
        boolean: true,
        default: false
      })
      .option('i', {
        alias   : 'include-last',
        describe: 'By default, it includes the last comment made to the issue. ' +
                  'This flag can be used to set the amount of comments to include ' +
                  'within the editor.',
        type   : 'number',
        default: 1
      })
      .option('o', {
        alias   : 'oldest-first',
        describe: 'By default, it will sort the comments by newest first, except ' +
                  'for the very first comment that is the comment that ' +
                  'created the issue. With this flag active, the order is oldest first',
        boolean: true,
        default: false
      });
  },
  handler: mkHandler(async function(argv) {
    const [username, repository] = argv.repository.split('/');

    if (!repository || !username)
      throw new InvalidArgument('repository and username as USERNAME/REPOSITORY');

    if (typeof argv.issuenumber !== 'number' || isNaN(argv.issuenumber))
      throw new InvalidArgument('issue number');

    let message = argv.message;

    if (argv.n)
      argv.i = 0;

    if (!argv.message) {
      const comment = await getLastXComments(username,
                                             repository,
                                             argv.issuenumber,
                                             argv.i,
                                             argv.o);

      message = await editor('md', comment);
    }

    const options = {
      body: message,
    };

    const fullname = `${username}/${repository}`;
    const url = `/repos/${fullname}/issues/${argv.issuenumber}/comments`;
    const res = request.post(url, options);

    return res.waitForSuccess()
      .then(() => `The comment to issue "#${argv.issuenumber}" was added in ${fullname}`);
  })
};
