'use strict';
const {mkHandler} = require('../../lib/handler');
const {gogs}      = require('../../lib/api');
const format      = require('../../lib/format');
const {InvalidArgument, NotFound}  = require('../../lib/errors');
const chalk       = require('chalk');

const formatIssueListForRepo = function(argv, fullname, issues) {
  const getFormattedDate = (x) => {
    const d = chalk`{gray ({yellow ${format.since(x.created_at)}}}`;

    if (argv.d)
      return d + chalk` {gray ${format.date(x.created_at)})}`;
    return d + chalk`{gray )}`;
  };

  const formatted = issues.map(x => {
    return '  ' + [
      `${x.number}:`,
      x.title,
      getFormattedDate(x)
    ].join(' ');
  });

  const title = chalk`{greenBright # ${fullname} open issues}`;

  if (issues.length === 0)
    return `No issues were found on "${fullname}"`;

  return `${title}\n${formatted.join('\n')}`;
};

const listForRepository = async function(argv, username, repository) {
  const res = gogs.issue.list(username, repository);
  const fullname = `${username}/${repository}`;

  return res.then(issues => {
    return formatIssueListForRepo(argv, fullname, issues);
  }).catch(e => {
    if (e instanceof NotFound)
      throw new NotFound('Repository', `${fullname}`);
    throw e;
  });
};

module.exports = {
  command: 'list <repository>',
  desc   : 'List all issues for a specific repository',
  builder: function(yargs) {
    return yargs
      .option('d', {
        alias      : 'full-date',
        description: 'include full date',
        boolean    : true
      });
  },
  handler: mkHandler(async function(argv) {
    const [username, repository] = argv.repository.split('/');

    if (username && repository)
      return await listForRepository(argv, username, repository);

    if (!username || !repository)
      throw new InvalidArgument('username/repository');
  })
};
