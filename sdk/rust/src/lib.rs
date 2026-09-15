//! DARK-AUTH Official Rust SDK v2.0.0
//!
//! Async client for the DARK-AUTH V2 API.
//! Supports: Init, License Auth, User Login/Register, Cloud Variables, Chat, Logging, HWID lock.

use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::error::Error;

const VERSION: &str = "2.0.0";

#[derive(Clone, Debug)]
pub struct DarkAuth {
    pub app_id: String,
    pub secret: String,
    pub version: String,
    pub api_url: String,
    pub session_token: Option<String>,
    pub hwid: String,
    client: Client,
}

#[derive(Serialize)]
struct InitPayload<'a> {
    app_id: &'a str,
    secret: &'a str,
    version: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    hash: Option<&'a str>,
}

#[derive(Serialize)]
struct SessionPayload<'a> {
    session_token: &'a str,
}

#[derive(Serialize)]
struct LicensePayload<'a> {
    session_token: &'a str,
    key: &'a str,
    hwid: &'a str,
}

#[derive(Serialize)]
struct UserPayload<'a> {
    session_token: &'a str,
    username: &'a str,
    password: &'a str,
    hwid: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    key: Option<&'a str>,
}

#[derive(Serialize)]
struct VarPayload<'a> {
    session_token: &'a str,
    name: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    value: Option<&'a str>,
}

#[derive(Serialize)]
struct LogPayload<'a> {
    session_token: &'a str,
    message: &'a str,
    level: &'a str,
}

#[derive(Serialize)]
struct ChatPayload<'a> {
    session_token: &'a str,
    channel: &'a str,
    sender: &'a str,
    message: &'a str,
}

#[derive(Deserialize, Debug)]
pub struct AuthResponse {
    pub success: bool,
    pub message: Option<String>,
    pub session_token: Option<String>,
    pub code: Option<String>,
    pub level: Option<i32>,
    pub status: Option<String>,
    pub value: Option<String>,
    pub expires_at: Option<String>,
    #[serde(flatten)]
    pub extra: Option<HashMap<String, Value>>,
}

impl DarkAuth {
    /// Create a new DARK-AUTH client.
    pub fn new(app_id: &str, secret: &str, api_url: &str, version: &str) -> Self {
        let raw = format!(
            "{}:{}:{}:{}",
            hostname::get().map(|h| h.to_string_lossy().to_string()).unwrap_or_default(),
            std::env::var("USER").or_else(|_| std::env::var("USERNAME")).unwrap_or_default(),
            std::env::consts::OS,
            std::env::consts::ARCH
        );
        let hwid = {
            let mut hasher = Sha256::new();
            hasher.update(raw.as_bytes());
            format!("{:x}", hasher.finalize())
        };

        Self {
            app_id: app_id.to_string(),
            secret: secret.to_string(),
            version: version.to_string(),
            api_url: api_url.trim_end_matches('/').to_string(),
            session_token: None,
            hwid,
            client: Client::new(),
        }
    }

    fn url(&self, endpoint: &str) -> String {
        let ep = endpoint.trim_start_matches('/');
        format!("{}/api/v2/{}", self.api_url, ep)
    }

    async fn post(&self, endpoint: &str, payload: &impl Serialize) -> Result<AuthResponse, Box<dyn Error>> {
        let resp = self.client
            .post(&self.url(endpoint))
            .json(payload)
            .send()
            .await?;
        let res: AuthResponse = resp.json().await?;
        if !res.success {
            return Err(format!(
                "[{}] {}",
                res.code.unwrap_or_default(),
                res.message.unwrap_or_default()
            ).into());
        }
        Ok(res)
    }

    async fn get(&self, endpoint: &str, params: &[(&str, &str)]) -> Result<AuthResponse, Box<dyn Error>> {
        let resp = self.client
            .get(&self.url(endpoint))
            .query(params)
            .send()
            .await?;
        let res: AuthResponse = resp.json().await?;
        Ok(res)
    }

