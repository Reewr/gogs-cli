'use strict';
const request = require('./request');
const errors = require('./errors');

const isString = (x) => typeof x === 'string';
const isObject = (x) => typeof x === 'object' && x !== null;
const isArrayOfType = (type) => {
  return (arr) => Array.isArray(arr) && arr.every(x => typeof x === type);
};
const NAME_REGEX = /\$\{[\w_-]+\}/g;

const makeTypechecker = function(options) {
  if (!isObject(options))
    return () => undefined;

  const keys = Object.keys(options);

  if (keys.length === 0)
    return () => undefined;

  const typecheckers = keys.map(x => {
    const value        = options[x];
    let type           = value.type || '';
    let typechecker    = () => true;
    const expectsArray = type.indexOf('[]') !== -1;

    type = type.replace('[]', '');

    if (expectsArray)
      typechecker = isArrayOfType(type);
    else if (type && Array.isArray(value.choices) && value.choices.length)
      typechecker = (y) => typeof y === type && value.choices.includes(y);
    else if (type)
      typechecker = (y) => typeof y === type;

    return {
      name       : x,
      required   : options[x].required || false,
      typechecker: typechecker,
      type       : options[x].type || '',
    };
  });

  return function(incomingOptions) {
    typecheckers.forEach(x => {
      const hasProperty = incomingOptions.hasOwnProperty(x.name) &&
                          typeof incomingOptions[x.name] !== 'undefined';

      if (!hasProperty && x.required)
        throw new TypeError(`Expected ${x.name} to be defined in options`);

      if (hasProperty && !x.typechecker(incomingOptions[x.name]))
        throw new TypeError(`Expected ${x.name} to be of type: ${x.type}`);
    });
  };
};

const makeAPIFn = function(method, url, options) {
  const names = url.match(NAME_REGEX) || [];
  const throwIfInvalidTypes = makeTypechecker(options);

  const ret = function(...args) {
    if (args.length < names.length)
      throw new TypeError('missing arguments ' + names.slice(arguments.length));

    if (options && args.length < names.length + 1)
      throw new TypeError('Missing options object');

    throwIfInvalidTypes(args[args.length - 1]);

    const replacedUrl = url.replace(NAME_REGEX, () => {
      return args.shift();
    });

    return request[method.toLowerCase()](
      replacedUrl,
      options ? args.pop() : undefined);
  };

  ret._getArgNames = () => names;

  return ret;
};

const VALID_METHODS = [ 'GET', 'POST', 'PUT', 'DELETE', 'PATCH' ];

/**
 * Makes a wrapper around an URL specified by the `def` argument. The
 * `def` argument should contain the method to use together with the
 * URL, separated by spaces, such as "GET /user/repos". '${name}' is
 * used to indicate that some variable should replace this value.
 *
 * The `options` object can be used to define what values are acceptable
 * and what values are required. It can also be used to define the types
 * of the different variables.
 *
 * {
 *   name: {required: true, type: 'string'},
 *   description: {type: 'string'}
 * }
 *
 * The above definition says that this route does not accept anything
 * other than an object with `name` and `description`, where both have
 * to be strings but only `name` is required.
 *
 * The `required` field in the `options` object is simply true or false.
 * The `type` can be the following, 'string', 'boolean', 'number'. In
 * addition, you can also have arrays of the previous mentioned by
 * adding a '[]' to the end of each type.
 *
 * Lastly, there's the `choices` field. This is an array of the
 * different values that are considered choices. If a value is not one
 * of these choices, an error is thrown. Keep in mind that a choices
 * field of no elements is not considered a valid option and will simply
 * default back to its normal value. You cannot have `choices` without
 * specifying `type`.
 *
 * The returned object is a function that can be called with the
 * arguments needed to replace the URL string as well as the data
 * (object) to send with the request. For instance, given the url
 * `/repos/${username}/${repository}/issues`, it requires at least two
 * arguments, the first of which will replace the username, the second
 * replacing the repository. The third argument is considered to the be
 * data to send with the request.
 *
 * @param {String} def
 * @param {Object} [options]
 * @returns {Function}
 */
const createAPIWrapper = module.exports.createAPIWrapper = function(def, options) {
  if (!isString(def))
    throw new TypeError('def must be a string');

  if (def.indexOf(' ') === -1)
    throw new Error('def must follow POST:URL standard');

  const [method, url] = def.split(' ');

  if (VALID_METHODS.indexOf(method.toUpperCase()) === -1)
    throw new Error('Method in def must be one of ' + VALID_METHODS.join(', '));

  if (url.trim().indexOf('/') !== 0)
    throw new Error('url in def must start with /');

  return makeAPIFn(method, url, options);
};

