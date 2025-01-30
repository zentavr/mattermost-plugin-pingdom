package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/zentavr/mattermost-plugin-pingdom/server/pingdom"
)

func (p *Plugin) handleWebhook(w http.ResponseWriter, r *http.Request, pingdomHookConfig pingdomHookConfig) {
	p.API.LogInfo("Received pingdom notification")

	var message pingdom.PingdomCheckMessage
	err := json.NewDecoder(r.Body).Decode(&message)
	if err != nil {
		p.API.LogError("failed to decode webhook message", "err", err.Error())
		http.Error(w, "Failed to decode message", http.StatusBadRequest)
		return
	}

	if message.CheckID == 0 || message.CheckName == "" {
		p.API.LogError("invalid webhook message", "err", "missing check id or name")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var fields []*model.SlackAttachmentField
	fields = append(fields, ConvertPingdomToFields(pingdomHookConfig, message)...)

	attachment := &model.SlackAttachment{
		Text:   "Pingdom alert had been received.",
		Title:  fmt.Sprintf("%s: %s", message.CheckType, message.CheckName),
		Fields: fields,
		Color:  setColor(message.CurrentState),
	}

	post := &model.Post{
		ChannelId: p.PingdomHooksConfigIDChannelID[pingdomHookConfig.ID],
		UserId:    p.BotUserID,
	}

	model.ParseSlackAttachment(post, []*model.SlackAttachment{attachment})
	if _, appErr := p.API.CreatePost(post); appErr != nil {
		return
	}
	p.API.LogDebug("Pingdom notification processing is done.")
}

func addFields(fields []*model.SlackAttachmentField, title, msg string, short bool) []*model.SlackAttachmentField {
	return append(fields, &model.SlackAttachmentField{
		Title: title,
		Value: msg,
		Short: model.SlackCompatibleBool(short),
	})
}

func setColor(impact string) string {
	mapImpactColor := map[string]string{
		"DOWN":    colorFiring,
		"FAILING": colorFiring,
		"UP":      colorResolved,
		"SUCCESS": colorResolved,
	}

	if val, ok := mapImpactColor[impact]; ok {
		return val
	}

	return colorExpired
}

func ConvertPingdomToFields(config pingdomHookConfig, alert pingdom.PingdomCheckMessage) []*model.SlackAttachmentField {
	var fields []*model.SlackAttachmentField

	statusMsg := strings.ToUpper(alert.CurrentState)
	if alert.CurrentState == "DOWN" || alert.CurrentState == "FAILING" {
		statusMsg = fmt.Sprintf(":fire: :boom: %s :boom: :fire:", strings.ToUpper(alert.CurrentState))
	} else if alert.CurrentState == "UP" || alert.CurrentState == "SUCCESS" {
		statusMsg = fmt.Sprintf(":white_check_mark: :four_leaf_clover: %s :four_leaf_clover: :white_check_mark:", strings.ToUpper(alert.CurrentState))
	} else {
		statusMsg = fmt.Sprintf(":thinking_face: %s :thinking_face:", strings.ToUpper(alert.CurrentState))
	}

	/* The variable which handles messages :) */
	var msg string

	/* first field: Description, LongDescription and time */
	msg = fmt.Sprintf("**Description**: %s\n", alert.Description)
	msg = fmt.Sprintf("%s**Long Description**: %s\n", msg, alert.LongDescription)
	if alert.ImportanceLevel == "HIGH" {
		msg = fmt.Sprintf("%s**Importance**: :arrow_upper_right: %s :arrow_upper_right:\n", msg, alert.ImportanceLevel)
	} else {
		msg = fmt.Sprintf("%s**Importance**: :arrow_lower_right: %s :arrow_lower_right:\n", msg, alert.ImportanceLevel)
	}
	msg = fmt.Sprintf("%s**Check Type**: %s\n", msg, alert.CheckType)
	msg = fmt.Sprintf("%s \n", msg)
	msg = fmt.Sprintf("%s**State changed time:** %s\n", msg, alert.StateChangedTimestamp.Format(time.RFC1123))
	msg = fmt.Sprintf("%s**Previous state:** %s\n", msg, alert.PreviousState)
	fields = addFields(fields, statusMsg, msg, true)

	/* second field: Check Parameters */
	msg = ""
	if alert.CheckType != "TRANSACTION" {
		msg = fmt.Sprintf("**Hostname**: %s\n", alert.CheckParams["hostname"])
	}

	switch alert.CheckType {
	case "HTTP", "HTTP_CUSTOM":
		msg = fmt.Sprintf("%s**Port**: %s\n", msg, alert.CheckParams["port"])
		msg = fmt.Sprintf("%s**URL**: `%s`\n", msg, alert.CheckParams["url"])
		msg = fmt.Sprintf("%s**IPv6**: %v\n", msg, alert.CheckParams["ipv6"])
		msg = fmt.Sprintf("%s**Encryption**: %v\n", msg, alert.CheckParams["encryption"])
	case "DNS":
		msg = fmt.Sprintf("%s**Expected IP**: `%s`\n", msg, alert.CheckParams["expected_ip"])
		msg = fmt.Sprintf("%s**Nameserver**: `%s`\n", msg, alert.CheckParams["nameserver"])
		msg = fmt.Sprintf("%s**IPv6**: %v\n", msg, alert.CheckParams["ipv6"])
	case "PORT_TCP", "UDP":
		msg = fmt.Sprintf("%s**Port**: %v\n", msg, alert.CheckParams["port"])
		msg = fmt.Sprintf("%s**IPv6**: %v\n", msg, alert.CheckParams["ipv6"])
	case "IMAP", "POP3", "SMTP":
		msg = fmt.Sprintf("%s**Port**: %v\n", msg, alert.CheckParams["port"])
		msg = fmt.Sprintf("%s**IPv6**: %v\n", msg, alert.CheckParams["ipv6"])
		msg = fmt.Sprintf("%s**Encryption**: %v\n", msg, alert.CheckParams["encryption"])
	case "PING":
		msg = fmt.Sprintf("%s**IPv6**: %v\n", msg, alert.CheckParams["ipv6"])
	case "TRANSACTION":
		msg = fmt.Sprintf("%s**Port**: %v\n", msg, alert.CheckParams["port"])
		msg = fmt.Sprintf("%s**URL**: `%s`\n", msg, alert.CheckParams["url"])
		msg = fmt.Sprintf("%s**Encryption**: %v\n", msg, alert.CheckParams["encryption"])
	default:
		msg = fmt.Sprintf("%s:warning: *Unknown check type, no additional fields had been collected.* :warning: \n", msg)
	}
	fields = addFields(fields, "Details", msg, true)

	// List tags
	msg = ""
	if len(alert.Tags) > 0 {
		wrapped := make([]string, len(alert.Tags))
		for i, tag := range alert.Tags {
			wrapped[i] = fmt.Sprintf("`%s`", tag)
		}
		msg = fmt.Sprintf("%s%s\n", msg, strings.Join(wrapped, ", "))
		fields = addFields(fields, "Tags", msg, false)
	}

	fields = addFields(fields, "Probe Details", "", false)
	// List probes
	for _, probe := range []pingdom.CommonProbe{alert.FirstProbe, alert.SecondProbe} {
		msg = fmt.Sprintf(":earth_americas: %s\n", probe.GetLocation())
		msg = fmt.Sprintf("%s:house: %s\n", msg, probe.GetIP())
		msg = fmt.Sprintf("%s:european_castle: %s\n", msg, probe.GetIPV6())

		probeType := "Unknown"
		switch probe.(type) {
		case pingdom.FirstProbe:
			probeType = "First Probe"
		case pingdom.SecondProbe:
			probeType = "Second Probe"
		default:
			probeType = "First Probe"
		}
		fields = addFields(fields, probeType, msg, true)
	}

	// Push it out =]
	return fields
}
