/* globals describe it before after */
'use strict';
const chai = require('chai');
const http = require('http');
const util = require('./helpers/util');
const expect = chai.expect;
const API = require('../lib/api');

describe('api.addAPIEndpoint', function() {
  let onRequest = (_, res) => res.end();
  let server;
  const tmpProcessEnv = process.env.GOGS_CLI_TEST_HOSTNAME;

  before(done => {
    process.env.GOGS_CLI_TEST_HOSTNAME = 'http://localhost:9000';
    process.env.GOGS_CLI_TEST_TOKEN = process.env.GOGS_CLI_TEST_TOKEN || 'token';
    process.env.GOGS_CLI_TEST_USERNAME = process.env.GOGS_CLI_TEST_USERNAME || 'username';
    process.env.GOGS_CLI_TEST_ORGANIZATION = process.env.GOGS_CLI_TEST_ORGANIZATION || 'organization';
    util.checkEnvironment();
    server = http.createServer(onRequest);
    server.listen(9000, done);
  });

  it('should export createAPI', function() {
    expect(API).to.be.an('object');
    expect(API.createAPIWrapper).to.be.a('function');
  });

  it('should throw on invalid arguments', function() {
    expect(() => API.createAPIWrapper(), 'No arguments').to.throw(TypeError);
    expect(() => API.createAPIWrapper('invalid'), 'Invalid syntax').to.throw(Error);
    expect(() => API.createAPIWrapper('METHOD LOL'), 'Invalid method').to.throw(Error);
    expect(() => API.createAPIWrapper('GET LOL'), 'Invalid url').to.throw(Error);
    expect(() => API.createAPIWrapper('GET /sometwhere')).to.not.throw();
  });

  it('should make a function', function() {
    const final = API.createAPIWrapper('GET /somewhere');

    expect(final).to.be.a('function');
  });

  it('should have a _getArgNames function', function() {
    const final = API.createAPIWrapper('GET /somewhere/${myname}');

    // should have one argument
    expect(final).to.have.property('_getArgNames');
    expect(final._getArgNames).to.be.a('function');
  });

  it('should parse names in URL string properly', function() {
    const f1 = API.createAPIWrapper('GET /somewhere/${myname}');
    const f2 = API.createAPIWrapper('GET /somewhere/${myname}/${something}');

    expect(f1._getArgNames()).to.deep.equal(['${myname}']);
    expect(f2._getArgNames()).to.deep.equal(['${myname}', '${something}']);
  });

  it('should parse names in URL string and throw on missing', function() {
    const f1 = API.createAPIWrapper('GET /somewhere/${myname}');
    const f2 = API.createAPIWrapper('GET /somewhere/${myname}/${something}');

    expect(() => f1()).to.throw(TypeError, 'missing arguments');
    expect(() => f2(1)).to.throw(TypeError, 'missing arguments');
  });

  it('should parse options and throw on required fields', function() {
    const f1 = API.createAPIWrapper('GET /somewhere/${myname}', {
      name: {required: true}
    });

    expect(() => f1('myname', {notName: 'lol'})).to.throw();
    expect(() => f1('myname', {name: 'lol'})).to.not.throw();
  });

  it('should parse options and throw on invalid basic types in fields', function() {
    const f1 = API.createAPIWrapper('GET /somewhere/${myname}', {
      name : {required: true, type: 'string'},
      id   : {type: 'number'},
      cache: {type: 'boolean'}
    });


    expect(() => f1('myname', {notName: 'lol'})).to.throw();
    expect(() => f1('myname', {name: 5})).to.throw();
    expect(() => f1('myname', {name: 'lol'})).to.not.throw();
    expect(() => f1('myname', {name: 'lol', id: 'notnumber'})).to.throw();
    expect(() => f1('myname', {name: 'lol', id: 5})).to.not.throw();

    expect(() => f1('myname', {name: 'lol', cache: 5})).to.throw();
    expect(() => f1('myname', {name: 'lol', cache: false})).to.not.throw();
  });

  it('should parse options and throw on invalid complex types in fields', function() {
    const f1 = API.createAPIWrapper('POST /somewhere', {
      name  : {type: 'string[]'},
      num   : {type: 'number[]'},
      caches: {type: 'boolean[]'},
    });


    expect(() => f1({})).to.not.throw();
    expect(() => f1({name: 'string'})).to.throw();
    expect(() => f1({name: ['string', 5]})).to.throw();
    expect(() => f1({name: ['1234', 'test']})).to.not.throw();

    expect(() => f1({num: 5})).to.throw();
    expect(() => f1({num: ['string', 5]})).to.throw();
    expect(() => f1({num: [1, 2]})).to.not.throw();

    expect(() => f1({caches: true})).to.throw();
    expect(() => f1({caches: ['string', true]})).to.throw();
    expect(() => f1({caches: [true, false]})).to.not.throw();
  });

  it('should parse options and throw on invalid choices', function() {
    const f1 = API.createAPIWrapper('POST /somewhere', {
      name: {type: 'string', choices: ['read', 'write', 'admin']},
      noChoices: {type: 'string', choices: []}
    });


    expect(() => f1({})).to.not.throw();
    expect(() => f1({name: 'string'})).to.throw();
    expect(() => f1({name: ['string', 5]})).to.throw();
    expect(() => f1({name: 'reads'})).to.throw();
    expect(() => f1({name: 'read'})).to.not.throw();
    expect(() => f1({name: 'read'})).to.not.throw();

    expect(() => f1({noChoices: 'read'})).to.not.throw();
    expect(() => f1({noChoices: 'something'})).to.not.throw();
    expect(() => f1({noChoices: 5})).to.throw();
  });


  it('should call the correct url with GET method when called', async function() {
    const f1 = API.createAPIWrapper('GET /user/${username}');

    onRequest = (req, res) => {
      expect(req.method).to.equal('GET');
      expect(req.url).to.equal('/somewhere/reewr');

      res.end();
    };

    await f1('reewr');
  });

  it('should call the correct url with POST method when called', async function() {
    const f1 = API.createAPIWrapper('POST /users', {
      name: {required: true, type: 'string'}
    });

    onRequest = (req, res) => {
      expect(req.method).to.equal('POST');
      expect(req.url).to.equal('/users');
      expect(req.headers).to.have.property('Content-Type');
      expect(req.headers['Content-Type']).to.equal('application/json');

      let data = '';

      req.setEncoding('utf8');
      req.on('data', (c) => {
        data += c;
      });
      req.on('end', () => {
        expect(JSON.parse(data)).to.equal({
          name: 'reewr'
        });
      });

      res.end();
    };

    await f1({name: 'reewr'});
  });

  after(done => {
    process.env.GOGS_CLI_TEST_HOSTNAME = tmpProcessEnv;
    server.close(done);
  });
});
