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
    await run('config set host myhost');
    await run('config set port 8000');
    await run('config set token something');
  });

  it('throws on missing argument', async function() {
    const result = await run('config get');

    expect(result.err).to.not.equal(null);
    expect(result.value).to.equal(null);
    expect(result.err.message).to.equal('Not enough non-option arguments: got 0, need at least 1');
  });

  it('should retrieve host',  async function() {
    const result = await run('config get host');

    expect(result.err).to.equal(null);
    expect(result.value).to.equal('"host" = myhost');
  });

  it('should retrieve port',  async function() {
    const result = await run('config get port');

    expect(result.err).to.equal(null);
    expect(result.value).to.equal('"port" = 8000');
  });

  it('should retrieve token',  async function() {
    const result = await run('config get token');

    expect(result.err).to.equal(null);
    expect(result.value).to.equal('"token" = something');
  });
});

describe('gogs config set', function() {
  before(async function() {
    await run('config set host myhost');
    await run('config set port 8000');
    await run('config set token something');
  });

  it('throws on missing argument', async function() {
    const result = await run('config set host');

    expect(result.err).to.not.equal(null);
    expect(result.value).to.equal(null);
    expect(result.err.message).to.equal('Not enough non-option arguments: got 1, need at least 2');
  });

  it('should set host',  async function() {
    const result = await run('config set host testing');

    expect(result.err).to.equal(null);
    expect(result.value).to.equal('Successfully set host');

    const afterSet = await run('config get host');

    expect(afterSet.err).to.equal(null);
    expect(afterSet.value).to.equal('"host" = testing');
  });

  it('should set port',  async function() {
    const result = await run('config set port 1080');

    expect(result.err).to.equal(null);
    expect(result.value).to.equal('Successfully set port');

    const afterSet = await run('config get port');

    expect(afterSet.err).to.equal(null);
    expect(afterSet.value).to.equal('"port" = 1080');
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
    try {
      const file = await fsRead(process.env.GOGS_CLI_TEST_CONFIG_PATH);
      const json = JSON.parse(file.toString());

      expect(json).to.deep.equal({
        host : 'testing',
        port : '1080',
        token: 'mytoken',
        debug: false
      });
    } catch (err) {
      expect(err).to.equal(null);
    }
  });

  after(() => {
    checkEnvironment();
  });
});
