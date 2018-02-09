/* globals describe it before */
'use strict';
const chai     = require('chai');
const chalk     = require('chalk');
const errors   = require('../lib/errors');
const expect   = chai.expect;
const {run, checkEnvironment} = require('./helpers/util');
const USERNAME = process.env.GOGS_CLI_TEST_USERNAME;

chalk.enabled = false;

describe('gogs issue add', function() {
  const repoName = 'issue-add-test_' + Date.now();
  const fullname = `${USERNAME}/${repoName}`;

  before(async() => {
    checkEnvironment();
    await run(`repo add ${repoName}`);
  });

  it('throws on "issue add"', async function() {
    const result = await run('issue add');

    expect(result.err).to.not.equal(null);
    expect(result.value).to.equal(null);
    expect(result.err.message).to.equal('Not enough non-option arguments: got 0, need at least 1');
  });

  it('throws on "issue add INVALIDREPOSITORYNAME"', async function() {
    const result = await run('issue add invalidname');

    expect(result.err).to.be.instanceOf(errors.InvalidArgument);
    expect(result.value).to.equal(null);
  });

  it('throws on "issue add not/found"', async function() {
    const result = await run('issue add not/found "Add 1" -m "Some message"');

    expect(result.err).to.be.instanceOf(errors.NotFound);
    expect(result.value).to.equal(null);
  });

  it('should add the issue', async function() {
    const issueTitle = 'To Be Added';
    const result = await run(`issue add ${fullname} "${issueTitle}" -m "Hai"`);

    expect(result.err).to.equal(null);
    expect(result.value).to.equal(`The issue "${issueTitle}" was added in ${fullname}`);
  });
});

describe('gogs issue read', function() {
  const repoName = 'issue-read-test_' + Date.now();
  const fullname = `${USERNAME}/${repoName}`;

  before(async() => {
    await run(`repo add ${repoName}`);
    await run(`issue add ${fullname} Title -m "Some text"`);
  });

  it('throws on missing repository and issue number, "issue read"', async function() {
    const result = await run('issue read');

    expect(result.err).to.not.equal(null);
    expect(result.value).to.equal(null);
    expect(result.err.message).to.equal('Not enough non-option arguments: got 0, need at least 2');
  });

  it(`throws on missing issue number, "issue read ${fullname}"`, async function() {
    const result = await run(`issue read ${fullname}`);

    expect(result.err).to.not.equal(null);
    expect(result.value).to.equal(null);
    expect(result.err.message).to.equal('Not enough non-option arguments: got 1, need at least 2');
  });

  it('throws on invalid repository name, "issue read INVALIDREPOSITORYNAME 1"', async function() {
    const result = await run('issue read invalidname 1');

    expect(result.err).to.be.instanceOf(errors.InvalidArgument);
    expect(result.value).to.equal(null);
  });

  it(`throws on invalid issue number, "issue read ${fullname} NaN"`, async function() {
    const result = await run(`issue read ${fullname} something`);

    expect(result.err).to.be.instanceOf(errors.InvalidArgument);
    expect(result.value).to.equal(null);
  });


  it('throws on not found repository, "issue read not/found"', async function() {
    const result = await run('issue read not/found 2');

    expect(result.err).to.be.instanceOf(errors.NotFound);
    expect(result.value).to.equal(null);
  });

  it('throws on not found issue, "issue read not/found"', async function() {
    const result = await run(`issue read ${fullname} 8`);

    expect(result.err).to.be.instanceOf(errors.NotFound);
    expect(result.value).to.equal(null);
  });

  it('should read the issue', async function() {
    const result = await run(`issue read ${fullname} 1`);

    expect(result.err).to.equal(null);

    const lines = result.value.split('\n');

    expect(lines[0]).to.equal('#1 - Title');
    expect(lines[1]).to.contain(`${USERNAME} opened this issue`);
    expect(lines[3]).to.contain('Some text');
  });
});

