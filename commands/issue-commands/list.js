'use strict';
const request = require('../../lib/request');
const handler = require('../../lib/handler');
const {InvalidArgument, NotFound} = require('../../lib/errors');

module.exports = {
  command: 'list <repository>',
  desc   : 'List all issues for a specific repository',
  builder: {},
  handler: handler.mkHandler(async function(argv) {
    const [username, repository] = argv.repository.split('/');

    if (!repository || !username)
      throw new InvalidArgument('username/repository');

    const res = request.get(`/repos/${username}/${repository}/issues`);

    return res.then(issues => {
      const title = `${issues.length} issue(s) was found`;
      const formattedIssues = issues.map(x => {
        return `#${x.number} ${x.title} (${x.created_at})`;
      }).join('\n');

      if (issues.length === 0)
        return `No issues where found on "${username}/${repository}`;

      return `${title}:\n${formattedIssues}`;
    }).catch(e => {
      if (e instanceof NotFound)
        throw new NotFound('Repository', `${username}/${repository}`);
      throw e;
    });
  })
};
