'use strict';
const request = require('../../lib/request');
const {InvalidArgument} = require('../../lib/errors');
const mkHandler = require('../../lib/handler').mkHandler;

module.exports = {
  command: 'add <repository>',
  desc   : 'Add a new repository',
  builder: function(yargs) {
    yargs
      .positional('description', {
        describe: 'The description of the repository, if any',
        type    : 'string',
        default : ''
      })
      .option('o', {
        alias   : 'organization',
        describe: 'The created repository will be created in the given organization.' +
                  'Due how the Gogs API works, there\'s no way to distinguish what ' +
                  'is a user and what is an organization. As such, you need to ' +
                  'specify this flag when creating a repository if the repository ' +
                  'is for a specific organization.',
        boolean: true
      })
      .option('p', {
        alias   : 'private',
        describe: 'The created repository is private',
        boolean : true
      })
      .option('a', {
        alias   : 'auto-init',
        describe: 'The created repository starts with README, .gitignore and LICENSE',
        boolean : true
      })
      .option('g', {
        alias   : 'gitignore',
        describe: 'Lets you choose to start with a language specific gitignore ' +
                  'such as "Go", "JavaScript" or multiple with "Go,JavaScript" etc.'
      })
      .option('l', {
        alias   : 'license',
        describe: 'Lets you use the template of the License file by name, ' +
                  'such as "MIT License", "Apache v2 License"',
      })
      .option('r', {
        alias   : 'readme',
        describe: 'Lets you use the template of the README file by name, ' +
                  'Default is "Default"',
      });
  },
  handler: mkHandler(async function(argv) {
    const [username, repository] = argv.repository.split('/');

    if ((!repository || !username) && argv.organization)
      throw new InvalidArgument(
        'USERNAME/REPOSITORY when creating organization repository');

    if (repository && username && !argv.organization)
      throw new InvalidArgument(
        'Only specify repository name, NOT username when not creating an organization repository');

    const isOrgan = argv.organization;
    const url = isOrgan ? `/org/${username}/repos` : '/user/repos';
    const options = {
      name       : isOrgan ? repository : username,
      description: argv.description,
      private    : argv.private || false,
      auto_init  : argv['auto-init'] || false,
      gitignores : argv.gitignore || undefined,
      license    : argv.license || undefined,
      readme     : argv.readme || undefined
    };

    const res = request.post(url, options);

    res.on(422, () => console.error('Err: Repository already exists'));
    return res.waitForSuccess()
      .then(() => {
        if (isOrgan)
          return `Created repository "${username}/${repository}"`;
        return `Created repository "${username}" on current user`;
      });
  })
};
