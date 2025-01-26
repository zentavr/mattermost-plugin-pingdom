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
