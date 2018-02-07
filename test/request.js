/* globals describe it before after */
'use strict';
const chai   = require('chai');
const chalk  = require('chalk');
const request  = require('../lib/request');
const errors  = require('../lib/errors');
const expect = chai.expect;
const {run, checkEnvironment, setupLocalServer} = require('./helpers/util');

checkEnvironment();

chalk.enabled = false;

describe('lib/request', function() {
  let server;
  before(async function() {
    await run('config set hostname http://localhost:9000');
    await run('config set token something');

    server = await setupLocalServer(9000);
  });

  it('should fail graciously on error codes', async function() {
    const makeRequest = async function(code, expectedError) {
      const {res, onDone} = await server.waitForRequest(() => {
        return request.get('/somewhere');
      });

      res.writeHead(code);
      res.end();

      await onDone
        .then(() => {
          if (expectedError)
            chai.assert('should not have been called on ' + code);
        })
        .catch(err => {
          if (!expectedError)
            chai.assert('Error was called on non-expected error ' + code);
          expect(err).to.be.instanceOf(expectedError);
        });
    };

    const genCodes = (num, start) => {
      return new Array(num).fill(0).map((x, i) => i + start);
    };

    const tests = [
      {error: null, codes: genCodes(100, 200)},
      {error: errors.MovedPermanently, codes: [301]},
      {error: errors.Found, codes: [302, 303]},
      {error: errors.UnknownStatusCode, codes: genCodes(96, 304)},
      {error: errors.InvalidRequest, codes: [400]},
      {error: errors.InvalidAccess, codes: [401]},
      {error: errors.NotFound, codes: [404]},
      {error: errors.UnknownStatusCode, codes: genCodes(95, 405)},
      {error: errors.InternalGogsError, codes: [500]},
      {error: errors.UnknownStatusCode, codes: genCodes(60, 501)},
    ];

    for (const test of tests) {
      for (const code of test.codes)
        await makeRequest(code, test.error);
    }
  });

  it('should call correctly with GET', async function() {
    const {req, res} = await server.waitForRequest(() => {
      return request.get('/somewhere');
    });

    expect(req.url).to.equal('/api/v1/somewhere');
    expect(req.method).to.equal('GET');

    res.writeHead(200);
    res.end();
  });

  it('should call correctly with PUT', async function() {
    const {req, res} = await server.waitForRequest(() => {
      return request.put('/somewhere');
    });

    expect(req.url).to.equal('/api/v1/somewhere');
    expect(req.method).to.equal('PUT');

    res.writeHead(200);
    res.end();
  });

  it('should call correctly with POST', async function() {
    const {req, res} = await server.waitForRequest(() => {
      return request.post('/somewhere');
    });

    expect(req.url).to.equal('/api/v1/somewhere');
    expect(req.method).to.equal('POST');

    res.writeHead(200);
    res.end();
  });

  it('should call correctly with DELETE', async function() {
    const {req, res} = await server.waitForRequest(() => {
      return request.delete('/somewhere');
    });

    expect(req.url).to.equal('/api/v1/somewhere');
    expect(req.method).to.equal('DELETE');

    res.writeHead(200);
    res.end();
  });

  it('should call correctly with PATCH', async function() {
    const {req, res} = await server.waitForRequest(() => {
      return request.patch('/somewhere');
    });

    expect(req.url).to.equal('/api/v1/somewhere');
    expect(req.method).to.equal('PATCH');

    res.writeHead(200);
    res.end();
  });

  it('should send token as header', async function() {
    const {req, res} = await server.waitForRequest(() => {
      return request.patch('/somewhere');
    });

    expect(req.headers).to.have.property('authorization');
    expect(req.headers.authorization).to.equal('token something');

    res.writeHead(200);
    res.end();
  });

  it('it should data as json', async function() {
    const sent = {data: 'lol'};
    const {req, res} = await server.waitForRequest(() => {
      return request.patch('/somewhere', sent);
    });

    const data = await new Promise((resolve, reject) => {
      let str = '';

      req.setEncoding('utf8');
      req.on('data', (d) => {
        str += d;
      });
      req.on('end', () => resolve(str));
      req.on('error', (err) => reject(err));
    });

    expect(req.headers).to.have.property('content-type');
    expect(req.headers['content-type']).to.contain('application/json');
    expect(JSON.parse(data)).to.deep.equal(sent);

    res.writeHead(200);
    res.end();
  });

  after((done) => {
    server.close(done);
  });
});
