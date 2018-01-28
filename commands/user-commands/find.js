'use strict';
const {mkHandler} = require('../../lib/handler');
const request = require('../../lib/request');

module.exports = {
  command: 'find <username>',
  desc   : 'Retrieve a user by username',
  builder: {},
  handler: mkHandler(async function(argv) {
    const res = request.get(`/users/${argv.username}`);

    return res.waitForSuccess()
      .then((foundUser) => {
        return [
          `ID        : ${foundUser.id}`,
          `Username  : ${foundUser.username}`,
          `Full name : ${foundUser.full_name}`,
          `Email     : ${foundUser.email}`,
          `Avatar URL: ${foundUser.avatar_url}`,
        ].join('\n');
      });
  })
};
