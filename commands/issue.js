'use strict';
const request = require('../lib/request');
const errors  = require('../lib/errors');
const NotFound = errors.NotFound;

module.exports = {
  command: 'issue <command>',
  desc   : 'Perform actions with issues from gogs',
  builder: (yargs) => yargs.commandDir('issue-commands').demandCommand(),
  handler: () => {},

  // extra handlers
  get: function(username, repository, id) {
    return new Promise((resolve, reject) => {
      const res = request.get(`/repos/${username}/${repository}/issues/${id}`);

      res.on('error', reject);
      res.on(404, () => {
        reject(new NotFound(`Issue #${id} in "${username}/${repository}" not found.`));
      });
      res.on('success', resolve);
    });
  },

  getComments: function(username, repository, id) {
    const url = `/repos/${username}/${repository}/issues/${id}/comments`;
    const res = request.get(url);

    return new Promise((resolve, reject) => {
      res.on('error', reject);
      res.on(404, () => reject(new NotFound('Repository', `${username}/${repository}`)));
      res.on('success', resolve);
    });
  }
};
