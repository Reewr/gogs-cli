'use strict';
module.exports = {
  command: 'gen-completion',
  desc   : 'Generates the completion as a bash script',
  builder: function(yargs) {
    return yargs.showCompletionScript();
  },
  handler: {}
};
