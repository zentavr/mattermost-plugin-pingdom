package pingdom

import (
	"encoding/json"
	//"fmt"
	"time"
)

// UnixTime holds a time.Time, but unmarshals from a Unix timestamp (in seconds).
type UnixTime struct {
	time.Time
}

// TimeString holds a time.Time, but unmarshals from a string like "2016-01-01T01:01:01"
type TimeString struct {
	time.Time
}

// UnmarshalJSON Adjusting the layout to match your incoming datetime format.
func (t *TimeString) UnmarshalJSON(b []byte) error {
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	parsed, err := time.Parse("2006-01-02T15:04:05", s)
	if err != nil {
		return err
	}
	t.Time = parsed.UTC()
	return nil
}

func (u *UnixTime) UnmarshalJSON(b []byte) error {
	var unixSec int64
	if err := json.Unmarshal(b, &unixSec); err != nil {
		return err
	}

	// Convert Unix seconds to Go's time.Time
	u.Time = time.Unix(unixSec, 0).UTC()
	return nil
}

// KV is a set of key/value string pairs.
type KV map[string]interface{}

type FirstProbe struct {
	IP       string `json:"ip"`
	IPV6     string `json:"ipv6"`
	Location string `json:"location"`
}

type SecondProbe struct {
	*FirstProbe
	Version uint64 `json:"version"`
}

type CommonProbe interface {
	GetIP() string
	GetIPV6() string
	GetLocation() string
}

func (fp FirstProbe) GetIP() string {
	return fp.IP
}
func (fp FirstProbe) GetIPV6() string {
	return fp.IPV6
}
func (fp FirstProbe) GetLocation() string {
	return fp.Location
}

func (sp SecondProbe) GetIP() string {
	return sp.FirstProbe.IP
}
func (sp SecondProbe) GetIPV6() string {
	return sp.FirstProbe.IPV6
}
func (sp SecondProbe) GetLocation() string {
	return sp.FirstProbe.Location
}

// Ref.: https://www.pingdom.com/resources/webhooks/
type PingdomCheckMessage struct {
	CheckID               uint64      `json:"check_id"`
	CheckName             string      `json:"check_name"`
	CheckType             string      `json:"check_type"`
	CheckParams           KV          `json:"check_params"`
	Tags                  []string    `json:"tags"`
	PreviousState         string      `json:"previous_state"`
	CurrentState          string      `json:"current_state"`
	ImportanceLevel       string      `json:"importance_level"`
	StateChangedTimestamp UnixTime    `json:"state_changed_timestamp"`
	StateChangedUTCTime   TimeString  `json:"state_changed_utc_time"`
	LongDescription       string      `json:"long_description"`
	Description           string      `json:"short_description"`
	FirstProbe            FirstProbe  `json:"first_probe"`
	SecondProbe           SecondProbe `json:"second_probe"`
}
