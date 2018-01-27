'use strict';
const request  = require('../lib/request');
const errors  = require('../lib/errors');
const NotFound = errors.NotFound;

module.exports = {
  command: 'user <command>',
  desc   : 'Perform actions with user in gogs',
  builder: (yargs) => yargs.commandDir('user-commands').demandCommand(),
  handler: () => {},

  // extra handlers
  get: function(username) {
    return new Promise((resolve, reject) => {
      const res = request.get(`/users/${username}`);

      res.on(404, () => reject(new NotFound('User', username)));
      res.on('success', user => resolve(user));
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
