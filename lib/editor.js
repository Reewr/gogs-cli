'use strict';
const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const wrap  = require('wrap-ansi');
const spawn = require('child_process').spawn;

class EditorAborted extends Error {
  constructor(...args) {
    super('Aborted due to empty message from editor', ...args);
  }
}

class EditorNonZeroExitCode extends Error {
  constructor(exitCode, ...args) {
    super('Aborted due to non-zero exit code from editor', ...args);
    this.exitCode = exitCode;
  }
}
/**
 * Opens the editor of choice in the terminal to let the user insert
 * text that is then returned in the given promise.
 *
 * If the user closes the editor without writing anything to the file,
 * the operation is considered to be aborted and an instance of
 * EditorAborted is thrown (through rejection).
 *
 * If the editor returns a non-zero code exit code,
 * EditorNonZeroExitCode is thrown, where .exitcode is the exit code.
 *
 * **comment** is the comment to add to the editor. The first line of
 * the editor is always empty to allow the user to immediately write
 * text. All comments are placed under the first line. Each line of the
 * comment should start with the **commentCharacter** variable so that
 * they can be easily stripped from the rest of the content.
 *
 * The comment is hard wrapped to 80 characters automatically, with each
 * wrapped line starting with the **commentCharacter**. Use a
 * **commentCharacter** that is unusual to use in the given language.
 *
 * @param {String} filetype file extension, md, js, etc.
 * @param {String} [comment=''] See section above.
 * @param {String} [commentCharacter='////']
 * @returns {Promise<String>}
 */
module.exports = function(filetype, comment = '', commentCharacter = '////') {
  const editor      = process.env.EDITOR || 'vi';
  const extension   = filetype.startsWith('.') ? filetype.slice(1) : filetype;
  const tmpFilename = `${Date.now()}-gogs.cli-editor.${extension}`;
  const tmpPath     = path.join(os.tmpdir(), tmpFilename);
  const formattedComment = comment === '' ?
    '' :
    wrap(comment, 80)
      .trim()
      .split('\n')
      .map(x => {
        if (x.startsWith(commentCharacter))
          return x;
        return commentCharacter + ' ' + x;
      }).join('\n').trim();

  fs.writeFileSync(tmpPath, formattedComment);

  const child = spawn(editor, [tmpPath], {
    stdio: 'inherit'
  });

  return new Promise((resolve, reject) => {
    child.on('exit', function(exitCode) {
      if (exitCode !== 0)
        return reject(new EditorNonZeroExitCode(exitCode));

      const content = fs
        .readFileSync(tmpPath)
        .toString()
        .split('\n')
        .filter(x => !x.startsWith(commentCharacter))
        .join('\n')
        .trim();

      if (content.length === 0)
        return reject(new EditorAborted());

      fs.unlinkSync(tmpPath);
      resolve(content);
    });
    child.on('error', reject);
  });
};

module.exports.EditorAborted = EditorAborted;
module.exports.EditorNonZeroExitCode = EditorNonZeroExitCode;
