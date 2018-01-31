'use strict';
const {mkHandler} = require('../../lib/handler');
const request = require('../../lib/request');

module.exports = {
  command: 'find <username>',
  desc   : 'Retrieve a user by username',
  builder: {},
  handler: mkHandler(async function(argv) {
    const user = await request.get(`/users/${argv.username}`);

    return [
      `ID        : ${user.id}`,
      `Username  : ${user.username}`,
      `Full name : ${user.full_name}`,
      `Email     : ${user.email}`,
      `Avatar URL: ${user.avatar_url}`,
    ].join('\n');
  })
};
