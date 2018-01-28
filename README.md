# Gogs-cli

This commandline interfaces tries to make it easier to work with Gogs outside of the Browser. The tool is work-in-progress, but has some useful features right now.

## Getting started

In order to get started, it is recommended to install this as global package so you can add `gogs` to your path in Bash. To do this, make sure that your `.npmrc` file has the `prefix` set to somewhere in your homefolder (such as `~/global_npm_packages`).

Then:

```
npm install -g gogs-cli
```

In your bashrc you can then add `~/.global_npm_packages/bin` to your PATH.

The first commands you want to run is to set the configuration file. If you want to save the configuration file to somewhere else than `~/.config/gogs-cli/config.json`, please specify a path using the `GOGS_CONFIG` environment variable.

```
gogs config set host <INSERT_GOGS_HOSTNAME>
gogs config set token <INSERT_TOKEN>
```

After this, you're good to go and can run any of the commands you'd like. The ONLY exception to this is any **destructive** commands, such as **delete**. These are NOT enabled by default. In order to use these, you will also need to use the command `gogs config set enable_destructive true`. Every one of these commands will also have a `--force` parameter which enables you to use these commands without enabling the destructive option.

## Testing

In order to test, you will need a local Gogs instance that the cli can contact and change. It primarily adds lots of repositories and issues.

When this is done, the following environment variables must be defined:

**GOGS_CLI_TEST_HOST**

The hostname of the Gogs testing instance

**GOGS_CLI_TEST_USERNAME**

The user to perform tests with. This has to be an active user within the Gogs instance.

**GOGS_CLI_TEST_TOKEN**

The token to test with. This should be a token created by the user specified as "TEST_USERNAME".

**GOGS_CLI_TEST_ORGANIZATION**

The organization to test with. This has to be an organization where "GOGS_CLI_TEST_USERNAME" is an owner so it can add repositories.

**GOGS_CLI_TEST_PORT**

If the Gogs instance does not run on normal ports for the HTTP/HTTPS hostname specified, you will need to specify that.
