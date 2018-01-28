'use strict';
module.exports = {
  command: 'show-completion',
  desc   : 'Shows the completion as a bash script',
  builder: function(yargs) {
    return yargs.showCompletionScript();
  },
  handler: {}
};
