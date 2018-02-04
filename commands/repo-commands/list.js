'use strict';
const {mkHandler} = require('../../lib/handler');
const {gogs} = require('../../lib/api');
const wrap = require('wrap-ansi');

module.exports = {
  command: 'list [username_or_orgname]',
  desc   : 'List all available repositories',
  example: 'gogs repo list',
  builder: function(yargs) {
    return yargs.positional('username_or_orgname', {
      describe: 'If present, list out all issues in repositories ' +
                'for that specific user or organization',
      type: 'string'
    }).option('l', {
      alias   : 'list',
      describe: 'Prints out the repositories as a list ' +
                'instead of columns',
      boolean: true
    });
  },
  handler: mkHandler(async function(argv) {
    let repos = [];

    if (argv.username_or_orgname)
      repos = await gogs.repository.listForUserOrOrg(argv.username_or_orgname);
    else
      repos = await gogs.repository.list();

    if (repos.length === 0 && argv.username_or_orgname)
      return `No repositories were found for ${argv.username_or_orgname}`;
    else if (repos.length === 0)
      return 'No repositories were found that you have write access to';

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
