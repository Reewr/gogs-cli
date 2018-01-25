'use strict';
const request = require('../../lib/request');

const isOrganization = function(username) {
  return new Promise((resolve, reject) => {
    const res = request.get(`/orgs/${username}`);

    res.on('error', (err) => reject(err));
    res.on(400, () => reject('The access token you used does not have access'));
    res.on(401, () => reject('The request that was made was bad'));
    res.on(404, () => resolve(false));
    res.on(500, () => reject('An internal server error happened with Gogs'));
    res.on('success', (content) => {console.log(content);resolve(true)});
  });
};

module.exports = {
  command: 'create <repository>',
  desc   : `
This command can be used to create a new repository

Usage:
  gogs repo create <repository> [description]
`,
  builder: function(yargs) {
    yargs
      .positional('description', {
        describe: 'The description of the repository, if any',
        type    : 'string',
        default : ''
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
  handler: async function(argv) {
    const [username, repository] = argv.repository.split('/');

    if (!repository || !username)
      return console.error('Err: Needs repository and username as USERNAME/REPOSITORY');

    const isOrgan = await isOrganization(username);
    const url = isOrgan ? `/org/${username}/repos` : '/user/repos';
    const options = {
      name       : repository,
      description: argv.description,
      private    : argv.private || false,
      auto_init  : argv['auto-init'] || false,
    };

    if (argv.gitignore)
      options.gitignores = argv.gitignore;

    if (argv.license)
      options.license = argv.license;

    if (argv.readme)
      options.readme = argv.readme;

    const res = request.post(url, options);
    const onSuccess = () => {
      console.log(`Created repository ${username}/${repository}`);
    };

    res.on('error', (err) => {
      console.error('Failed to retrieve issues due to error: ', err);
    });

    res.on(400, () => console.error('Err: The access token you used does not have access'));
    res.on(401, () => console.error('Err: The request that was made was bad'));
    res.on(404, () => console.error('Err: Could not find the requested resources'));
    res.on(422, () => console.error('Err: Repository already exists'));
    res.on(500, () => console.error('Err: An internal server error happened with Gogs'));
    res.on(201, onSuccess);
    res.on('success', onSuccess);
  }
};
