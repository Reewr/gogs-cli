/* globals describe it before */
'use strict';
const chai     = require('chai');
const chalk     = require('chalk');
const errors   = require('../lib/errors');
const expect   = chai.expect;
const {run, checkEnvironment} = require('./helpers/util');
const USERNAME = process.env.GOGS_CLI_TEST_USERNAME;
const ORGANIZATION = process.env.GOGS_CLI_TEST_ORGANIZATION;

checkEnvironment();

chalk.enabled = false;

describe('gogs repo add', function() {
  it('throws on missing repository name, "repo add"', async function() {
    const result = await run('repo add');

    expect(result.err).to.not.equal(null);
    expect(result.value).to.equal(null);
    expect(result.err.message).to.equal('Not enough non-option arguments: got 0, need at least 1');
  });

  it('throws on invalid name when organization is not set, "repo add test/something"', async function() {
    const result = await run(`repo add ${USERNAME}/something`);

    expect(result.err).to.be.instanceOf(errors.InvalidArgument);
    expect(result.value).to.equal(null);
  });

  it('throws on invalid name when organization is set, "repo add something -o"', async function() {
    const result = await run('repo add something -o');

    expect(result.err).to.be.instanceOf(errors.InvalidArgument);
    expect(result.value).to.equal(null);
  });

  it('should add the repository on the user of the token', async function() {
    const repoName = 'repo-add-test_' + Date.now();
    const result   = await run(`repo add ${repoName}`);

    expect(result.err).to.equal(null);
    expect(result.value).to.equal(
      `Created repository "${repoName}" on current user`);
  });

  it('should add the repository on the organization if set', async function() {
    const fullname = `${ORGANIZATION}/repo-add-test_` + Date.now();
    const result   = await run(`repo add ${fullname} -o`);

    expect(result.err).to.equal(null);
    expect(result.value).to.equal(
      `Created repository "${fullname}"`);
  });
});

describe('gogs repo list', function() {
  const created = [];

  before(async() => {
    for (let i = 0; i < 5; i++) {
      const repoName = `repo-add-test_${Date.now()}-${i}`;

      await run(`repo add ${repoName}`);
      created.push(repoName);
    }
  });

  it('should list the repositories that the token has access to', async function() {
    const result = await run('repo list');

    expect(result.err).to.equal(null);

    for (const reponame of created)
      expect(result.value.indexOf(reponame)).to.not.equal(-1);
  });
});
