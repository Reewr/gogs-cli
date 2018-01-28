/* globals describe it */
'use strict';
const chai                    = require('chai');
const chalk                   = require('chalk');
const errors                  = require('../lib/errors');
const expect                  = chai.expect;
const {run, checkEnvironment} = require('./helpers/util');
const USERNAME                = process.env.GOGS_CLI_TEST_USERNAME;

checkEnvironment();

chalk.enabled = false;

describe('gogs user find', function() {
  it('throws on missing username, "user find"', async function() {
    const result = await run('user find');

    expect(result.err).to.not.equal(null);
    expect(result.value).to.equal(null);
    expect(result.err.message).to.equal('Not enough non-option arguments: got 0, need at least 1');
  });

  it('should throw on not finding user, "user find not-exist"', async function() {
    const result = await run('user find not-exist');

    expect(result.err).to.be.instanceOf(errors.NotFound);
    expect(result.value).to.equal(null);
  });

  it('should find user', async function() {
    const result   = await run(`user find ${USERNAME}`);

    expect(result.err).to.equal(null);

    const lines = result.value.split('\n');

    expect(lines[0]).to.contain('ID');
    expect(lines[1]).to.contain('Username');
    expect(lines[2]).to.contain('Full name');
    expect(lines[3]).to.contain('Email');
    expect(lines[4]).to.contain('Avatar URL');
  });
});
