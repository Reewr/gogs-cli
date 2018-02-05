'use strict';
const chalk           = require('chalk');
const wrapAnsi        = require('wrap-ansi');
const errors          = require('../../lib/errors');
const mkHandler       = require('../../lib/handler').mkHandler;
const getIssue        = require('../issue').get;
const getComments     = require('../issue').getComments;
const InvalidArgument = errors.InvalidArgument;
const format          = require('../../lib/format');

const alink = /^<a href="[\/\w+]+\/(.+)">(.+)<\/a>$/g;

const formatComment = function(comment, maxNumColumns) {
  return [
    chalk`${format.author(comment.user)} commented {yellow ${format.since(comment.created_at)}}:`,
    wrapAnsi(comment.body, maxNumColumns - 4).split('\n').map(x => '\t' + x).join('\n'),
  ].join('\n');
};

/**
 * Gogs is not really that good at reporting what comments do. For
 * instance, it is illegal (I think) to have a comment without content,
 * but closing/opening issues are considered comments with empty body.
 *
 * In order to handle these edge cases, this function assumes that every
 * issue starts out being open. For each comment without a body, it is
 * assumed that this is changing a state on the issue.
 *
 * In addition, references made through commits are also considered
 * comments, but only contain an '<a>' link to the commit in question.
 *
 * @param {Object} issue
 * @param {Object[]} comments
 * @param {Number} maxNumColumns
 * @returns {String}
 */
const handleEdgeCaseComments = function(issue, comments, maxNumColumns) {
  // assume that every issue starts as open
  let isOpen = true;

  return comments.map(comment => {
    // assume that empty body comments are state changes,
    // since they do not specify this specifically.
    if (comment.body === '') {
      const formatted = `${format.author(comment.user)} ${isOpen ? 'closed' : 'reopened'} issue`;

      isOpen = !isOpen;
      return formatted + chalk` {yellow ${format.since(comment.created_at)}}`;
    }

    const match = alink.exec(comment.body);

    if (match) {
      return '' +
        `${format.author(comment.user)} references this from a commit` +
                        chalk` {yellow ${format.since(comment.created_at)}}:` +
                        chalk`\n\t ${match[2]} {gray (${match[1]})}`;
    }

    return formatComment(comment, maxNumColumns);
  }).join('\n\n');
};

const mkTitle = function(user, createdAt, state) {
  const author = format.author(user);
  const since  = format.since(createdAt);
  const color = state === 'closed' ?
    chalk`{red ${state}}` :
    chalk`{green ${state}}`;

  return chalk`${author} opened this issue {yellow ${since}} ${color}`;
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

    argv._icon.start(`Loading comments for ${username}/${repo}#${number}`);
    const issue      = await getIssue(username, repo, number);
    const comments   = await getComments(username, repo, number);

    argv._icon.text = 'Formatting data';

    const body = issue.body === '' ? 'There is no content yet' : issue.body;
    const content = [
      chalk`{gray #${issue.number}} - ${issue.title}`,
      mkTitle(issue.user, issue.created_at, issue.state),
      issue.labels.map(x => chalk.bgHex(`#${x.color}`)(' ' + x.name + ' ')).join(' '),
      wrapAnsi(body, argv['max-columns'] - 4).split('\n').map(x => '\t' + x).join('\n'),
      '',
    ];

    content.push(handleEdgeCaseComments(issue, comments, argv['max-columns']));

    argv._icon.stop().clear();
    return content.join('\n') + '\n';
  })
};
