'use strict';
const request = require('../../lib/request');
const handler = require('../../lib/handler');

module.exports = {
  command: 'list',
  desc   : 'List all available repositories',
  example: 'gogs repo list',
  builder: {},
  handler: handler.mkHandler(async function() {
    const res = request.get('/user/repos');

    return res.waitForSuccess()
      .then((repos) => repos.map(x => x.full_name).join('\t'));
  })
};
