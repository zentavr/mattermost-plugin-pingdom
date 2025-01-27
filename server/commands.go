package main

import (
	"fmt"
	"strings"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/plugin"

	"github.com/zentavr/mattermost-plugin-pingdom/server/command"
)

const (
	actionHelp  = "help"
	actionAbout = "about"

	helpMsg = `run:
	/pingdom status - display status information (not implemented yet =])
	/pingdom help - display Slash Command help text"
	/pingdom about - display build information
	`
)

func (p *Plugin) getCommand() (*model.Command, error) {
	iconData, err := command.GetIconData(p.API, "assets/pingdom-seeklogo.svg")
	if err != nil {
		return nil, fmt.Errorf("failed to get icon data %w", err)
	}

	return &model.Command{
		Trigger:              "pingdom",
		AutoComplete:         true,
		AutoCompleteDesc:     fmt.Sprintf("Available commands: status, %s, %s", actionHelp, actionAbout),
		AutoCompleteHint:     "[command]",
		AutocompleteData:     getAutocompleteData(),
		AutocompleteIconData: iconData,
	}, nil
}

func getAutocompleteData() *model.AutocompleteData {
	root := model.NewAutocompleteData("pingdom", "[command]", fmt.Sprintf("Available commands: status, %s, %s", actionHelp, actionAbout))

	status := model.NewAutocompleteData("status", "", "List the status information")
	root.AddCommand(status)

	help := model.NewAutocompleteData(actionHelp, "", "Display Slash Command help text")
	root.AddCommand(help)

	info := command.BuildInfoAutocomplete(actionAbout)
	root.AddCommand(info)

	return root
}

func (p *Plugin) postCommandResponse(args *model.CommandArgs, text string) {
	post := &model.Post{
		UserId:    p.BotUserID,
		ChannelId: args.ChannelId,
		RootId:    args.RootId,
		Message:   text,
	}
	_ = p.API.SendEphemeralPost(args.UserId, post)
}

func (p *Plugin) ExecuteCommand(_ *plugin.Context, args *model.CommandArgs) (*model.CommandResponse, *model.AppError) {
	msg := p.executeCommand(args)
	if msg != "" {
		p.postCommandResponse(args, msg)
	}

	return &model.CommandResponse{}, nil
}

func (p *Plugin) executeCommand(args *model.CommandArgs) string {
	split := strings.Fields(args.Command)
	cmd := split[0]
	action := ""
	if len(split) > 1 {
		action = strings.TrimSpace(split[1])
	}

	if cmd != "/pingdom" {
		return ""
	}

	if action == "" {
		return "Missing command, please run `/pingdom help` to check all commands available."
	}

	var msg string
	var err error
	switch action {
	case "status":
		msg, err = p.handleStatus(args)
	case actionAbout:
		msg, err = command.BuildInfo(Manifest)
	case actionHelp:
		msg = helpMsg
	default:
		msg = helpMsg
	}

	if err != nil {
		return err.Error()
	}

	return msg
}

func (p *Plugin) handleStatus(args *model.CommandArgs) (string, error) {
	return "Not Implemented yet", nil
}
