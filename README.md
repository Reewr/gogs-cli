# Gogs-cli

This command line interfaces tries to make it easier to work with Gogs outside of the Browser. The tool is work-in-progress, but has some useful features right now.

## Getting started

In order to get started, it is recommended to install this as global package so you can add `gogs` to your path in Bash. To do this, make sure that your `.npmrc` file has the `prefix` set to somewhere in your homefolder (such as `~/global_npm_packages`).

Then:

```
npm install -g gogs-cli
```

In your bashrc you can then add `~/.global_npm_packages/bin` to your PATH.

The first commands you want to run is to set the configuration file. If you want to save the configuration file to somewhere else than `~/.config/gogs-cli/config.json`, please specify a path using the `GOGS_CLI_CONFIG_PATH` environment variable.

```
gogs config set host <INSERT_GOGS_HOSTNAME>
gogs config set token <INSERT_TOKEN>
```

After this, you're good to go and can run any of the commands you'd like.

The current capabilities include:

- Adding and listing repositories
- Adding, listing, reading and replying to issues
- Finding user

I plan to support all of the Gogs API through a sensible commandline, even administrative options

## Getting autocompletion

The auto-completion is still in development and will in the future also allow you to cache repositories and issues, but for now, you will need to do the following:

```bash
gogs util gen-completion > some-file.sh
source some-file.sh
```

The above will give you auto-completion on all commands that has completions as well as new ones that will come. You should add the sourcing of the file to your .bashrc file if you want this behaviour in every terminal you open.

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
