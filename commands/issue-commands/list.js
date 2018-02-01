'use strict';
const request = require('../../lib/request');
const handler = require('../../lib/handler');
const {InvalidArgument, NotFound} = require('../../lib/errors');

const listForRepository = async function(argv, username, repository) {
  if (!repository || !username)
    throw new InvalidArgument('username/repository');

  const res = request.get(`/repos/${username}/${repository}/issues`);
  const fullname = `${username}/${repository}`;

  return res.then(issues => {
    const formatted = issues.filter(x => {
      if (argv.p && !x.pull_request)
        return false;

      if (argv.n && x.pull_request)
        return false;

      return true;
    }).map(x => {
      const str = `#${x.number} ${x.title} (${x.created_at})`;

      if (x.pull_request)
        return str + ' (pull request)';
      return str;
    });

    const title = !argv.p ?
      `${issues.length} issue(s) was found on "${fullname}"` :
      `${formatted.length} pull request(s) were found on ${fullname}`;

    if (formatted.length === 0 && argv.p)
      return `No pull requests were found on "${fullname}"`;

    if (issues.length === 0)
      return `No issues were found on "${fullname}"`;

    return `${title}:\n${formatted.join('\n')}`;
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
    return yargs.option('p', {
      alias   : 'pull-requests',
      describe: 'Only lists pull requests',
      boolean : true
    }).option('n', {
      alias   : 'no-pull-requests',
      describe: 'Do not include pull requests',
      boolean : true
    });
  },
  handler: handler.mkHandler(async function(argv) {
    const [username, repository] = argv.repository.split('/');

    if (username && repository)
      return await listForRepository(argv, username, repository);
  })
};
