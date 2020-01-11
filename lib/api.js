'use strict';
const request = require('./request');
const errors = require('./errors');

const isString = (x) => typeof x === 'string';
const isObject = (x) => typeof x === 'object' && x !== null;
const isArrayOfType = (type) => {
  return (arr) => Array.isArray(arr) && arr.every(x => typeof x === type);
};
const NAME_REGEX = /\$\{[\w_-]+\}/g;
const hasOwnProperty = (x, y) => Object.prototype.hasOwnProperty.call(x, y);

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
      const hasProperty = hasOwnProperty(incomingOptions, x.name) &&
                          typeof incomingOptions[x.name] !== 'undefined';

      if (!hasProperty && x.required)
        throw new TypeError(`Expected ${x.name} to be defined in options`);

      if (hasProperty && !x.typechecker(incomingOptions[x.name]))
        throw new TypeError(`Expected ${x.name} to be of type: ${x.type}`);
    });
  };
};

/**
 * Creates the API function that is responsible for checking that the
 * correct number of arguments are sent to the called function. For
 * instance, if the URL has two replacements as well as options, it will
 * require three arguments.
 *
 * It also readies the typechecking function and uses that whenever the
 * created function is called to make sure that the options sent to the
 * created function is of correct types.
 *
 * @private
 * @param {String} method the method to use
 * @param {String} url the url, with replacements in them.
 * @param {Object} [options] the options object
 * @returns {Function}
 */
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
const createAPIWrapper = exports.createAPIWrapper = function(def, options) {
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

// Below is a lot of JsDOC comments explaining each of the allowed API
// calls. This documentation is mostly for me so that my typechecker can
// give me suggestions to what the functions require

/**
 * Gogs
 *
 * @namespace
 * @type {Object}
 */
exports.gogs = {
  /**
   * @type {Object}
   */
  admin: {

    /**
      * @type {Object}
      */
    org: {

      /**
       * This allows you to create a repository on an organization of your
       * choosing. I assume, since this is under admin, that it can be
       * created within any organization
       *
       * @function
       * @param {String} adminUser
       * @param {Object} options
       * @returns {Promise}
       */
      create: createAPIWrapper('POST /admin/users/${adminUser}/orgs', {
        username   : {required: true, type: 'string'},
        'full_name': {type: 'string'},
        desc       : {type: 'string'},
        website    : {type: 'string'},
        location   : {type: 'string'},
      }),

      /**
        * @type {Object}
        */
      team: {

        /**
         * This allows you to create a team within an organization
         *
         * @function
         * @param {String} organization
         * @param {Object} options
         * @returns {Promise}
         */
        create: createAPIWrapper('POST /admin/orgs/${organization}/teams', {
          name       : {required: true, type: 'string'},
          description: {type: 'string'},
          permission : {type: 'string', choices: ['write', 'read', 'admin']}
        }),

        /**
         * This allows you to add a member to a team within an organization
         *
         * @function
         * @param {String} teamId
         * @param {String} username
         * @returns {Promise}
         */
        addUser: createAPIWrapper('PUT /admin/teams/${teamId}/members/${username}'),

        /**
         * This allows you to remove a member to a team within an organization
         *
         * @function
         * @param {String} teamId
         * @param {String} username
         * @returns {Promise}
         */
        deleteUser: createAPIWrapper('DELETE /admin/teams/${teamId}/members/${username}'),
      },
    },

    /**
     * @type {Object}
     */
    repo: {
      /**
       * Create a repository on any user. This, as all the other admin
       * routes, will require administrative rights.
       *
       * @function
       * @param {String} username
       * @param {Object} options
       * @returns {Promise}
       */
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

  /**
   * @type {Object}
   */
  issue: {

    /**
     * List all the issues for a specific repository
     *
     * @function
     * @param {String} username
     * @param {String} repository
     * @returns {Promise<Object[]>}
     */
    list: createAPIWrapper('GET /repos/${user}/${repo}/issues'),

    /**
     * Retrieve a specific issue
     *
     * @function
     * @param {String} username
     * @param {String} repository
     * @param {String} issueNumber
     * @returns {Promise<Object>}
     */
    get: createAPIWrapper('GET /repos/${user}/${repo}/issues/${number}'),

    /**
     * Create an issue within a specific repository
     *
     * @function
     * @param {String} username
     * @param {String} repository
     * @param {Object} options
     * @returns {Promise}
     */
    create: createAPIWrapper('POST /repos/${user}/${repo}/issues', {
      title    : {type: 'string'},
      body     : {type: 'string'},
      assignee : {type: 'string'},
      milestone: {type: 'number'},
      closed   : {type: 'boolean'},
    }),

    /**
     * Edit an issue within a specific repository. Empty fields are left
     * unchanged.
     *
     * @function
     * @param {String} username
     * @param {String} repository
     * @param {Object} options
     * @returns {Promise}
     */
    edit: createAPIWrapper('PATCH /repos/${user}/${repo}/issues/${number}', {
      title    : {type: 'string'},
      body     : {type: 'string'},
      assignee : {type: 'string'},
      milestone: {type: 'number'},
      closed   : {type: 'boolean'},
    }),

    /**
     * @type {Object}
     */
    comments: {
      /**
       * List all the comments for a specific repository
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @returns {Promise<Object[]>}
       */
      list: createAPIWrapper('GET /repos/${user}/${repo}/issues/comments'),

      /**
       * Retrieve all the comments for a specific issue within a
       * repository
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} issueNumber
       * @returns {Promise<Object[]>}
       */
      get: createAPIWrapper('GET /repos/${user}/${repo}/issues/${number}/comments'),

      /**
       * Create a comment on an issue within a repository
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} issueNumber
       * @param {Object} options
       * @returns {Promise}
       */
      create: createAPIWrapper('POST /repos/${user}/${repo}/issues/${number}/comments', {
        body: {required: true, type: 'string'}
      }),

      /**
       * Edit a comment on an issue within a repository
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} issueNumber
       * @param {String} commentId
       * @param {Object} options
       * @returns {Promise}
       */
      edit: createAPIWrapper('PATCH /repos/${user}/${repo}/issues/${number}/comments/${id}', {
        body: {required: true, type: 'string'}
      }),

      /**
       * Delete a comment on an issue within a repository
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} issueNumber
       * @param {String} commentId
       * @returns {Promise}
       */
      delete: createAPIWrapper('DELETE /repos/${user}/${repo}/issues/${number}/comments/${id}')
    },

    /**
     * @type {Object}
     */
    labels: {

      /**
       * List all the labels for a specific repository
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @returns {Promise<Object[]>}
       */
      list: createAPIWrapper('GET /repos/${user}/${repo}/labels'),

      /**
       * Retrieve a specific label
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} labelId
       * @returns {Promise<Object[]>}
       */
      get: createAPIWrapper('GET /repos/${user}/${repo}/labels/${id}'),

      /**
       * Create a new label within a repository
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} Object
       * @returns {Promise}
       */
      create: createAPIWrapper('POST /repos/${user}/${repo}/labels', {
        name : {required: true, type: 'string'},
        color: {required: true, type: 'string'},
      }),

      /**
       * Edit an existing label within a repository
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} labelId
       * @param {String} Object
       * @returns {Promise}
       */
      edit: createAPIWrapper('PATCH /repos/${user}/${repo}/labels/${id}', {
        name : {required: true, type: 'string'},
        color: {required: true, type: 'string'},
      }),

      /**
       * Delete a label within a repository
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} labelId
       * @returns {Promise}
       */
      delete: createAPIWrapper('DELETE /repos/${user}/${repo}/labels/${id}'),

      /**
       * Retrieve all the labels on a specific issue
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} issueNumber
       * @returns {Promise}
       */
      getOnIssue: createAPIWrapper('GET /repos/${user}/${repo}/issues/${id}/labels'),

      /**
       * Add new labels to the give issue
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} issueNumber
       * @param {Object} options
       * @returns {Promise}
       */
      addToIssue: createAPIWrapper('POST /repos/${user}/${repo}/issues/${id}/labels', {
        labels: {type: 'number[]'}
      }),

      /**
       * Remove the given labels on a specific issue
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} issueNumber
       * @param {Object} options
       * @returns {Promise}
       */
      removeFromIssue: createAPIWrapper('DELETE /repos/${user}/${repo}/issues/${id}/labels', {
        labels: {type: 'number[]'}
      }),

      /**
       * Remove all labels on an issue
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} issueNumber
       * @returns {Promise}
       */
      deleteAllOnIssue: createAPIWrapper('DELETE /repos/${user}/${repo}/issues/${id}/labels'),

      /**
       * Replace all labels on the issue with the given ones
       *
       * @function
       * @param {String} username
       * @param {String} repository
       * @param {String} issueNumber
       * @param {Object} options
       * @returns {Promise}
       */
      replaceAllOnIssue: createAPIWrapper('PUT /repos/${user}/${repo}/issues/${id}/labels', {
        labels: {type: 'number[]'}
      }),
    }
  },

  /**
   * @type {Object}
   */
  user: {

    /**
     * Retrieve information about the user of the token
     *
     * @function
     * @returns {Promise<Object>}
     */
    forToken: createAPIWrapper('GET /user')
  },

  /**
   * @type {Object}
   */
  repository: {

    /**
     * Retrieve all repositories that the user has write permissions to
     *
     * @function
     * @returns {Promise<Object[]>}
     */
    list: createAPIWrapper('GET /user/repos'),

    /**
     * List all the repositories for a specific user
     *
     * @function
     * @param {String} username
     * @returns {Promise<Object[]>}
     */
    listForUser: createAPIWrapper('GET /users/${username}/repos'),
    /**
     * List all the repositories for a specific organization
     *
     * @function
     * @param {String} username
     * @returns {Promise<Object[]>}
     */
    listForOrg : createAPIWrapper('GET /orgs/${orgname}/repos'),

    /**
     * List all the repositories for a user or organization, whichever
     * answers.
     *
     * @function
     * @param {String} name
     * @returns {Promise<Object[]>}
     */
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
          throw err;
        });
    },

    /**
     * Create a repository on the currently logged in user (by token)
     * given the options
     *
     * @function
     * @param {Object} options
     * @returns {Promise}
     */
    create: createAPIWrapper('POST /user/repos', {
      name       : {required: true, type: 'string'},
      description: {type: 'string'},
      private    : {type: 'boolean'},
      'auto_init': {type: 'boolean'},
      gitignores : {type: 'string'},
      license    : {type: 'string'},
      readme     : {type: 'string'}
    }),

    /**
     * Create a repository on the given organization. This will only
     * happen if the user has write permissions to that organization
     *
     * @function
     * @param {String} organization
     * @param {Object} options
     * @returns {Promise}
     */
    createOnOrg: createAPIWrapper('POST /org/${organization}/repos', {
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
