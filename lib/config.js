'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const log = require('logule').init(module, 'Config');

let config = null;

const getConfigPath = function() {
  if (process.env.GOGS_CONFIG) {
    log.debug('Trying config path environment variable');
    return process.env.GOGS_CONFIG;
  }

  log.debug('Trying config in home');
  const homedir = os.homedir();
  const configJoin = ['.config', 'gogs-cli', 'config.json'];

  return path.join(homedir, ...configJoin);
};

const loadConfig = function() {
  if (process.env.GOGS_TOKEN && process.env.GOGS_HOST) {
    log.debug('Using environment variables since they exist');
    config = {
      token: process.env.GOGS_TOKEN,
      host : process.env.GOGS_HOST,
      port : process.env.GOGS_PORT || null,
      debug: process.env.GOGS_DEBUG || false,
    };
  } else {
    const configPath = getConfigPath();

    try {
      config = JSON.parse(fs.readFileSync(configPath).toString());
    } catch (err) {
      if (err.code !== 'ENOENT') {
        log.error(`Failed to load config "${configPath}"`, err);
        return process.exit(1);
      }
    }
  }

  if (!config) {
    console.error('ERR: Missing config file or enviromental variables');
    return process.exit(1);
  }

  if (!config.token) {
    console.error('ERR: Missing token in config file or environment variables');
    return process.exit(1);
  }

  if (!config.host) {
    console.error('ERR: Missing host in config file or environment variables');
    return process.exit(1);
  }

  config.port = config.port || null;
  config.debug = config.debug || false;

  return config;
};

module.exports = {
  get GOGS_TOKEN() {
    if (!config)
      loadConfig();
    return config.token;
  },
  get GOGS_HOST() {
    if (!config)
      loadConfig();
    return config.host;
  },
  get GOGS_PORT() {
    if (!config)
      loadConfig();
    return config.port;
  },
  get GOGS_DEBUG() {
    if (!config)
      loadConfig();
    return config.debug;
  }
};
