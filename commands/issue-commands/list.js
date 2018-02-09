'use strict';
const {mkHandler} = require('../../lib/handler');
const {gogs}      = require('../../lib/api');
const format      = require('../../lib/format');
const {InvalidArgument, NotFound}  = require('../../lib/errors');
const chalk       = require('chalk');

/**
 * Formats the issues in a format that looks similar to:
 *
 * # reewr/myrepo open issues
 *   1: This is the title (~3 minutes ago)
 *   2: This is another title (~8 minutes ago)
 *   3: This is that title (~10 days ago)
 *
 * @private
 * @param {Arguments} argv
 * @param {String} fullname
 * @param {Object[]} issues
 * @returns {String}
 */
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

/**
 * List the issues of one specific repository. It performs a single
 * request and goes directly to the repository in mind. If it does not
 * exist, an error will be thrown.
 *
 * @private
 * @param {Arguments} argv
 * @param {String} username
 * @param {String} repository
 * @returns {undefined}
 */
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
 * Retrieves all the issues for a user or an organization by first
 * requesting to get all the repositories on the user or organization,
 * then for each of those repositories, request the issues.
 *
 * @param {Arguments} argv
 * @param {String} name
 * @returns {null}
 */
const listForUserOrOrg = async function(argv, name) {
  argv._icon.start(`Loading repositories for ${name}...`);
  const repos = await gogs.repository.listForOrgOrUser(name);

  if (repos.length === 0) {
    argv._icon.info('There are no repositories and therefore no issues');
    return;
  }

  argv._icon.text = 'Loading issues...';
  const multiIssues = await Promise.all(repos.map(x => {
    const [username, repository] = x.full_name.split('/');

    return gogs.issue.list(username, repository).then(issues => {
      return {fullname: x.full_name, issues: issues};
    });
  }));

  let number   = 0;
  const filtered = multiIssues.filter(x => {
    number += x.issues.length;
    return x.issues.length !== 0;
  });

  if (filtered.length === 0) {
    argv._icon.info(
      `No issues were found in any of the ${repos.length} repositories`);
    return;
  }

  const numIssues = `${number} issue${number === 1 ? '' : 's'}`;
  const numRepo   = `${repos.length} ${repos.length === 1 ? 'repository' : 'repositories'}`;

  argv._icon.succeed(`Found ${numIssues} in ${numRepo}`).stop();
  return filtered.map(x => {
    return formatIssueListForRepo(argv, x.fullname, x.issues);
  }).join('\n');
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
 * Gogs has the /user/issues URL that can be used to retrieve the issues
 * assigned to the currently logged in user. The problem with using this
 * one is that it does not contain any information about which
 * repository it is associated with. Finding that information elsewhere
 * seems to be difficult given the lack of information there is in
 * issues.
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

  // Go through each repository, grab a list of issues and filtering out
  // those that are not assigned to the user who owns the token
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

  let number = 0;

  // Filter out repositories that do not have any issues, while counting
  // up how many issues are assigned to the current user
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
  command: 'list [repository]|[username]|[organization]|<assigned>',
  desc   : 'List all issues for a specific repository, user or organization',
  builder: function(yargs) {
    return yargs
      .option('d', {
        alias      : 'full-date',
        description: 'include full date',
        boolean    : true
      }).command('assigned', 'list assigned issues', {}, mkHandler(listAssigned));
  },
  handler: mkHandler(async function(argv) {
    const [username, repository] = (argv.repository || '').split('/');

    if (username && repository)
      return await listForRepository(argv, username, repository);

    if (username && !repository)
      return await listForUserOrOrg(argv, username);

    if (!username || !repository)
      throw new InvalidArgument('username/repository');
  })
};
