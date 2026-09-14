use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::error::Error;

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
struct InitReq<'a> {
    app_id: &'a str,
    secret: &'a str,
    version: &'a str,
    hash: Option<&'a str>,
}

#[derive(Deserialize, Debug)]
pub struct AuthResponse {
    pub success: bool,
    pub message: Option<String>,
    pub session_token: Option<String>,
    pub code: Option<String>,
}

impl DarkAuth {
    pub fn new(app_id: &str, secret: &str, version: &str, api_url: &str) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(b"RUST_CLIENT_DEFAULT_HWID");
        let hwid = format!("{:x}", hasher.finalize());

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

    pub async fn init(&mut self, hash: Option<&str>) -> Result<AuthResponse, Box<dyn Error>> {
        let url = format!("{}/init", self.api_url);
        let req = InitReq {
            app_id: &self.app_id,
            secret: &self.secret,
            version: &self.version,
            hash,
        };

        let resp = self.client.post(&url).json(&req).send().await?;
        let res: AuthResponse = resp.json().await?;
        if res.success {
            self.session_token = res.session_token.clone();
            Ok(res)
        } else {
            Err(format!("[{}] {}", res.code.unwrap_or_default(), res.message.unwrap_or_default()).into())
        }
    }

    pub async fn license(&mut self, key: &str) -> Result<Value, Box<dyn Error>> {
        if self.session_token.is_none() {
            self.init(None).await?;
        }

        let url = format!("{}/license", self.api_url);
        let payload = serde_json::json!({
            "session_token": self.session_token.as_ref().unwrap(),
            "key": key,
            "hwid": self.hwid,
        });

        let resp = self.client.post(&url).json(&payload).send().await?;
        let val: Value = resp.json().await?;
        if val.get("success").and_then(|v| v.as_bool()).unwrap_or(false) {
            Ok(val)
        } else {
            Err(val.get("message").and_then(|m| m.as_str()).unwrap_or("Failed").into())
        }
    }

    pub async fn get_var(&self, name: &str) -> Result<String, Box<dyn Error>> {
        let url = format!("{}/var/get", self.api_url);
        let payload = serde_json::json!({
            "session_token": self.session_token.as_ref().unwrap(),
            "name": name,
        });

        let resp = self.client.post(&url).json(&payload).send().await?;
        let val: Value = resp.json().await?;
        Ok(val.get("value").and_then(|v| v.as_str()).unwrap_or("").to_string())
    }
}
