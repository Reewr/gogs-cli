# Changelog

This file will contain the most important changes in the different versions of the package.

# 0.2.1

**Date**: 31.01.2018<br>
**Changes**:

Adds two options to `gogs issue list`. `-p` and `-n` (`--pull-requests` and `--no-pull-requests` respectively). These can be used to only list or not list pull requests together with the issues.

Some fixes to issues that could cause the config to be overwritten with default values

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



