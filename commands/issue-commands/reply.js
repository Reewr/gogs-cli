'use strict';
const editor          = require('../../lib/editor');
const errors          = require('../../lib/errors');
const format          = require('../../lib/format');
const {mkHandler}     = require('../../lib/handler');
const {gogs}          = require('../../lib/api');
const InvalidArgument = errors.InvalidArgument;

/**
 * Returns the last X comments on the issue in the given repository. If
 * the number of comments is 0, returns an empty string
 *
 * @param {String} username
 * @param {String} repository
 * @param {String} id
 * @param {Number} numComments=1
 * @returns {String}
 */
const getLastXComments = async function(
  username,
  repository,
  id,
  numComments = 1) {
  if (numComments === 0)
    return '';

  const issue    = await gogs.issue.get(username, repository, id);
  const comments = await gogs.issue.comments.get(username, repository, id);
  const include = comments.slice(comments.length - numComments);
  const hidden = comments.slice(0, comments.length - numComments);

  const content = [format.issue(issue, 80, false)];

  if (hidden.length) {
    content.push(`${hidden.length} hidden comments`);
    content.push('');
  }

  const all = include.concat(hidden.map(x => {
    x.hidden = true;
    return x;
  }));

  if (include.length) {
    content.push(format.comments(issue, all, 80, false));
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
    const fullname = `${username}/${repository}`;

    if (!repository || !username)
      throw new InvalidArgument('repository and username as USERNAME/REPOSITORY');

    if (typeof argv.issuenumber !== 'number' || isNaN(argv.issuenumber))
      throw new InvalidArgument('issue number');

    argv._icon.start(`Loading info for ${fullname}#${argv.issuenumber}`);
    let message = argv.message;

    if (argv.n)
      argv.i = 0;

    if (!message) {
      argv._icon.text = `Loading comments for ${fullname}#${argv.issuenumber}`;
      const comment = await getLastXComments(username,
                                             repository,
                                             argv.issuenumber,
                                             argv.i,
                                             argv.o);

      argv._icon.stop().clear();
      message = await editor('md', comment);
    }

    argv._icon.text = 'Creating new issue';

    await gogs.issue.comments.create(
      username,
      repository,
      argv.issuenumber,
      {body: message});

    argv._icon.succeed(`Comment added to issue "#${argv.issuenumber}" in ${fullname}`);
  })
};
