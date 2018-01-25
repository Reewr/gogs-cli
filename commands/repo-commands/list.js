'use strict';
const request = require('../../lib/request');

module.exports = {
  command: 'repo',
  desc   : `
This command can be used to list all available repositories

Usage:
  gogs repo list
`,
  builder: {},
  handler: () => {
    const res = request.get(`/user/repos`);

    res.on('error', (err) => {
      console.error('Failed to retrieve issues due to error: ', err);
    });

    res.on(400, () => console.error('The access token you used does not have access'));
    res.on(401, () => console.error('The request that was made was bad'));
    res.on(404, () => console.error('Could not find the requested resources'));
    res.on(500, () => console.error('An internal server error happened with Gogs'));
    res.on('success', repos => {
      console.log(repos.map(x => x.full_name).join('\t'));
    });
  }
};