    /// Initialize a session with the DARK-AUTH API.
    pub async fn init(&mut self, hash: Option<&str>) -> Result<AuthResponse, Box<dyn Error>> {
        let res = self.post("/init", &InitPayload {
            app_id: &self.app_id,
            secret: &self.secret,
            version: &self.version,
            hash,
        }).await?;
        self.session_token = res.session_token.clone();
        Ok(res)
    }

    /// Ensure a session token exists, calling init if necessary.
    async fn ensure_session(&mut self) -> Result<(), Box<dyn Error>> {
        if self.session_token.is_none() {
            self.init(None).await?;
        }
        Ok(())
    }

    /// Authenticate with a license key.
    pub async fn license(&mut self, key: &str) -> Result<AuthResponse, Box<dyn Error>> {
        self.ensure_session().await?;
        self.post("/license", &LicensePayload {
            session_token: self.session_token.as_ref().unwrap(),
            key: key.trim(),
            hwid: &self.hwid,
        }).await
    }

    /// Log in with username and password.
    pub async fn login(&mut self, username: &str, password: &str) -> Result<AuthResponse, Box<dyn Error>> {
        self.ensure_session().await?;
        self.post("/login", &UserPayload {
            session_token: self.session_token.as_ref().unwrap(),
            username,
            password,
            hwid: &self.hwid,
            key: None,
        }).await
    }

    /// Register a new account with a license key.
    pub async fn register(&mut self, username: &str, password: &str, key: &str) -> Result<AuthResponse, Box<dyn Error>> {
        self.ensure_session().await?;
        self.post("/register", &UserPayload {
            session_token: self.session_token.as_ref().unwrap(),
            username,
            password,
            hwid: &self.hwid,
            key: Some(key.trim()),
        }).await
    }

    /// Check if the current session is still valid.
    pub async fn check(&self) -> bool {
        if let Some(ref token) = self.session_token {
            self.post("/check", &SessionPayload { session_token: token }).await.is_ok()
        } else {
            false
        }
    }

    /// Get a cloud variable value.
    pub async fn get_var(&self, name: &str) -> Result<String, Box<dyn Error>> {
        let res = self.post("/var/get", &VarPayload {
            session_token: self.session_token.as_ref().ok_or("Not initialized")?,
            name,
            value: None,
        }).await?;
        Ok(res.value.unwrap_or_default())
    }

    /// Set a cloud variable value.
    pub async fn set_var(&self, name: &str, value: &str) -> Result<AuthResponse, Box<dyn Error>> {
        self.post("/var/set", &VarPayload {
            session_token: self.session_token.as_ref().ok_or("Not initialized")?,
            name,
            value: Some(value),
        }).await
    }

    /// Send a log entry.
    pub async fn log(&self, message: &str, level: &str) -> Result<AuthResponse, Box<dyn Error>> {
        self.post("/log", &LogPayload {
            session_token: self.session_token.as_ref().ok_or("Not initialized")?,
            message,
            level,
        }).await
    }

    /// Request a HWID reset for a key.
    pub async fn reset_hwid(&self, key: &str) -> Result<AuthResponse, Box<dyn Error>> {
        self.post("/hwid/reset", &SessionPayload {
            session_token: self.session_token.as_ref().ok_or("Not initialized")?,
        }).await
    }

    /// Get chat messages from a channel.
    pub async fn get_chat(&self, channel: &str) -> Result<Vec<Value>, Box<dyn Error>> {
        let res = self.get("/chat", &[
            ("session_token", self.session_token.as_ref().ok_or("Not initialized")?),
            ("channel", channel),
        ]).await?;
        Ok(match res.extra {
            Some(mut m) => m.remove("messages").and_then(|v| v.as_array().cloned()).unwrap_or_default(),
            None => vec![],
        })
    }

    /// Send a chat message.
    pub async fn send_chat(&self, sender: &str, message: &str, channel: &str) -> Result<AuthResponse, Box<dyn Error>> {
        self.post("/chat", &ChatPayload {
            session_token: self.session_token.as_ref().ok_or("Not initialized")?,
            channel,
            sender,
            message,
        }).await
    }
}
