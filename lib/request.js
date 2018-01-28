'use strict';
const request = require('http').request;
const EventEmitter = require('events').EventEmitter;
const config = require('./config');
const error = require('./errors');
const log    = require('logule').init(module, 'Request');

const getDefaultError = (statusCode, url) => {
  switch (statusCode) {
    case 400: return new error.InvalidRequest();
    case 401: return new error.InvalidAccess();
    case 404: return new error.NotFound();
    case 500: return new error.InvalidAccess();
    default: return new Error(
      `Unhandled request event ${statusCode} for ${url}`);
  }
};

const performRequest = function(method, url, data = null) {
  config.exitIfNoTokenOrHost();

  const options = {
    host   : config.host,
    port   : config.port,
    method : method,
    path   : '/api/v1' + url,
    headers: {
      Authorization: `token ${config.token}`
    }
  };
  let stringifiedData = null;

  if (data) {
    stringifiedData = JSON.stringify(data);
    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = Buffer.byteLength(stringifiedData);
  }

  log.debug(`${method} ${options.host}(:${options.port})/${options.path}`);
  log.debug(`HEADERS: ${JSON.stringify(options.headers)}`);

  const emitter = new EventEmitter();

  const req = request(options, res => {
    const isJson = res.headers['content-type'].indexOf('application/json') !== -1;

    let result = '';

    if (res.statusCode > 299 || res.statusCode < 200) {
      const hadHandler = emitter.emit(res.statusCode);

      if (!hadHandler)
        emitter.emit('error', getDefaultError(res.statusCode, options.path));
    }

    res.setEncoding('utf8');
    res.on('data', chunk => { result += chunk; });
    res.on('end', () => emitter.emit('success', isJson ? JSON.parse(result) : null));
  });

  req.on('error', (err) => emitter.emit('error', err));
  emitter.waitForSuccess = function() {
    return new Promise((resolve, reject) => {
      emitter.on('success', (content) => resolve(content));
      emitter.on('error', reject);
    });
  };

  if (stringifiedData && data)
    req.write(stringifiedData);
  req.end();

  return emitter;
};

module.exports.get = (url) => performRequest('GET', url);
module.exports.post = (url, data) => performRequest('POST', url, data);

