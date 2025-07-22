# Mattermost developer setup

We use [development containers](https://containers.dev/) here. (Not work :( )

Common make commands for working with plugins 

- `make apply` - Propagates plugin manifest information into the server/ and webapp/ folders.
- `make server` - Builds the server, if it exists, for all supported architectures, unless `MM_SERVICESETTINGS_ENABLEDEVELOPER` is set.
- `make webapp/node_modules` - Ensures NPM dependencies are installed without having to run this all the time.
- `make webapp` - Builds the webapp, if it exists.
- `make bundle` - Generates a tar bundle of the plugin for install.

- `make compose-start` - Starts the local mattermost server at `http://localhost:8065`
- `make compose-stop` - Stops the local mattermost server and the db
- `make compose-down` - Destroys the containers
- `make compose-ps` - Shows the containers

- `make test` - Runs the plugin’s server tests and webapp tests
- `make check-style` - Runs linting checks on the plugin’s server and webapp folders
- `make deploy` - Compiles the plugin using the make dist command, then automatically deploys the plugin to the Mattermost server. Enabling Local Mode on your server is the easiest way to use this command.
- `make watch` - Uses webpack’s watch feature to re-compile and deploy the webapp portion of your plugin on any change to the webapp/src folder.
- `make dist` - Compile the plugin into a g-zipped file, ready to upload to a Mattermost server. The file is saved in the plugin repo’s dist folder.
- `make enable` - Enables the plugin on the Mattermost server
- `make disable` - Disables the plugin on the Mattermost server.
- `make reset` - Disables and re-enables the plugin on the Mattermost server.
- `make attach-headless` - Starts a delve process and attaches it to your running plugin.
- `make clean` - Force deletes the content of build-related files. Use when running into build issues.

### Some hints

#### Signing the plugin
Plugins installed via the Marketplace must be signed by a public key certificate trusted by the local Mattermost server.
While the server ships with a default certificate used to verify plugins from the default Mattermost Marketplace, 
the server can be configured to trust different certificates and point at a different plugin marketplace. 
This document outlines the steps for generating a public key certificate and signing plugins for use with a custom 
plugin marketplace.

```shell
make sign
```

#### Rebuild the web application part and redeploy into the mattermost server
```shell
make clean-webapp
make deploy
```

#### Rebuild the server part and redeploy into the mattermost server
```shell
make clean-server
make deploy
```

#### If you edited plugin.json...
...you need to rebuild the manifests.
```shell
# remove server/manifest.go??
# remove webapp/src/manifest.ts???
make apply
# ...do other stuff
```

#### If you added a couple of new typescript and need to produce localization strings
Without populating the string IDs the plugin fails to start in the browser/mattemost-cli. The error in the MM server would
be something like this:
```
Error: [@formatjs/intl] An `id` must be provided to format a message. You can either:
1. Configure your build toolchain with [babel-plugin-formatjs](https://formatjs.io/docs/tooling/babel-plugin)
or [@formatjs/ts-transformer](https://formatjs.io/docs/tooling/ts-transformer) OR
2. Configure your `eslint`
```

So, extract these into i18n/en.json and translate to the other languages if needed:
```shell
make i18n-extract
```

#### Make Github Release
1. Adjust `.version` at [plugin.json](plugin.json)
2. Commit to master
3. Run `make patch` (or `make minor`/`make major`) which would create git tag and pushes that to git repo.
4. Git builder would assemble that package and you should see that in Releases.
