# Gogs-cli

This command line interfaces tries to make it easier to work with Gogs outside of the Browser. The tool is work-in-progress, but has some useful features right now.

## Getting started

In order to get started, it is recommended to install this as global package so you can add `gogs` to your path in Bash. To do this, make sure that your `.npmrc` file has the `prefix` set to somewhere in your home folder (such as `~/global_npm_packages`).

Then:

```
npm install -g gogs-cli
```

In your .bashrc you can then add `~/.global_npm_packages/bin` to your PATH, by for instance adding the below:

```bash
if [ -d "$HOME/.global_npm_packages/bin" ]; then
  export PATH:$PATH:$HOME/.global_npm_packages
fi
```

The first commands you want to run is to set the configuration file. If you want to save the configuration file to somewhere else than `~/.config/gogs-cli/config.json`, please specify a path using the `GOGS_CLI_CONFIG_PATH` environment variable.

```
gogs config set hostname <INSERT_GOGS_HOSTNAME>
gogs config set token <INSERT_TOKEN>
```

After this, you're good to go and can run any of the commands you'd like.

## Commands

Full command list:

```bash
> # CLI utility commands
> gogs config get <name>
> gogs config set <name> <value>
> gogs config describe <name>
> gogs config util gen-completion
>
> # issue commands
> # <repository> is in the format reewr/gogs-cli
> gogs issue add <repository> [title]
> gogs issue list [repository]|[username]|[organization]|<assigned>
> gogs issue read <repository> <number>
> gogs issue reply <repository> <issuenumber>
>
> # repository commands
> gogs repo add <name>
> gogs repo list [username_or_orgname]
>
> # User commands
> gogs user find <username>
```

A lot of the commands above have multiple uses, such as `issue list`, where it can be used to list issue from a single or multiple repositories

I plan to eventually support all of the Gogs API through sensible command line actions, even administrative options.

## Getting autocompletion

The auto-completion is still in development and will in the future also allow you to cache repositories and issues, but for now, you will need to do the following:

```bash
gogs util gen-completion > some-file.sh
source some-file.sh
```

The above will give you auto-completion on all commands that has completions as well as new ones that will come. You should add the sourcing of the file to your .bashrc file if you want this behaviour in every terminal you open.

## Testing

In order to test, you will need a local Gogs instance that the CLI can contact and change. It primarily adds lots of repositories and issues.

**Note**: The local Gogs server should NOT be a production server and should only be one running for development. This is due to number of repositories and issues that are created. The best bet is to get one up and running using Docker.

**GOGS_CLI_TEST_HOSTNAME**

The hostname of the Gogs testing instance, including the port and protocol (example: "http://localhost:10080")

**GOGS_CLI_TEST_USERNAME**

The user to perform tests with. This has to be an active user within the Gogs instance.

**GOGS_CLI_TEST_TOKEN**

The token to test with. This should be a token created by the user specified as `GOGS_CLI_TEST_USERNAME`.

**GOGS_CLI_TEST_ORGANIZATION**

The organization to test with. This has to be an organization where `GOGS_CLI_TEST_USERNAME` is an owner so it can add repositories.
