'use strict';
const request = require('../lib/request');
const errors  = require('../lib/errors');
const NotFound = errors.NotFound;

module.exports = {
  command: 'issue <command>',
  desc   : 'Perform operations with issues on Gogs',
  builder: (yargs) => yargs.commandDir('issue-commands').demandCommand(),
  handler: () => {},

  // extra handlers
  get: function(username, repository, id) {
    const res = request.get(`/repos/${username}/${repository}/issues/${id}`);

    return res
      .then(u => u)
      .catch(err => {
        if (err instanceof NotFound)
          throw new NotFound(
            `Issue #${id} in "${username}/${repository}" not found.`);

        throw err;
      });
  },


  getComments: function(username, repository, id) {
    const url = `/repos/${username}/${repository}/issues/${id}/comments`;
    const res = request.get(url);

    return res
      .then(c => c)
      .catch(err => {
        if (err instanceof NotFound)
          throw new NotFound('Repository', `${username}/${repository}`);

        throw err;
      });
  }
};