module.exports.gogs = {
  admin: {
    org: {
      create: createAPIWrapper('POST /admin/users/${adminUser}/orgs', {
        username   : {required: true, type: 'string'},
        'full_name': {type: 'string'},
        desc       : {type: 'string'},
        website    : {type: 'string'},
        location   : {type: 'string'},
      })
    },
    team: {
      create: createAPIWrapper('POST /admin/orgs/${organization}/teams', {
        name       : {required: true, type: 'string'},
        description: {type: 'string'},
        permission : {type: 'string', choices: ['write', 'read', 'admin']}
      }),
      addUser   : createAPIWrapper('PUT /admin/teams/${teamId}/members/${username}'),
      deleteUser: createAPIWrapper('DELETE /admin/teams/${teamId}/members/${username}'),
    },
    repo: {
      add: createAPIWrapper('POST /admin/users/${username}/repos', {
        name       : {required: true, type: 'string'},
        description: {type: 'string'},
        private    : {type: 'boolean'},
        'auto_init': {type: 'boolean'},
        license    : {type: 'string'},
        readme     : {type: 'string'}
      })
    },
  },

  issue: {
    list  : createAPIWrapper('GET /repos/${user}/${repo}/issues'),
    get   : createAPIWrapper('GET /repos/${user}/${repo}/issues/${number}'),
    create: createAPIWrapper('POST /repos/${user}/${repo}/issues', {
      title    : {type: 'string'},
      body     : {type: 'string'},
      assignee : {type: 'string'},
      milestone: {type: 'number'},
      closed   : {type: 'boolean'},
    }),
    edit: createAPIWrapper('PATCH /repos/${user}/${repo}/issues/${number}', {
      title    : {type: 'string'},
      body     : {type: 'string'},
      assignee : {type: 'string'},
      milestone: {type: 'number'},
      closed   : {type: 'boolean'},
    }),

    comments: {
      list: createAPIWrapper('GET /repos/${user}/${repo}/issues/comments'),
      get : createAPIWrapper('GET /repos/${user}/${repo}/issues/${number}/comments', {
        since: {type: 'string'}
      }),

      create: createAPIWrapper('POST /repos/${user}/${repo}/issues/${number}/comments', {
        body: {required: true, type: 'string'}
      }),

      edit: createAPIWrapper('PATCH /repos/${user}/${repo}/issues/${number}/comments/${id}', {
        body: {required: true, type: 'string'}
      }),

      delete: createAPIWrapper('DELETE /repos/${user}/${repo}/issues/${number}/comments/${id}')
    },

    labels: {
      list  : createAPIWrapper('GET /repos/${user}/${repo}/labels'),
      get   : createAPIWrapper('GET /repos/${user}/${repo}/labels/${id}'),
      create: createAPIWrapper('POST /repos/${user}/${repo}/labels', {
        name : {required: true, type: 'string'},
        color: {required: true, type: 'string'},
      }),
      edit: createAPIWrapper('PATCH /repos/${user}/${repo}/labels', {
        name : {required: true, type: 'string'},
        color: {required: true, type: 'string'},
      }),
      delete    : createAPIWrapper('DELETE /repos/${user}/${repo}/labels'),
      getOnIssue: createAPIWrapper('GET /repos/${user}/${repo}/issues/${id}/labels'),
      addToIssue: createAPIWrapper('POST /repos/${user}/${repo}/issues/${id}/labels', {
        labels: {type: 'number[]'}
      }),
      removeLabelFromIssue: createAPIWrapper('DELETE /repos/${user}/${repo}/issues/${id}/labels', {
        labels: {type: 'number[]'}
      }),
      deleteAllLabelOnIssue : createAPIWrapper('DELETE /repos/${user}/${repo}/issues/${id}/labels'),
      replaceAllLabelOnIssue: createAPIWrapper('PUT /repos/${user}/${repo}/issues/${id}/labels', {
        labels: {type: 'number[]'}
      }),
    }
  },

  repository: {
    list            : createAPIWrapper('GET /user/repos'),
    listForUser     : createAPIWrapper('GET /users/${username}/repos'),
    listForOrg      : createAPIWrapper('GET /orgs/${orgname}/repos'),
    listForOrgOrUser: function(name) {
      return this.listForUser(name)
        .then(repos => {
          return repos.filter(x => {
            const [username] = x.full_name.split('/');

            return username === name;
          });
        })
        .catch(err => {
          if (err instanceof errors.NotFound)
            return request.get(`/orgs/${name}/repos`);
          throw err;
        })
        .then(repos => repos)
        .catch(err => {
          if (err instanceof errors.NotFound)
            throw new errors.NotFound('Repository', name);
        });
    },
    create     : createAPIWrapper('POST /user/repos', {
      name       : {required: true, type: 'string'},
      description: {type: 'string'},
      private    : {type: 'boolean'},
      'auto_init': {type: 'boolean'},
      gitignores : {type: 'string'},
      license    : {type: 'string'},
      readme     : {type: 'string'}
    }),

    createOnOrg: createAPIWrapper('POST /user/repos', {
      name       : {required: true, type: 'string'},
      description: {type: 'string'},
      private    : {type: 'boolean'},
      'auto_init': {type: 'boolean'},
      gitignores : {type: 'string'},
      license    : {type: 'string'},
      readme     : {type: 'string'}
    }),
  }
};
