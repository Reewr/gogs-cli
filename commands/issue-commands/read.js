'use strict';
const request  = require('../../lib/request');
const chalk    = require('chalk');
const wrapAnsi = require('wrap-ansi');

const getIssue = function(username, repository, id) {
  return new Promise((resolve, reject) => {
    const res = request.get(`/repos/${username}/${repository}/issues/${id}`);

    res.on('error', (err) => {
      reject('Failed to retrieve issue due to error: ', err);
    });

    res.on(400, () => reject('The access token you used does not have access'));
    res.on(401, () => reject('The request that was made was bad'));
    res.on(404, () => reject(`Issue #${id} in "${username}/${repository}" not found.`));
    res.on(500, () => reject('An internal server error happened with Gogs'));
    res.on('success', issue => resolve(issue));
  });
};

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
  handler: async function(argv) {
    const [username, repo] = argv.repository.split('/');
    const number = argv.number;

    if (!repo || !username)
      return console.error('Err: Needs repository and username as USERNAME/REPOSITORY');

    if (typeof number !== 'number' || isNaN(number))
      return console.error('Err: Needs an issue number');

    const issue = await getIssue(username, repo, number);
    const url = `/repos/${username}/${repo}/issues/${number}/comments`;
    const res = request.get(url);

    res.on('error', (err) => {
      console.error('Failed to retrieve issues due to error: ', err);
    });

    res.on(400, () => console.error('The access token you used does not have access'));
    res.on(401, () => console.error('The request that was made was bad'));
    res.on(404, () => console.error(`Repository "${username}/${repo}" not found.`));
    res.on(500, () => console.error('An internal server error happened with Gogs'));
    res.on('success', comments => {
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
      console.log(content.join('\n'));
    });
  }
};
