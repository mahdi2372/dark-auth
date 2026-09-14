package darkauth

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"runtime"
	"strings"
	"time"
)

type DarkAuth struct {
	AppID        string
	Secret       string
	Version      string
	ApiURL       string
	SessionToken string
	HWID         string
	httpClient   *http.Client
}

type Response struct {
	Success      bool        `json:"success"`
	Message      string      `json:"message"`
	Code         string      `json:"code"`
	SessionToken string      `json:"session_token,omitempty"`
	Level        int         `json:"level,omitempty"`
	Value        string      `json:"value,omitempty"`
	Update       interface{} `json:"update,omitempty"`
}

func New(appID, secret, version, apiURL string) *DarkAuth {
	if version == "" {
		version = "1.0.0"
	}
	if apiURL == "" {
		apiURL = "YOUR_API_URL"
	}

	hostname, _ := os.Hostname()
	raw := fmt.Sprintf("%s:%s:%d", hostname, runtime.GOOS, runtime.NumCPU())
	h := sha256.Sum256([]byte(raw))
	hwid := hex.EncodeToString(h[:])

	return &DarkAuth{
		AppID:      appID,
		Secret:     secret,
		Version:    version,
		ApiURL:     strings.TrimRight(apiURL, "/"),
		HWID:       hwid,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (da *DarkAuth) post(endpoint string, payload interface{}) (*Response, error) {
	b, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("%s/%s", da.ApiURL, strings.TrimLeft(endpoint, "/"))
	resp, err := da.httpClient.Post(url, "application/json", bytes.NewBuffer(b))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var res Response
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	if !res.Success {
		return nil, fmt.Errorf("[%s] %s", res.Code, res.Message)
	}

	return &res, nil
}

func (da *DarkAuth) Init(binaryHash string) (*Response, error) {
	data := map[string]interface{}{
		"app_id":  da.AppID,
		"secret":  da.Secret,
		"version": da.Version,
	}
	if binaryHash != "" {
		data["hash"] = binaryHash
	}

	res, err := da.post("/init", data)
	if err != nil {
		return nil, err
	}

	da.SessionToken = res.SessionToken
	return res, nil
}

func (da *DarkAuth) License(key string) (*Response, error) {
	if da.SessionToken == "" {
		if _, err := da.Init(""); err != nil {
			return nil, err
		}
	}

	data := map[string]string{
		"session_token": da.SessionToken,
		"key":           key,
		"hwid":          da.HWID,
	}
	return da.post("/license", data)
}

func (da *DarkAuth) Login(username, password string) (*Response, error) {
	if da.SessionToken == "" {
		if _, err := da.Init(""); err != nil {
			return nil, err
		}
	}

	data := map[string]string{
		"session_token": da.SessionToken,
		"username":      username,
		"password":      password,
		"hwid":          da.HWID,
	}
	return da.post("/login", data)
}

func (da *DarkAuth) GetVar(name string) (string, error) {
	if da.SessionToken == "" {
		return "", errors.New("not initialized")
	}

	data := map[string]string{
		"session_token": da.SessionToken,
		"name":          name,
	}
	res, err := da.post("/var/get", data)
	if err != nil {
		return "", err
	}
	return res.Value, nil
}
