/* globals describe it before after */
'use strict';
const chai   = require('chai');
const chalk  = require('chalk');
const expect = chai.expect;
const util   = require('util');
const fsRead = util.promisify(require('fs').readFile);
const {run, checkEnvironment} = require('./helpers/util');

checkEnvironment();

chalk.enabled = false;

describe('gogs config get', function() {
  before(async function() {
    await run('config set hostname myhost');
    await run('config set token something');
  });

  it('throws on missing argument', async function() {
    const result = await run('config get');

    expect(result.err).to.not.equal(null);
    expect(result.value).to.equal(null);
    expect(result.err.message).to.equal('Not enough non-option arguments: got 0, need at least 1');
  });

  it('should retrieve hostname',  async function() {
    const result = await run('config get hostname');

    expect(result.err).to.equal(null);
    expect(result.value).to.equal('"hostname" = myhost');
  });

  it('should retrieve token',  async function() {
    const result = await run('config get token');

    expect(result.err).to.equal(null);
    expect(result.value).to.equal('"token" = something');
  });
});

describe('gogs config set', function() {
  before(async function() {
    await run('config set hostname myhost');
    await run('config set token something');
  });

  it('throws on missing argument', async function() {
    const result = await run('config set hostname');

    expect(result.err).to.not.equal(null);
    expect(result.value).to.equal(null);
    expect(result.err.message).to.equal('Not enough non-option arguments: got 1, need at least 2');
  });

  it('should set hostname',  async function() {
    const result = await run('config set hostname testing');

    expect(result.err).to.equal(null);
    expect(result.value).to.equal('Successfully set hostname');

    const afterSet = await run('config get hostname');

    expect(afterSet.err).to.equal(null);
    expect(afterSet.value).to.equal('"hostname" = testing');
  });

  it('should set token',  async function() {
    const result = await run('config set token mytoken');

    expect(result.err).to.equal(null);
    expect(result.value).to.equal('Successfully set token');

    const afterSet = await run('config get token');

    expect(afterSet.err).to.equal(null);
    expect(afterSet.value).to.equal('"token" = mytoken');
  });

  it('should have saved to config file', async function() {
    let file;
    let json;

    try {
      file = await fsRead(process.env.GOGS_CLI_TEST_CONFIG_PATH);
      json = JSON.parse(file.toString());
    } catch (err) {
      console.error(err);
      chai.assert(false, 'should not have been called');
    }

    expect(json).to.deep.equal({
      hostname: 'testing',
      token   : 'mytoken',
      debug   : false
    });
  });

  after(() => {
    checkEnvironment();
  });
});
