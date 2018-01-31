'use strict';
const request = require('../../lib/request');
const mkHandler = require('../../lib/handler').mkHandler;
const wrap = require('wrap-ansi');

module.exports = {
  command: 'list',
  desc   : 'List all available repositories',
  example: 'gogs repo list',
  builder: {},
  handler: mkHandler(async function() {
    const repos = await request.get('/user/repos');

    return wrap(repos.map(x => x.full_name).join('    '), 80);
  })
};
