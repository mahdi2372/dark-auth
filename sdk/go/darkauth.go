// Package darkauth provides the official DARK-AUTH Go SDK v2.0.0.
package darkauth

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"
)

const Version = "2.0.0"

// DarkAuth is the main client for the DARK-AUTH API.
type DarkAuth struct {
	AppID        string
	Secret       string
	Version      string
	ApiURL       string
	SessionToken string
	HWID         string
	HTTPClient   *http.Client
	User         map[string]interface{}
	LicenseInfo  map[string]interface{}
}

// Response represents a DARK-AUTH API response.
type Response struct {
	Success      bool                   `json:"success"`
	Message      string                 `json:"message"`
	Code         string                 `json:"code"`
	SessionToken string                 `json:"session_token,omitempty"`
	Level        int                    `json:"level,omitempty"`
	Status       string                 `json:"status,omitempty"`
	Value        string                 `json:"value,omitempty"`
	ExpiresAt    string                 `json:"expires_at,omitempty"`
	Update       map[string]interface{} `json:"update,omitempty"`
	Messages     []ChatMessage          `json:"messages,omitempty"`
	Extra        map[string]interface{} `json:"-"`
}

// ChatMessage represents a single chat message.
type ChatMessage struct {
	Sender    string `json:"sender"`
	Message   string `json:"message"`
	Channel   string `json:"channel,omitempty"`
	Timestamp string `json:"timestamp,omitempty"`
}

func (r *Response) UnmarshalJSON(data []byte) error {
	type Alias Response
	aux := &struct{ *Alias }{(*Alias)(r)}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	r.Extra = make(map[string]interface{})
	json.Unmarshal(data, &r.Extra)
	delete(r.Extra, "success")
	delete(r.Extra, "message")
	delete(r.Extra, "code")
	delete(r.Extra, "session_token")
	delete(r.Extra, "level")
	delete(r.Extra, "status")
	delete(r.Extra, "value")
	delete(r.Extra, "expires_at")
	delete(r.Extra, "update")
	delete(r.Extra, "messages")
	return nil
}

// New creates a new DARK-AUTH client.
func New(appID, secret, apiURL, version string) *DarkAuth {
	if version == "" {
		version = Version
	}

	hostname, _ := os.Hostname()
	raw := fmt.Sprintf("%s:%s:%s:%s:%d", hostname, os.Getenv("USER"), runtime.GOOS, runtime.GOARCH, os.Getpid())
	h := sha256.Sum256([]byte(raw))
	hwid := hex.EncodeToString(h[:])

	return &DarkAuth{
		AppID:    appID,
		Secret:   secret,
		Version:  version,
		ApiURL:   strings.TrimRight(apiURL, "/"),
		HWID:     hwid,
		HTTPClient: &http.Client{Timeout: 15 * time.Second},
	}
}

func (da *DarkAuth) url(endpoint string) string {
	return fmt.Sprintf("%s/api/v2/%s", da.ApiURL, strings.TrimLeft(endpoint, "/"))
}

func (da *DarkAuth) post(endpoint string, payload interface{}) (*Response, error) {
	b, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	resp, err := da.HTTPClient.Post(da.url(endpoint), "application/json", bytes.NewBuffer(b))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var res Response
	if err := json.Unmarshal(body, &res); err != nil {
		return nil, err
	}

	if !res.Success {
		return nil, fmt.Errorf("[%s] %s", res.Code, res.Message)
	}

	return &res, nil
}

func (da *DarkAuth) get(endpoint string, params map[string]string) (*Response, error) {
	req, err := http.NewRequest("GET", da.url(endpoint), nil)
	if err != nil {
		return nil, err
	}

	q := req.URL.Query()
	for k, v := range params {
		q.Set(k, v)
	}
	req.URL.RawQuery = q.Encode()

	resp, err := da.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var res Response
	if err := json.Unmarshal(body, &res); err != nil {
		return nil, err
	}

	return &res, nil
}

func (da *DarkAuth) ensureSession() error {
	if da.SessionToken == "" {
		_, err := da.Init("")
		return err
	}
	return nil
}

