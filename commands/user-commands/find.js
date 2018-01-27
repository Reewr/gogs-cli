'use strict';
const handler = require('../../lib/handler');
const user = require('../user');

module.exports = {
  command: 'find <username>',
  desc   : 'Retrieve a user by username',
  builder: {},
  handler: handler.mkHandler(async function(argv) {
    const foundUser = await user.get(argv.username);

    return [
      `ID        : ${foundUser.id}`,
      `Username  : ${foundUser.username}`,
      `Full name : ${foundUser.full_name}`,
      `Email     : ${foundUser.email}`,
      `Avatar URL: ${foundUser.avatar_url}`,
    ].join('\n');
  })
};
