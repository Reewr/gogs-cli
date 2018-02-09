'use strict';
const request      = require('request');
const config       = require('./config');
const error        = require('./errors');

/**
 * Joins two urls together, making sure that slashes are placed
 * correctly.
 *
 * @param {String} url1
 * @param {String} url2
 * @returns {String}
 */
const joinUrl = function(url1, url2) {
  const url1EndsWithSlash = url1.endsWith('/');
  const url2StartsWithSlash = url2.startsWith('/');

  if (url1EndsWithSlash && url2StartsWithSlash)
    return url1 + url2.slice(1);

  if (!url1EndsWithSlash && !url2StartsWithSlash)
    return url1 + '/' + url2;

  return url1 + url2;
};


/**
 * Performs a request towards gogs. This can only be used for the Gogs
 * API as it is hardcoded to go for /api/v1 and add the authentication
 * token to its headers.
 *
 * @param {String} method get, post etc
 * @param {String} url
 * @param {String|Object} data=null
 * @returns {EventEmitter}
 */
const performRequest = function(method, url, data = null) {
  config.exitIfNoTokenOrHost();

  const options = {
    baseUrl: joinUrl(config.getOption('hostname'), '/api/v1'),
    method : method,
    url    : url,
    headers: {
      Authorization: `token ${config.getOption('token')}`
    }
  };

  options.json = true;

  if (data) {
    options.body = data;
  }

  return new Promise((resolve, reject) => {
    // If the user wants to explicitly ignore all invalid certificate,
    // it can be set in the config. This disables the error thrown when
    // this happens.
    if (config.getOption('ignore_invalid_ssl_cert'))
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    request(options, (err, res, body) => {
      // Enable throwing on invalid certificates again
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
      if (err) {
        if (err.code === 'ECONNREFUSED')
          return reject(new error.CannotConnect(options.baseUrl));
        return reject(err);
      }

      if (res.statusCode >= 200 &&
          res.statusCode <= 299 ||
          res.statusCode === 304)
        return resolve(body);

      if (res.statusCode >= 0 && res.statusCode <= 199)
        return reject(new error.UnknownStatusCode(res.statusCode, options.url));

      if (res.statusCode === 301)
        return reject(new error.MovedPermanently(options.url, res.headers.location));

      if (res.statusCode === 302 || res.statusCode === 303)
        return reject(new error.Found(options.url, res.headers.location));

      if (res.statusCode >= 300 && res.statusCode <= 399)
        return reject(new error.UnknownStatusCode(res.statusCode, options.url));

      if (res.statusCode === 400)
        return reject(new error.InvalidRequest(body));

      if (res.statusCode === 401)
        return reject(new error.InvalidAccess());

      if (res.statusCode === 404)
        return reject(new error.NotFound('Resource', options.url));

      if (res.statusCode >= 400 && res.statusCode <= 499)
        return reject(new error.UnknownStatusCode(res.statusCode, options.url));

      if (res.statusCode === 500)
        return reject(new error.InternalGogsError());

      return reject(new error.UnknownStatusCode(res.statusCode, options.url));
    });
  });
};

module.exports.get = (url) => performRequest('GET', url);
module.exports.post = (url, data) => performRequest('POST', url, data);
module.exports.put = (url, data) => performRequest('PUT', url, data);
module.exports.delete = (url, data) => performRequest('DELETE', url, data);
module.exports.patch = (url, data) => performRequest('PATCH', url, data);

