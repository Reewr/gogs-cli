'use strict';
const request  = require('../lib/request');

module.exports = {
  command: 'issue <command>',
  desc   : 'Perform actions with issues from gogs',
  builder: (yargs) => yargs.commandDir('issue-commands').demandCommand(),
  handler: () => {},

  // extra handlers
  get: function(username, repository, id) {
    return new Promise((resolve, reject) => {
      const res = request.get(`/repos/${username}/${repository}/issues/${id}`);

      res.on('error', (err) => {
        reject('Failed to retrieve issue due to error: ', err);
      });

      res.on(400, () => reject('The access token you used does not have access'));
      res.on(401, () => reject('The request that was made was bad'));
      res.on(404, () => reject(`Issue #${id} in "${username}/${repository}" not found.`));
      res.on(500, () => reject('An internal server error happened with Gogs'));
      res.on('success', issue => resolve(issue));
    });
  },

  getComments: function(username, repository, id) {
    const url = `/repos/${username}/${repository}/issues/${id}/comments`;
    const res = request.get(url);

    return new Promise((resolve, reject) => {
      res.on('error', (err) => reject(err));
      res.on(400, () => reject('The access token you used does not have access'));
      res.on(401, () => reject('The request that was made was bad'));
      res.on(404, () => reject(`Repository "${username}/${repository}" not found.`));
      res.on(500, () => reject('An internal server error happened with Gogs'));
      res.on('success', comments => {
        resolve(comments);
      });
    });
  }
};
