'use strict';
const request = require('../../lib/request');
const editor  = process.env.EDITOR || 'vi';
const spawn = require('child_process').spawn;
const os = require('os');
const path = require('path');
const fs = require('fs');

const getMessageFromFavouriteEditor = function(title) {
  const tmpFile = path.join(os.tmpdir(), Date.now() + 'gogs-issue-message.md');

  fs.writeFileSync(tmpFile, [
    '',
    '',
    '//// Lines beginning with \'////\' is ignored',
    '//// ',
    `//// Current title: ${title}`,
    '////'
  ].join('\n'));

  const child = spawn(editor, [tmpFile], {
    stdio: 'inherit'
  });

  return new Promise((resolve, reject) => {
    child.on('exit', function(exitCode, signal) {
      console.log(exitCode, signal);
      if (exitCode !== 0)
        return reject();

      const content = fs
        .readFileSync(tmpFile)
        .toString()
        .split('\n')
        .filter(x => !x.startsWith('////'))
        .join('\n')
        .trim();

      if (content.length === 0)
        return reject('aborted');

      fs.unlinkSync(tmpFile);
      resolve(content);
    });
    child.on('error', reject);
  });
};

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
        message = await getMessageFromFavouriteEditor(argv.title);
      } catch (err) {
        if (err === 'aborted')
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
