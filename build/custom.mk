# Include custom targets and environment variables here
DEVCONTAINER_DIR ?= .devcontainer

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

## Clean removes all build artifacts of the server.
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

## Clean removes all build artifacts of the server.
.PHONY: clean-webapp
clean-webapp:
	@echo Removing everything in dist/
	rm -fr dist/
ifneq ($(HAS_WEBAPP),)
	@echo Removing everything for web application
	rm -fr webapp/junit.xml
	rm -fr webapp/dist
	rm -fr webapp/node_modules
else
	@echo There is no web application in the source code
endif
