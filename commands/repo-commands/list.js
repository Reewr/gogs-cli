'use strict';
const request = require('../../lib/request');
const mkHandler = require('../../lib/handler').mkHandler;
const wrap = require('wrap-ansi');

module.exports = {
  command: 'list',
  desc   : 'List all available repositories',
  example: 'gogs repo list',
  builder: function(yargs) {
    return yargs.option('l', {
      alias   : 'list',
      describe: 'Prints out the repositories as a list ' +
                'instead of columns',
      boolean: true
    });
  },
  handler: mkHandler(async function(argv) {
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

    if (argv.l)
      return `${formatted.map(x => x.trim()).join('\n')}`;

    return wrap(formatted.join(' '), 80, {trim: false})
      .split('\n')
      .map(x => x.replace(/^\s+/g, ''))
      .join('\n');
  })
};
