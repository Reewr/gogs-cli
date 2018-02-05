'use strict';

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

  if (!user.hasOwnProperty('username'))
    throw new TypeError('user.username must be defined');

  const username    = user.username;
  const hasFullname = user.hasOwnProperty('fullname');
  const fullname    = hasFullname ? user.fullname : user.full_name || '';

  if (username && fullname)
    return `${fullname} (@${username})`;

  return `@${username}`;
};
