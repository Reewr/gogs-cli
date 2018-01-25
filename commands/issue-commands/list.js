'use strict';
const request = require('../../lib/request');

module.exports = {
  command: 'list <repository>',
  desc   : `
This command can be used to list the issues of a specific repository.

Usage:
  gogs issue list aim/gogs
`,
  builder: {},
  handler: (argv) => {
    const [username, repository] = argv.repository.split('/');

    if (!repository || !username)
      return console.error('Err: Needs repository and username as USERNAME/REPOSITORY');

    const res = request.get(`/repos/${username}/${repository}/issues`);

    res.on('error', (err) => {
      console.error('Failed to retrieve issues due to error: ', err);
    });

    res.on(400, () => console.error('The access token you used does not have access'));
    res.on(401, () => console.error('The request that was made was bad'));
    res.on(404, () => console.error(`Repository "${username}/${repository}" not found.`));
    res.on(500, () => console.error('An internal server error happened with Gogs'));
    res.on('success', issues => {
      console.log(`${issues.length} issue(s) was found:\n` +
        issues.map(x => `#${x.number} ${x.title} (${x.created_at})`).join('\n'));
    });
  }
};
