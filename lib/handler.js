'use strict';

/**
 * This is a wrapper for the handler in Yargs. This makes it so that it
 * adds a _getResult to the argv. This makes it so much easier to
 * perform tests and as such, should always be used.
 *
 * @param {Function} fn the handler function
 * @returns {Function}
 */
module.exports.mkHandler = function(fn) {
  return function(argv) {
    argv._getResult = async function() {
      return await fn(argv);
    };
  };
};
