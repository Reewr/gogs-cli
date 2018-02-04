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

  return `${title}\n${formatted.join('\n')}`;
};

const listForRepository = async function(argv, username, repository) {
  const fullname = `${username}/${repository}`;

  try {
    argv._icon.start(`Loading issues from ${username}/${repository}`);
    const issues = await gogs.issue.list(username, repository);

    if (issues.length === 0) {
      argv._icon.info('No issues were found');
      return;
    }

    argv._icon.succeed(`Found ${issues.length} issues`);
    return formatIssueListForRepo(argv, fullname, issues);
  } catch (err) {
    if (err instanceof NotFound)
      throw new NotFound('Repository', `${fullname}`);
    throw err;
  }
};

/**
 * Lists the assigned issues. It is assumed that you can never be an
 * assignee of an issue that is within a repository that you do not have
 * write permission to. As such, the repositories used are the ones that
 * you have access to through the token.
 *
 * This command performs many requests:
 *
 * 1. Get user information
 * 2. Get repositories
 * 3. Get issue for each repository in repositories
 *
 * @private
 * @param {Arguments} argv
 * @returns {Promise}
 */
const listAssigned = async function(argv) {
  argv._icon.start('Loading repositories');
  const [user, repos] = await Promise.all([gogs.user.forToken(),
                                           gogs.repository.list()]);

  if (repos.length === 0) {
    argv._icon.info('There are no repositories and therefore no issues');
    return;
  }

  argv._icon.text = 'Loading issues';
  const multiIssues = await Promise.all(repos.map(x => {
    const [username, repository] = x.full_name.split('/');

    return gogs.issue.list(username, repository).then(issues => {
      return {
        fullname: x.full_name,
        issues  : issues.filter(issue => {
          return issue.assignee &&
                 issue.assignee.username === user.username;
        })
      };
    });
  }));

  let number   = 0;
  const filtered = multiIssues.filter(x => {
    number += x.issues.length;
    return x.issues.length !== 0;
  });

  if (filtered.length === 0) {
    argv._icon.info('You have no assigned issues in any repository');
    return;
  }

  argv._icon.succeed(`Found ${number} of assigned issue(s)`).stop();
  return filtered.map(x => {
    return formatIssueListForRepo(argv, x.fullname, x.issues);
  }).join('\n');
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
      }).command('assigned', 'list assigned issues', {}, mkHandler(listAssigned));
  },
  handler: mkHandler(async function(argv) {
    const [username, repository] = argv.repository.split('/');

    if (username && repository)
      return await listForRepository(argv, username, repository);

    if (!username || !repository)
      throw new InvalidArgument('username/repository');
  })
};
