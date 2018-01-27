'use strict';
module.exports.mkHandler = function(fn) {
  return function(argv) {
    argv._getResult = async function() {
      return await fn(argv);
    };
  };
};