// Init initializes a session with the DARK-AUTH API.
func (da *DarkAuth) Init(binaryHash string) (*Response, error) {
	payload := map[string]interface{}{
		"app_id":  da.AppID,
		"secret":  da.Secret,
		"version": da.Version,
	}
	if binaryHash != "" {
		payload["hash"] = binaryHash
	}

	res, err := da.post("/init", payload)
	if err != nil {
		return nil, err
	}

	da.SessionToken = res.SessionToken
	return res, nil
}

// License authenticates with a license key.
func (da *DarkAuth) License(key string) (*Response, error) {
	if err := da.ensureSession(); err != nil {
		return nil, err
	}
	return da.post("/license", map[string]string{
		"session_token": da.SessionToken,
		"key":           strings.TrimSpace(key),
		"hwid":          da.HWID,
	})
}

// Login authenticates with username and password.
func (da *DarkAuth) Login(username, password string) (*Response, error) {
	if err := da.ensureSession(); err != nil {
		return nil, err
	}
	res, err := da.post("/login", map[string]string{
		"session_token": da.SessionToken,
		"username":      username,
		"password":      password,
		"hwid":          da.HWID,
	})
	if err != nil {
		return nil, err
	}
	return res, nil
}

// Register creates a new account with a license key.
func (da *DarkAuth) Register(username, password, key string) (*Response, error) {
	if err := da.ensureSession(); err != nil {
		return nil, err
	}
	res, err := da.post("/register", map[string]string{
		"session_token": da.SessionToken,
		"username":      username,
		"password":      password,
		"key":           strings.TrimSpace(key),
		"hwid":          da.HWID,
	})
	if err != nil {
		return nil, err
	}
	return res, nil
}

// Check verifies the current session is still valid.
func (da *DarkAuth) Check() bool {
	if da.SessionToken == "" {
		return false
	}
	res, err := da.post("/check", map[string]string{"session_token": da.SessionToken})
	if err != nil {
		return false
	}
	return res.Success
}

// GetVar retrieves a cloud variable value.
func (da *DarkAuth) GetVar(name string) (string, error) {
	if da.SessionToken == "" {
		return "", fmt.Errorf("not initialized")
	}
	res, err := da.post("/var/get", map[string]string{
		"session_token": da.SessionToken,
		"name":          name,
	})
	if err != nil {
		return "", err
	}
	return res.Value, nil
}

// SetVar sets a cloud variable value.
func (da *DarkAuth) SetVar(name, value string) (*Response, error) {
	if da.SessionToken == "" {
		return nil, fmt.Errorf("not initialized")
	}
	return da.post("/var/set", map[string]string{
		"session_token": da.SessionToken,
		"name":          name,
		"value":         value,
	})
}

// Log sends a log entry to the API.
func (da *DarkAuth) Log(message, level string) (*Response, error) {
	if da.SessionToken == "" {
		return nil, fmt.Errorf("not initialized")
	}
	if level == "" {
		level = "INFO"
	}
	return da.post("/log", map[string]string{
		"session_token": da.SessionToken,
		"message":       message,
		"level":         level,
	})
}

// ResetHWID requests a HWID reset for a key.
func (da *DarkAuth) ResetHWID(key string) (*Response, error) {
	if da.SessionToken == "" {
		return nil, fmt.Errorf("not initialized")
	}
	return da.post("/hwid/reset", map[string]string{
		"session_token": da.SessionToken,
		"key":           key,
	})
}

// GetChat retrieves chat messages from a channel.
func (da *DarkAuth) GetChat(channel string) ([]ChatMessage, error) {
	if da.SessionToken == "" {
		return nil, fmt.Errorf("not initialized")
	}
	if channel == "" {
		channel = "general"
	}
	res, err := da.get("/chat", map[string]string{
		"session_token": da.SessionToken,
		"channel":       channel,
	})
	if err != nil {
		return nil, err
	}
	return res.Messages, nil
}

// SendChat sends a chat message to a channel.
func (da *DarkAuth) SendChat(sender, message, channel string) (*Response, error) {
	if da.SessionToken == "" {
		return nil, fmt.Errorf("not initialized")
	}
	if channel == "" {
		channel = "general"
	}
	return da.post("/chat", map[string]string{
		"session_token": da.SessionToken,
		"channel":       channel,
		"sender":        sender,
		"message":       message,
	})
}
