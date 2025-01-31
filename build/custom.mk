# Include custom targets and environment variables here
DEVCONTAINER_DIR ?= .devcontainer
GPG_SIGNATURE_KEY_ID ?= 3AF2387D
GPG_PASSPHRASE ?= password

.PHONY: compose-start
compose-start:
	cd $(DEVCONTAINER_DIR) && docker compose up --build --detach --wait

.PHONY: compose-stop
compose-stop:
	cd $(DEVCONTAINER_DIR) && docker compose stop

.PHONY: compose-down
compose-down:
	cd $(DEVCONTAINER_DIR) && docker compose down

.PHONY: compose-ps
compose-ps:
	cd $(DEVCONTAINER_DIR) && docker compose ps

.PHONY: compose-stop-mattermost compose-start-mattermost compose-restart-mattermost
compose-stop-mattermost:
	cd $(DEVCONTAINER_DIR) && docker compose stop mattermost

compose-start-mattermost:
	cd $(DEVCONTAINER_DIR) && docker compose start mattermost

compose-restart-mattermost: compose-stop-mattermost compose-start-mattermost compose-ps

## Removes all build artifacts of the server.
.PHONY: clean-server
clean-server:
	@echo Removing everything in dist/
	rm -fr dist/
ifneq ($(HAS_SERVER),)
	@echo Removing everything for server
	rm -fr server/coverage.txt
	rm -fr server/dist
else
	@echo There is no server part in the source code
endif

## Removes all build artifacts of the web application.
.PHONY: clean-webapp clean-webapp-code
clean-webapp: clean-webapp-code
ifneq ($(HAS_WEBAPP),)
	rm -fr webapp/node_modules
endif

## Removes all build artifacts except node_modules of the web application.
clean-webapp-code:
	@echo Removing everything in dist/
	rm -fr dist/
ifneq ($(HAS_WEBAPP),)
	@echo Removing everything for web application
	rm -fr webapp/junit.xml
	rm -fr webapp/dist
else
	@echo There is no web application in the source code
endif

## Signs the plugin
.PHONY: sign
sign:
	cd dist && gpg -u $(GPG_SIGNATURE_KEY_ID) --verbose --personal-digest-preferences SHA256 --detach-sign $(BUNDLE_NAME)

	@echo plugin dist at: dist/$(BUNDLE_NAME)
	@echo plugin sign at: dist/$(BUNDLE_NAME).sig

.PHONY: gorelease
gorelease:
	GPG_SIGNATURE_KEY_ID=$(GPG_SIGNATURE_KEY_ID) GPG_PASSPHRASE=$(GPG_PASSPHRASE) goreleaser release --skip publish --skip validate --clean
