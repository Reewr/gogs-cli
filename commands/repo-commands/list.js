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
    let longestName = 0;
    const formatted = repos
      .map(x => {
        longestName = Math.max(x.full_name.length, longestName);
        return x.full_name;
      })
      .map(x => {
        return x + ' '.repeat(longestName - x.length);
      });

    formatted.sort();

    return wrap(formatted.join(' '), 80, {trim: false});
  })
};
