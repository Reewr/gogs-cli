'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const hasOwnProperty = (x, y) => Object.prototype.hasOwnProperty.call(x, y);

class Config {
  constructor() {
    this.store = {};
    this.locked = false;
    this.loaded = false;
  }

  addOption(options = {
    name        : null,
    defaultValue: null,
    description : '',
    typechecker : () => {}
  }) {
    if (this.locked)
      throw new Error('Config is locked and new values cannot be added');

    if (!options || typeof options !== 'object')
      throw new TypeError('options must be an object');

    if (typeof options.name !== 'string')
      throw new TypeError('options.name must be a string');

    if (hasOwnProperty(this.store, options.name))
      throw new Error(`Duplicate entry, ${options.name} is already in storage`);

    if (typeof options.typechecker !== 'function')
      options.typechecker = (x) => x;

    this.store[options.name] = {
      value      : options.defaultValue,
      description: options.description || '',
      typechecker: options.typechecker
    };
  }

  /**
   * Returns the list of names that are considered to be legal options
   * for setOption and getOption
   *
   * @returns {String[]}
   */
  getAvailableOptions() {
    return Object.keys(this.store);
  }

  /**
   * Locks the configuration down, disallowing adding more properties
   * through addOption
   */
  lock() {
    this.locked = true;
  }

  /**
   * Retrieves the value of an option by name. If the option does not
   * exist, an error is thrown.
   *
   * @param {String} name
   * @returns {Value}
   */
  getOption(name) {
    if (!hasOwnProperty(this.store, name))
      throw new TypeError('No such config entry');

    return this.store[name].value;
  }

  /**
   * Sets the value of a given option. If the value does not already
   * exist within the store, an error is thrown.
   *
   * @param {String} name
   * @param {Value} value
   * @param {Boolean} [saveConfig=true]
   *   if true, saves the config to file
   */
  setOption(name, value, saveConfig = true) {
    if (!hasOwnProperty(this.store, name))
      throw new TypeError('No such config entry');

    this.store[name].value = this.store[name].typechecker(value);

    if (saveConfig)
      this.save();
  }

  /**
   * Returns the description of a configuration option. If the option
   * does not exist an error is thrown.
   *
   * @param {String} name
   * @returns {String}
   */
  getDescriptionForOption(name) {
    if (!hasOwnProperty(this.store, name))
      throw new TypeError('No such config entry');

    return this.store[name].description;
  }

  /**
   * Tries to retrieve the configuration file path from the environment
   * variables. If it cannot be found, it defaults to
   * ~/.config/gogs-cli/config.json
   *
   * @private
   * @returns {String}
   */
  getSavePath() {
    if (process.env.GOGS_CLI_CONFIG_PATH) {
      return process.env.GOGS_CLI_CONFIG_PATH;
    }

    const homedir = os.homedir();
    const configJoin = ['.config', 'gogs-cli', 'config.json'];

    return path.join(homedir, ...configJoin);
  }

  /**
   * Checks if the configuration path points to a config file
   *
   * @private
   * @returns {Boolean}
   */
  hasFile() {
    return fs.existsSync(this.getSavePath());
  }

  /**
   * Saves the configuration file to the configuration path found by
   * getConfigPath. If the folders don't exist, these are created.
   *
   * @private
   */
  save() {
    const targetPath = this.getSavePath();
    const targetDir = path.dirname(targetPath);

    targetDir.split(path.sep).reduce((parentDir, childDir) => {
      const currentDir = path.resolve(parentDir, childDir);

      try {
        fs.mkdirSync(currentDir);
      } catch (err) {
        if (err.code !== 'EEXIST')
          throw err;
      }

      return currentDir;
    }, path.sep);

    const stored = Object.keys(this.store).reduce((o, key) => {
      o[key] = this.store[key].value;
      return o;
    }, {});

    fs.writeFileSync(targetPath, JSON.stringify(stored));
  }

  /**
   * Tries to load the configuration file from the configuration file or
   * from the environment variables.
   *
   * Returns the loaded config. Also sets the config in the global scope
   * within this module.
   *
   * @private
   * @returns {Object}
   */
  load() {
    if (this.loaded)
      return;

    if (process.env.GOGS_CLI_TOKEN && process.env.GOGS_CLI_HOSTNAME) {
      this.setOption('token', process.env.GOGS_CLI_TOKEN, false);
      this.setOption('hostname', process.env.GOGS_CLI_HOSTNAME, false);
      this.setOption('debug', process.env.GOGS_CLI_DEBUG || false, false);
    } else {
      const configPath = this.getSavePath();

      try {
        const config = JSON.parse(fs.readFileSync(configPath).toString());

        Object.keys(this.store).forEach(x => {
          if (config.hasOwnProperty(x))
            this.setOption(x, config[x], false);
        });
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`Failed to load config "${configPath}"`, err);
          return process.exit(1);
        }
      }
    }

    this.loaded = true;
    this.setOption('debug', this.getOption('debug') || false, false);
  }
}

const CREATED_CONFIG = new Config();

CREATED_CONFIG.addOption({
  name        : 'hostname',
  defaultValue: null,
  description : 'The address to the Gogs webserver, including ports if required'
});

CREATED_CONFIG.addOption({
  name        : 'token',
  defaultValue: null,
  description : 'The access token generated by Gogs. Can be generated by going ' +
                'to Gogs -> Your Settings -> Applications -> Generate New Token'
});

CREATED_CONFIG.addOption({
  name        : 'debug',
  defaultValue: false,
  description : 'If true, debug messages are logged'
});

CREATED_CONFIG.addOption({
  name        : 'ignore_invalid_ssl_cert',
  defaultValue: false,
  description : 'By default, when using HTTPS and coming upon an invalid SSL ' +
                'certificate, the application will throw an error and exit. ' +
                'If you wish to ignore invalid SSL certificates, set this to ' +
                'true. NOTE: Enabling this is considered unsafe. Please be ' +
                'aware of the possible consequences of enabling this option'
});

CREATED_CONFIG.lock();

if (CREATED_CONFIG.hasFile())
  CREATED_CONFIG.load();

module.exports = CREATED_CONFIG;

/**
 * Tries to load the config. If the loaded config does not have a
 * token or a hostname field, an error is thrown to indicate that these
 * has to be specified.
 *
 * @returns {null}
 */
module.exports.exitIfNoTokenOrHost = function() {
  if (CREATED_CONFIG)
    CREATED_CONFIG.load();

  if (!CREATED_CONFIG.getOption('token')) {
    console.error('ERR: Missing token in config file or environment variables');
    return process.exit(1);
  }

  if (!CREATED_CONFIG.getOption('hostname')) {
    console.error('ERR: Missing hostname in config file or environment variables');
    return process.exit(1);
  }
};
