'use strict';
const request = require('../../lib/request');
const handler = require('../../lib/handler');
const errors = require('../../lib/errors');
const InvalidArgument = errors.InvalidArgument;
const NotFound = errors.NotFound;

module.exports = {
  command: 'list <repository>',
  desc   : 'List all issues for a specific repository',
  builder: {},
  handler: handler.mkHandler(async function(argv) {
    const [username, repository] = argv.repository.split('/');

    if (!repository || !username)
      throw new InvalidArgument('username/repository');

    const res = request.get(`/repos/${username}/${repository}/issues`);

    res.on(404, () => {
      throw new NotFound('Repository', `${username}/${repository}`);
    });

    return res.waitForSuccess()
      .then((issues) => {
        const title = `${issues.length} issue(s) was found:`;
        const formattedIssues = issues.map(x => {
          return `#${x.number} ${x.title} (${x.created_at})`;
        }).join('\n');

        return `${title}\n${formattedIssues}`;
      });
  })
};
