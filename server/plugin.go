package main

import (
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"net/http"
	"path/filepath"
	"sync"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"
	pluginapi "github.com/mattermost/mattermost/server/public/pluginapi"

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
	BotUserID                     string

	// configurationLock synchronizes access to the configuration.
	configurationLock sync.RWMutex
}

func (p *Plugin) OnDeactivate() error {
	return nil
}

func (p *Plugin) OnActivate() error {
	p.API.LogDebug("Pingdom Notifications Plugin is activating.")
	p.client = pluginapi.NewClient(p.API, p.Driver)

	p.API.LogDebug("Pingdom Notifications Plugin: creating bot.")
	botID, err := p.client.Bot.EnsureBot(&model.Bot{
		Username:    "pingdombot",
		DisplayName: "Pingdom Bot",
		Description: "Created by Pingdom Notifications Plugin.",
	}, pluginapi.ProfileImagePath(filepath.Join("assets", "pingdom-seeklogo.png")))
	p.API.LogDebug("Pingdom Notifications Plugin: EnsureBot is done.")

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

	p.API.LogDebug("Pingdom Notifications Plugin: creating commands.")
	command, err := p.getCommand()
	if err != nil {
		return fmt.Errorf("failed to get command: %w", err)
	}

	p.API.LogDebug("Pingdom Notifications Plugin: registering commands.")
	err = p.API.RegisterCommand(command)
	if err != nil {
		return fmt.Errorf("failed to register command: %w", err)
	}

	p.API.LogDebug("Pingdom Notifications Plugin is activated.")
	return nil
}

func (p *Plugin) dump(cfg configuration) (map[string]interface{}, error) {
	// Convert struct -> JSON bytes
	b, err := json.Marshal(cfg)
	if err != nil {
		p.API.LogError(fmt.Sprintf("failed to marshal configuration: %v", err))
	}

	// Convert JSON -> map[string]interface{}
	var m map[string]interface{}
	if err := json.Unmarshal(b, &m); err != nil {
		p.API.LogError(fmt.Sprintf("failed to unmarshal configuration: %v", err))
	}
	return m, nil
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

			p.API.LogInfo(fmt.Sprintf("Creating alert pingdom channel %v", pingdomHookConfig.Channel))
			newChannel, errChannel := p.API.CreateChannel(channelToCreate)
			if errChannel != nil {
				return "", fmt.Errorf("failed to create alert pingdom channel: %w", errChannel)
			}

			return newChannel.Id, nil
		}
		return "", fmt.Errorf("failed to get existing alert channel: %w", appErr)
	}

	return channel.Id, nil
}

func (p *Plugin) ServeHTTP(_ *plugin.Context, w http.ResponseWriter, r *http.Request) {
	p.API.LogDebug(fmt.Sprintf("Pingdom Notifications Plugin: ServeHTTP is called."))
	if r.Method == http.MethodGet {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("Pingdom Notifications Plugin"))
		p.API.LogDebug(fmt.Sprintf("Pingdom Notifications Plugin: ServeHTTP got GET call. We handle POSTs."))
		return
	}

	invalidOrMissingSeedErr := "Invalid or missing seed"
	seed := r.URL.Query().Get("seed")
	if seed == "" {
		p.API.LogWarn(fmt.Sprintf("The seed variable had not been provided in the URL request"))
		http.Error(w, invalidOrMissingSeedErr, http.StatusBadRequest)
		return
	}

	if len(seed) > 8 {
		p.API.LogDebug(fmt.Sprintf("Pingdom Notifications Plugin: have seed: %s...%s", seed[:4], seed[len(seed)-4:]))
	} else {
		p.API.LogDebug(fmt.Sprintf("Pingdom Notifications Plugin: seed is too short to print"))
	}

	// URL Looks like: https://chat.example.com/plugins/com.zentavr.pingdom/api/webhook?seed=12345678901234567890axqiytMrAlY
	configuration := p.getConfiguration()

	for _, pingdomHookConfig := range configuration.PingdomHooksConfigs {
		if subtle.ConstantTimeCompare([]byte(seed), []byte(pingdomHookConfig.Seed)) == 1 && !pingdomHookConfig.Disabled {
			switch r.URL.Path {
			case "/api/webhook":
				p.handleWebhook(w, r, pingdomHookConfig)
			default:
				p.API.LogWarn(fmt.Sprintf("the endpoint not exists %s", r.URL.Path))
				http.NotFound(w, r)
			}
			return
		} else {
			p.API.LogWarn(fmt.Sprintf("The seed variable is invalid or the configuration is disabled"))
			http.Error(w, invalidOrMissingSeedErr, http.StatusBadRequest)
		}
	}

	p.API.LogDebug(fmt.Sprintf("It looks like we had not parsed our configuration or it is empty."))
	http.Error(w, invalidOrMissingSeedErr, http.StatusBadRequest)
}
