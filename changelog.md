# Changelog

This file will contain the most important changes in the different versions of the package.

While the version is below v1, it will follow this versioning:

Minor version change (0.x.0) means a breaking change that may require you to do some reconfigurations.

Patch version changes (0.0.x) means a feature and/or bug fix.

# 0.2.2

**Date**: 02.02.2018<br>
**Changes**:
**Fixes**: #3<br>

Adds the option of listing all repositories for a specific user or organization. This can be done by specifying the optional name after `gogs repo list`, such as `gogs repo list reewr`.

Fixes an issue with column formatting when listing repositories that could cause newlines to contain whitespace on the left side of the text, which was not ideal.

Removes filtering by pull requests in `gogs issue list` as this did not work at all. Listing issues did not list any pull requests. Since the pull request API has not yet been implemented, this is, for the moment, impossible to do.

# 0.2.1

**Date**: 31.01.2018<br>
**Changes**:

Adds two options to `gogs issue list`. `-p` and `-n` (`--pull-requests` and `--no-pull-requests` respectively). These can be used to only list or not list pull requests together with the issues.

Some fixes to issues that could cause the config to be overwritten with default values.
Adds better formatting when listing repositories. Adds `-l` (`--list`) command to `repo list` to allowing printing the repositories as a list of instead of in columns.

# 0.2

**Date**: 31.01.2018<br>
**Fixes**: #1, #2<br>
**Changes**:

This version causes a breaking change. It changes one of the important configuration field names from `host` to `hostname`. As the package is still unstable and under v1, it does not yet follow semantic versioning. Once stable, any breaking changes will incur a major version change.

This version cleans up the configuration code and how hostnames are handled. It should now be possible to use HTTPS Gogs as well (this was a dumb oversight by me when performing testing).

In addition, `ignore_invalid_ssl_cert` has been added as a configuration option to allow you to connect to HTTPS servers that does not have a valid certificate. Please be aware that this means that any certificate is then accepted as valid during the requests preformed by this CLI. It does NOT make any requests to any other sources than the one you defined in the `hostname` field in the config.

# 0.1

**Date**: 29.01.2018<br>
**Changes**:

This was the first version of the CLI, including commands such as:

- gogs config {get, set, describe}
- gogs issue {add, list, read, reply}
- gogs repo {add, list}
- gogs user {find}
- gogs util {gen-autocompletion}



