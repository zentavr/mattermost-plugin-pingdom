#FROM mattermost/mattermost-team-edition:10.4.1
FROM mattermost/mattermost-team-edition:10.4.2

ARG APP_ROOT=/app
ARG APP_USER=mattermost
ARG APP_UID=1001
ARG APP_GID=1001
# *** Key: Hard-code the agent folder in Docker environment ***
#ENV VSCODE_AGENT_FOLDER=/.vscode/.vscode-server

USER root

RUN echo "Creating .vscode folder" && \
    mkdir -p /.vscode && \
    mkdir -p /.vscode-server && \
    chown -R ${APP_UID}:${APP_GID} /.vscode && \
    chown -R ${APP_UID}:${APP_GID} /.vscode-server && \
    echo "Done"

# Switch back to non-priv user (in the base container we have: uid=1001 gid=0(root) groups=0(root))
#USER ${APP_UID}:0
USER ${APP_UID}:${APP_GID}

