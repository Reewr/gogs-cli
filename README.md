# Gogs-cli

This commandline interfaces tries to make it easier to work with Gogs outside of the Browser. The tool is work-in-progress, but has some useful features right now.

The CLI is able to do the following right now:


- Repository
  - List all repositories available for user
  - Create repository
- Issue
  - List issues of repository
  - Read issue (with all comments)
  - Create issue in repository

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
