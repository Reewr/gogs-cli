'use strict';
const chalk    = require('chalk');
const wrapAnsi = require('wrap-ansi');
const hasOwnProperty = (x, y) => Object.prototype.hasOwnProperty.call(x, y);

/**
 * Returns a formatted date string in a similar fashion to ISO format,
 * with the exception that the date is always in localtime and only
 * includes seconds if they're not 0.
 *
 * @param {String|Date} d valid date string or a date
 * @returns {String}
 */
module.exports.date = function(d) {
  const date = typeof d === 'string' ? new Date(d) : d;

  if (!date || typeof date !== 'object' || typeof date.getTime !== 'function' || isNaN(date.getTime()))
    throw new TypeError('date must be a valid date');

  const pad = (num) => num < 10 ? '0' + num : num;
  let dateStr = date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    ' ' + pad(date.getUTCHours()) +
    ':' + pad(date.getMinutes());

  if (date.getSeconds() !== 0)
    dateStr += ':' + pad(date.getSeconds());

  return dateStr;
};

module.exports.since = function(d) {
  const date = typeof d === 'string' ? new Date(d) : d;

  if (!date || typeof date !== 'object' || typeof date.getTime !== 'function' || isNaN(date.getTime()))
    throw new TypeError('date must be a valid date');

  const plural  = (x) => x !== 1 ? 's' : '';
  const diff    = Date.now() - date.getTime();
  const seconds = diff / 1000;
  const minutes = seconds / 60;
  const hours   = minutes / 60;
  const days    = hours / 24;
  const week    = days / 7;
  const month   = days / 30.436875;
  const year    = days / 365.2425;

  const round = function(strings, x, fn) {
    const rounded = Math.round(x);

    return strings[0] + rounded + strings[1] + fn(rounded) + strings[2];
  };

  const withinLimits = (x, limit, atleast) => {
    const rounded = Math.round(x);

    if (rounded < atleast)
      return false;

    return x - limit < rounded && rounded < x + limit;
  };

  if (year >= 1)
    return round`~${year} year${plural} ago`;

  if (withinLimits(month, 0.1, 1))
    return round`~${month} month${plural} ago`;

  if (withinLimits(week, 0.1, 1))
    return round`~${week} week${plural} ago`;

  if (days >= 1)
    return round`~${days} day${plural} ago`;

  if (hours >= 1)
    return round`~${hours} hour${plural} ago`;

  if (minutes >= 1)
    return round`~${minutes} minute${plural} ago`;

  return round`~${seconds} second${plural} ago`;
};

/**
 * Formats the user into a text string that uses both the full name (if
 * available) and the username.
 *
 * @param {Object} user
 * @returns {String}
 */
exports.author = function(user) {
  if (typeof user !== 'object' || !user)
    throw new TypeError('user must be an object');

  if (!hasOwnProperty(user, 'username'))
    throw new TypeError('user.username must be defined');

  const username    = user.username;
  const hasFullname = hasOwnProperty(user, 'fullname');
  const fullname    = hasFullname ? user.fullname : user.full_name || '';

  if (username && fullname)
    return `${fullname} (@${username})`;

  return `@${username}`;
};

/**
 * Takes a string and wraps it at the column given before indenting it
 * once with a tab. This tries to make sure that the text never goes
 * above the given width.
 *
 * @param {String} text
 * @param {Number} [columnWidth=80]
 * @returns {String}
 */
exports.wrapAndIndent = function(text, columnWidth = 80) {
  return wrapAnsi(text, columnWidth - 4)
    .split('\n')
    .map(x => '\t' + x)
    .join('\n');
};

/**
 * Formats a label retrieved from Gogs by giving it a color background
 * equal to that of the color it has in Gogs. Adds some whitespace to
 * either side of the text to give it more of a label like quality.
 *
 * @param {Object} label
 * @returns {String}
 */
exports.label = function(label) {
  if (chalk.enabled)
    return chalk.bgHex(`#${label.color}`)(' ' + label.name + ' ');
  return label.name;
};

exports.issue = function(issue, wrapColumn = 80, useColor = true) {
  if (typeof issue !== 'object')
    throw new TypeError('issue must be an object');

  if (typeof issue.title !== 'string')
    throw new TypeError('issue.title must be defined');

  const chalkEnabled = chalk.enabled;

  // do not override global disables
  if (chalkEnabled && !useColor)
    chalk.enabled = false;

  const body    = issue.body === '' ? 'There is no content yet' : issue.body;
  const author  = exports.author(issue.user);
  const since   = exports.since(issue.created_at);
  const labelText = chalk.enabled ? '' : 'labels: ';
  const state   = issue.state === 'closed' ?
    chalk`{red ${issue.state}}` :
    chalk`{green ${issue.state}}`;

  const content = [
    chalk`{gray #${issue.number}} - ${issue.title}`,
    chalk`${author} {green opened} this issue {yellow ${since}} ${state}`,
    chalk`${labelText}${issue.labels.map(exports.label).join(' ')}`,
    `${exports.wrapAndIndent(body, wrapColumn)}`,
    '',
  ];

  chalk.enabled = chalkEnabled;

  return content.join('\n');
};

/**
 * Gogs is not really that good at reporting what comments do. For
 * instance, it is illegal (I think) to have a comment without content,
 * but closing/opening issues are considered comments with empty body.
 *
 * In order to handle these edge cases, this function assumes that every
 * issue starts out being open. For each comment without a body, it is
 * assumed that this is changing a state on the issue.
 *
 * In addition, references made through commits are also considered
 * comments, but only contain an '<a>' link to the commit in question.
 *
 * @param {Object} issue
 * @param {Object[]} comments
 * @param {Number} [wrapColumn=80]
 * @param {Boolean} [useColor=true]
 * @returns {String}
 */
exports.comments = function(issue, comments, wrapColumn = 80, useColor = true) {
  const alink = /^<a href="[\/\w+]+\/(.+)">(.+)<\/a>$/g;
  const chalkEnabled = chalk.enabled;

  // do not override global disables
  if (chalkEnabled && !useColor)
    chalk.enabled = false;

  // assume that every issue starts as open
  let isOpen = true;

  const formatted =  comments.map(comment => {
    const author = exports.author(comment.user);
    const since  = exports.since(comment.created_at);

    if (comment.hidden) {
      // So that we dont lose track of the state changes, even when
      // hiding certain comments
      if (comment.body === '')
        isOpen = !isOpen;
      return '';
    }

    // assume that empty body comments are state changes,
    // since they do not specify this specifically.
    if (comment.body === '') {
      const state = isOpen ? chalk`{red closed}` : chalk`{green reopened}`;
      const text = `${author} ${state} the issue`;

      isOpen = !isOpen;
      return text + chalk` {yellow ${since}}`;
    }

    const match = alink.exec(comment.body);

    if (match) {
      // eslint-disable-next-line
      const [_, commitHash, commitMessage] = match;

      return [
        chalk`${author} references this from a commit {yellow ${since}}:`,
        chalk`${commitMessage} {gray (${commitHash})}`
      ].join('\n\t');
    }

    return [
      chalk`${author} commented {yellow ${since}}:`,
      exports.wrapAndIndent(comment.body, wrapColumn)
    ].join('\n');
  }).filter(x => x !== '').join('\n\n');

  chalk.enabled = chalkEnabled;

  return formatted;
};
