# mattermost-plugin-pingdom

## Mattermost developer setup
Useful links for ideas:
- https://developers.mattermost.com/integrate/plugins/developer-setup/
- https://developers.mattermost.com/contribute/developer-setup/
- https://developers.mattermost.com/contribute/developer-setup/

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


AlertConfigIDChannelID -> PingdomHooksConfigIDChannelID
webhook.go
