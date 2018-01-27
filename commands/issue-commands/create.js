'use strict';
const request = require('../../lib/request');
const editor  = require('../../lib/editor');

module.exports = {
  command: 'create <repository> [title]',
  desc   : 'This command can be used to create an issue in a repo',
  builder: function(yargs) {
    return yargs
      .positional('title', {
        describe: 'The title of the issue'
      }).option('m', {
        alias   : 'message',
        describe: 'If present, expects the content after it, otherwise ' +
                  'your favourite editor is opened for you to write your ' +
                  'message, much like a git commit',
        type: 'string'
      })
      .option('c', {
        alias   : 'closed',
        describe: 'If present, the issue will be created as closed',
        boolean : true
      })
      .option('a', {
        alias   : 'assignee',
        describe: 'The username of the user that the issue should be assigned to',
        type    : 'string'
      })
      .option('i', {
        alias   : 'milestone',
        describe: 'The id of the milestone to add to the issue',
        type    : 'number'
      });
  },
  handler: async function(argv) {
    const [username, repository] = argv.repository.split('/');

    if (!repository || !username)
      return console.error('Err: Needs repository and username as USERNAME/REPOSITORY');

    if (!argv.title)
      return console.error('Err: Title must be set');

    let message = argv.message;

    if (!argv.message)
      try {
        message = await editor('md', [
          '',
          '',
          '//// Lines beginning with \'////\' is ignored',
          '//// ',
          `//// Current title: ${argv.title}`,
          '////'
        ].join('\n'), '////');
      } catch (err) {
        if (err instanceof editor.EditorAborted)
          console.error('Aborting issue');
        else
          console.error('An error occurred while handling message', err);
        return process.exit(1);
      }

    const options = {
      title    : argv.title,
      body     : message,
      assignee : argv.assignee,
      milestone: argv.milestone,
      closed   : argv.closed || false
    };

    const res = request.post(`/repos/${username}/${repository}/issues`, options);

    res.on('error', (err) => {
      console.error('Failed to retrieve issues due to error: ', err);
    });

    res.on(400, () => console.error('The request that was made was bad'));
    res.on(401, () => console.error('The access token you used does not have access'));
    res.on(404, () => console.error(`Repository "${username}/${repository}" not found.`));
    res.on(500, () => console.error('An internal server error happened with Gogs'));
    res.on('success', () => {
      console.log(`The issue "${argv.title}" was created in ${username}/${repository}`);
    });
  }
};
