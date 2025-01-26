package main

import (
	"crypto/subtle"
	"fmt"
	"net/http"
	"path/filepath"
	"sync"

	pluginapi "github.com/mattermost/mattermost/server/public/pluginapi"
	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"

	root "github.com/zentavr/mattermost-plugin-pingdom"
)

var (
	Manifest model.Manifest = root.Manifest
)

type Plugin struct {
	plugin.MattermostPlugin
	client *pluginapi.Client

	// configuration is the active plugin configuration. Consult getConfiguration and
	// setConfiguration for usage.
	configuration *configuration

	// key - pingdomHookConfig id, value - existing or created channel id received from api
	PingdomHooksConfigIDChannelID map[string]string
	BotUserID              string

	// configurationLock synchronizes access to the configuration.
	configurationLock sync.RWMutex
}

func (p *Plugin) OnDeactivate() error {
	return nil
}

func (p *Plugin) OnActivate() error {
	p.client = pluginapi.NewClient(p.API, p.Driver)
	botID, err := p.client.Bot.EnsureBot(&model.Bot{
		Username:    "pingdombot",
		DisplayName: "Pingdom Bot",
		Description: "Created by Pingdom Notifications Plugin.",
	}, pluginapi.ProfileImagePath(filepath.Join("assets", "pingdom-seeklogo.png")))
	if err != nil {
		return fmt.Errorf("failed to ensure bot account: %w", err)
	}
	p.BotUserID = botID

	configuration := p.getConfiguration()
	p.PingdomHooksConfigIDChannelID = make(map[string]string)
	for k, pingdomHookConfig := range configuration.PingdomHooksConfigs {
		var channelID string
		channelID, err = p.ensureAlertChannelExists(pingdomHookConfig)
		if err != nil {
			p.API.LogWarn(fmt.Sprintf("Failed to ensure alert channel %v", k), "error", err.Error())
		} else {
			p.PingdomHooksConfigIDChannelID[pingdomHookConfig.ID] = channelID
		}
	}

// 	command, err := p.getCommand()
// 	if err != nil {
// 		return fmt.Errorf("failed to get command: %w", err)
// 	}
//
// 	err = p.API.RegisterCommand(command)
// 	if err != nil {
// 		return fmt.Errorf("failed to register command: %w", err)
// 	}

	return nil
}

func (p *Plugin) ensureAlertChannelExists(pingdomHookConfig pingdomHookConfig) (string, error) {
	if err := pingdomHookConfig.IsValid(); err != nil {
		return "", fmt.Errorf("Pingdom Configuration is invalid: %w", err)
	}

	team, appErr := p.API.GetTeamByName(pingdomHookConfig.Team)
	if appErr != nil {
		return "", fmt.Errorf("failed to get team: %w", appErr)
	}

	channel, appErr := p.API.GetChannelByName(team.Id, pingdomHookConfig.Channel, false)
	if appErr != nil {
		if appErr.StatusCode == http.StatusNotFound {
			channelToCreate := &model.Channel{
				Name:        pingdomHookConfig.Channel,
				DisplayName: pingdomHookConfig.Channel,
				Type:        model.ChannelTypeOpen,
				TeamId:      team.Id,
				CreatorId:   p.BotUserID,
			}

			newChannel, errChannel := p.API.CreateChannel(channelToCreate)
			if errChannel != nil {
				return "", fmt.Errorf("failed to create alert channel: %w", errChannel)
			}

			return newChannel.Id, nil
		}
		return "", fmt.Errorf("failed to get existing alert channel: %w", appErr)
	}

	return channel.Id, nil
}

func (p *Plugin) ServeHTTP(_ *plugin.Context, w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("Pingdom Notifications Plugin"))
		return
	}

	invalidOrMissingTokenErr := "Invalid or missing token"
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, invalidOrMissingTokenErr, http.StatusBadRequest)
		return
	}

	configuration := p.getConfiguration()
	for _, pingdomHookConfig := range configuration.PingdomHooksConfigs {
		if subtle.ConstantTimeCompare([]byte(token), []byte(pingdomHookConfig.Token)) == 1 {
			switch r.URL.Path {
			case "/api/webhook":
				p.handleWebhook(w, r, pingdomHookConfig)
			//case "/api/expire":
			//	p.handleExpireAction(w, r, pingdomHookConfig)
			default:
				http.NotFound(w, r)
			}
			return
		}
	}

	http.Error(w, invalidOrMissingTokenErr, http.StatusBadRequest)
}
