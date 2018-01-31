'use strict';
const request = require('../../lib/request');
const handler = require('../../lib/handler');
const {InvalidArgument, NotFound} = require('../../lib/errors');

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

    if (!repository || !username)
      throw new InvalidArgument('username/repository');

    const res = request.get(`/repos/${username}/${repository}/issues`);

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
        `${issues.length} issue(s) was found` :
        `${formatted.length} pull request(s) were found`;

      if (formatted.length === 0 && argv.p)
        return `No pull requests were found on "${username}/${repository}`;

      if (issues.length === 0)
        return `No issues were found on "${username}/${repository}`;

      return `${title}:\n${formatted.join('\n')}`;
    }).catch(e => {
      if (e instanceof NotFound)
        throw new NotFound('Repository', `${username}/${repository}`);
      throw e;
    });
  })
};
