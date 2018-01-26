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

## Example

```bash
# You either need to set GOGS_TOKEN and GOGS_HOST as environmental variables
# or you can create a config (defaults to ~/.config/gogs-cli/config.json) with these
# specified. See example config in repository. The path of the config file can
# be changed using the `GOGS_CONFIG` token
> gogs list issue reewr/gogs-cli
10 issue(s) was found:
#12 test (2018-01-25T20:40:03Z)
#11 test (2018-01-25T20:37:59Z)
#10 test (2018-01-25T20:34:35Z)
#9 test (2018-01-25T20:34:27Z)
#8 test (2018-01-25T20:33:01Z)
#7 test (2018-01-25T20:27:03Z)
#6 test (2018-01-25T20:17:01Z)
#5 test (2018-01-25T20:15:12Z)
#4 test (2018-01-25T20:14:52Z)
#3 test (2018-01-25T20:14:31Z)
```
