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
    const formatted = issues.map(x => {
      return `#${x.number} ${x.title} (${x.created_at})`;
    });

    const title = `${issues.length} issue(s) was found on "${fullname}"`;

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
  builder: {},
  handler: handler.mkHandler(async function(argv) {
    const [username, repository] = argv.repository.split('/');

    if (username && repository)
      return await listForRepository(argv, username, repository);
  })
};