describe('gogs issue reply', function() {
  const repoName = 'issue-reply-test_' + Date.now();
  const fullname = `${USERNAME}/${repoName}`;

  before(async() => {
    await run(`repo add ${repoName}`);
    await run(`issue add ${fullname} Title -m "Some text"`);
  });

  it('throws on missing repository and issue number, "issue reply"', async function() {
    const result = await run('issue reply');

    expect(result.err).to.not.equal(null);
    expect(result.value).to.equal(null);
    expect(result.err.message).to.equal('Not enough non-option arguments: got 0, need at least 2');
  });

  it(`throws on missing issue number, "issue reply ${fullname}"`, async function() {
    const result = await run(`issue reply ${fullname}`);

    expect(result.err).to.not.equal(null);
    expect(result.value).to.equal(null);
    expect(result.err.message).to.equal('Not enough non-option arguments: got 1, need at least 2');
  });

  it('throws on invalid repository name, "issue reply INVALIDREPOSITORYNAME 1"', async function() {
    const result = await run('issue read invalidname 1');

    expect(result.err).to.be.instanceOf(errors.InvalidArgument);
    expect(result.value).to.equal(null);
  });

  it(`throws on invalid issue number, "issue reply ${fullname} NaN"`, async function() {
    const result = await run(`issue reply ${fullname} something`);

    expect(result.err).to.be.instanceOf(errors.InvalidArgument);
    expect(result.value).to.equal(null);
  });


  it('throws on not found repository, "issue reply not/found"', async function() {
    const result = await run('issue reply not/found 2');

    expect(result.err).to.be.instanceOf(errors.NotFound);
    expect(result.value).to.equal(null);
  });

  it('throws on not found issue, "issue reply not/found"', async function() {
    const result = await run(`issue reply ${fullname} 8`);

    expect(result.err).to.be.instanceOf(errors.NotFound);
    expect(result.value).to.equal(null);
  });

  it('should reply the issue', async function() {
    const result = await run(`issue reply ${fullname} 1 -m "Some message"`);

    expect(result.err).to.equal(null);
    expect(result.logs).to.be.an('array').with.lengthOf(3);
    expect(result.logs[0]).to.contain('Loading info for');
    expect(result.logs[1]).to.contain('Creating new comment');
    expect(result.logs[2]).to.contain('Comment added to issue');
  });
});

describe('gogs issue list', function() {
  const repoName = 'issue-list-test_' + Date.now();
  const fullname = `${USERNAME}/${repoName}`;

  before(async() => {
    checkEnvironment();
    await run(`repo add ${repoName}`);
    await run(`issue add ${fullname} "Test 1" -m "This is the first issue"`);
    await run(`issue add ${fullname} "Test 2" -m "This is the second issue"`);
    await run(`issue add ${fullname} "Test 3" -m "This is the third issue"`);
    await run(`issue add ${fullname} "Test 4" -m "This is the fourth issue"`);
  });

  it('throws on "issue list"', async function() {
    const result = await run('issue list');

    expect(result.err).to.not.equal(null);
    expect(result.value).to.equal(null);
    expect(result.err.message).to.contain('Expected username/repository');
  });

  it('throws on "issue list INVALIDREPOSITORYNAME"', async function() {
    const result = await run('issue list invalidname');

    expect(result.err).to.be.instanceOf(errors.NotFound);
    expect(result.value).to.equal(null);
  });

  it('throws on "issue list not/found"', async function() {
    const result = await run('issue list not/found');

    expect(result.err).to.be.instanceOf(errors.NotFound);
    expect(result.value).to.equal(null);
  });

  it('should list each issue on a line each + header', async function() {
    const result = await run(`issue list ${fullname}`);

    expect(result.err).to.equal(null);

    const list = (result.value || '').split('\n');

    expect(list).to.be.an('array').with.lengthOf(5);
    expect(list[0]).to.contain('open issues');
  });
});
