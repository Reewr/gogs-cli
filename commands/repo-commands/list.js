'use strict';
const request = require('../../lib/request');
const errors = require('../../lib/errors');
const mkHandler = require('../../lib/handler').mkHandler;
const wrap = require('wrap-ansi');

const getRepositoriesForUserOrOrg = function(name) {
  return request.get(`/users/${name}/repos`)
    .then(repos => {
      return repos.filter(x => {
        const [username] = x.full_name.split('/');

        return username === name;
      });
    })
    .catch(err => {
      if (err instanceof errors.NotFound ||
          err instanceof errors.InternalGogsError)
        return request.get(`/orgs/${name}/repos`);
      throw err;
    })
    .then(repos => repos)
    .catch(err => {
      if (err instanceof errors.NotFound)
        throw new errors.NotFound('Repository', name);
    });
};

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
      repos = await getRepositoriesForUserOrOrg(argv.username_or_orgname);
    else
      repos = await request.get('/user/repos');

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
