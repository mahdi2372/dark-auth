using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace DarkAuthUnity
{
    /// <summary>Response from the DARK-AUTH init endpoint.</summary>
    [Serializable]
    public class InitResponse
    {
        public bool success;
        public string message;
        public string session_token;
        public string code;
        public UpdateInfo update;
    }

    /// <summary>Software update information.</summary>
    [Serializable]
    public class UpdateInfo
    {
        public bool available;
        public string latest_version;
        public string download_url;
    }

    /// <summary>Response from the DARK-AUTH license endpoint.</summary>
    [Serializable]
    public class LicenseResponse
    {
        public bool success;
        public string message;
        public string code;
        public int level;
        public string status;
        public string expires_at;
    }

    /// <summary>Response from the DARK-AUTH login/register endpoint.</summary>
    [Serializable]
    public class UserResponse
    {
        public bool success;
        public string message;
        public string code;
        public string username;
    }

    /// <summary>Response from the DARK-AUTH check endpoint.</summary>
    [Serializable]
    public class CheckResponse
    {
        public bool success;
        public string message;
        public string code;
        public string expires_at;
    }

    /// <summary>Response from the DARK-AUTH var/get endpoint.</summary>
    [Serializable]
    public class VarResponse
    {
        public bool success;
        public string message;
        public string code;
        public string value;
    }

    /// <summary>Response from the DARK-AUTH log/hwid/reset/chat endpoints.</summary>
    [Serializable]
    public class GenericResponse
    {
        public bool success;
        public string message;
        public string code;
    }

    /// <summary>DARK-AUTH Official Unity SDK v2.0.0.</summary>
    public class DarkAuthUnity : MonoBehaviour
    {
        [Header("Configuration")]
        public string appId = "";
        public string secret = "";
        public string version = "2.0.0";
        public string apiUrl = "";

        [Header("Runtime State")]
        public string sessionToken;
        public bool isAuthenticated;
        public string clientHwid;
        public string user;

        public static DarkAuthUnity Instance { get; private set; }

        private const string ApiPrefix = "/api/v2";

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                clientHwid = SystemInfo.deviceUniqueIdentifier;
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private string Url(string endpoint)
        {
            return apiUrl.TrimEnd('/') + ApiPrefix + "/" + endpoint.TrimStart('/');
        }

        private IEnumerator PostRequest(string endpoint, string jsonPayload, Action<string> onSuccess, Action<string> onError)
        {
            using (UnityWebRequest request = new UnityWebRequest(Url(endpoint), "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonPayload);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.timeout = 15;

                yield return request.SendWebRequest();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    onError?.Invoke(request.error + ": " + request.downloadHandler.text);
                }
                else
                {
                    onSuccess?.Invoke(request.downloadHandler.text);
                }
            }
        }

        private IEnumerator GetRequest(string endpoint, Dictionary<string, string> queryParams, Action<string> onSuccess, Action<string> onError)
        {
            string queryString = "";
            foreach (var kv in queryParams)
            {
                if (queryString.Length > 0) queryString += "&";
                queryString += UnityWebRequest.EscapeURL(kv.Key) + "=" + UnityWebRequest.EscapeURL(kv.Value);
            }
            string url = Url(endpoint) + "?" + queryString;

            using (UnityWebRequest request = UnityWebRequest.Get(url))
            {
                request.timeout = 15;
                yield return request.SendWebRequest();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    onError?.Invoke(request.error + ": " + request.downloadHandler.text);
                }
                else
                {
                    onSuccess?.Invoke(request.downloadHandler.text);
                }
            }
        }

        private void EnsureSession(Action onReady, Action<string> onError)
        {
            if (!string.IsNullOrEmpty(sessionToken))
            {
                onReady?.Invoke();
            }
            else
            {
                Initialize((initRes) => onReady?.Invoke(), onError);
            }
        }

        /// <summary>Initialize a session with the DARK-AUTH API.</summary>
        public void Initialize(Action<InitResponse> onComplete, Action<string> onError)
        {
            string json = JsonUtility.ToJson(new InitPayload { app_id = appId, secret = secret, version = version });
            StartCoroutine(PostRequest("init", json,
                (res) =>
                {
                    var parsed = JsonUtility.FromJson<InitResponse>(res);
                    if (parsed.success)
                    {
                        sessionToken = parsed.session_token;
                        onComplete?.Invoke(parsed);
                    }
                    else
                    {
                        onError?.Invoke(parsed.message ?? parsed.code ?? "Init failed");
                    }
                },
                onError
            ));
        }

        /// <summary>Authenticate with a license key.</summary>
        public void AuthenticateLicense(string key, Action<LicenseResponse> onComplete, Action<string> onError)
        {
            EnsureSession(() =>
            {
                string json = JsonUtility.ToJson(new LicensePayload { session_token = sessionToken, key = key.Trim(), hwid = clientHwid });
                StartCoroutine(PostRequest("license", json,
                    (res) =>
                    {
                        var parsed = JsonUtility.FromJson<LicenseResponse>(res);
                        if (parsed.success)
                        {
                            isAuthenticated = true;
                            onComplete?.Invoke(parsed);
                        }
                        else
                        {
                            onError?.Invoke(parsed.message ?? parsed.code ?? "License failed");
                        }
                    },
                    onError
                ));
            }, onError);
        }

        /// <summary>Log in with username and password.</summary>
        public void Login(string username, string password, Action<UserResponse> onComplete, Action<string> onError)
        {
            EnsureSession(() =>
            {
                string json = JsonUtility.ToJson(new LoginPayload { session_token = sessionToken, username = username, password = password, hwid = clientHwid });
                StartCoroutine(PostRequest("login", json,
                    (res) =>
                    {
                        var parsed = JsonUtility.FromJson<UserResponse>(res);
                        if (parsed.success)
                        {
                            isAuthenticated = true;
                            user = parsed.username;
                            onComplete?.Invoke(parsed);
                        }
                        else
                        {
                            onError?.Invoke(parsed.message ?? parsed.code ?? "Login failed");
                        }
                    },
                    onError
                ));
            }, onError);
        }

        /// <summary>Register a new account with a license key.</summary>
        public void Register(string username, string password, string key, Action<UserResponse> onComplete, Action<string> onError)
        {
            EnsureSession(() =>
            {
                string json = JsonUtility.ToJson(new RegisterPayload { session_token = sessionToken, username = username, password = password, key = key.Trim(), hwid = clientHwid });
                StartCoroutine(PostRequest("register", json,
                    (res) =>
                    {
                        var parsed = JsonUtility.FromJson<UserResponse>(res);
                        if (parsed.success)
                        {
                            isAuthenticated = true;
                            user = parsed.username;
                            onComplete?.Invoke(parsed);
                        }
                        else
                        {
                            onError?.Invoke(parsed.message ?? parsed.code ?? "Register failed");
                        }
                    },
                    onError
                ));
            }, onError);
        }

        /// <summary>Check if the current session is still valid.</summary>
        public void CheckSession(Action<bool> onComplete)
        {
            if (string.IsNullOrEmpty(sessionToken))
            {
                onComplete?.Invoke(false);
                return;
            }

            string json = JsonUtility.ToJson(new SessionPayload { session_token = sessionToken });
            StartCoroutine(PostRequest("check", json,
                (res) =>
                {
                    var parsed = JsonUtility.FromJson<CheckResponse>(res);
                    onComplete?.Invoke(parsed.success);
                },
                (err) => onComplete?.Invoke(false)
            ));
        }

        /// <summary>Get a cloud variable value.</summary>
        public void GetVariable(string name, Action<string> onComplete, Action<string> onError)
        {
            EnsureSession(() =>
            {
                string json = JsonUtility.ToJson(new VarPayload { session_token = sessionToken, name = name });
                StartCoroutine(PostRequest("var/get", json,
                    (res) =>
                    {
                        var parsed = JsonUtility.FromJson<VarResponse>(res);
                        if (parsed.success)
                        {
                            onComplete?.Invoke(parsed.value);
                        }
                        else
                        {
                            onError?.Invoke(parsed.message ?? "Variable not found");
                        }
                    },
                    onError
                ));
            }, onError);
        }

        /// <summary>Set a cloud variable value.</summary>
        public void SetVariable(string name, string value, Action<GenericResponse> onComplete, Action<string> onError)
        {
            EnsureSession(() =>
            {
                string json = JsonUtility.ToJson(new SetVarPayload { session_token = sessionToken, name = name, value = value });
                StartCoroutine(PostRequest("var/set", json,
                    (res) =>
                    {
                        var parsed = JsonUtility.FromJson<GenericResponse>(res);
                        onComplete?.Invoke(parsed);
                    },
                    onError
                ));
            }, onError);
        }

        /// <summary>Send a log entry.</summary>
        public void LogMessage(string message, string level = "INFO")
        {
            if (string.IsNullOrEmpty(sessionToken)) return;
            string json = JsonUtility.ToJson(new LogPayload { session_token = sessionToken, message = message, level = level });
            StartCoroutine(PostRequest("log", json, null, null));
        }

        /// <summary>Request a HWID reset for a key.</summary>
        public void ResetHWID(string key, Action<GenericResponse> onComplete, Action<string> onError)
        {
            EnsureSession(() =>
            {
                string json = JsonUtility.ToJson(new HWIDPayload { session_token = sessionToken, key = key });
                StartCoroutine(PostRequest("hwid/reset", json,
                    (res) =>
                    {
                        var parsed = JsonUtility.FromJson<GenericResponse>(res);
                        onComplete?.Invoke(parsed);
                    },
                    onError
                ));
            }, onError);
        }

        /// <summary>Get chat messages from a channel.</summary>
        public void GetChat(string channel, Action<List<ChatMessage>> onComplete, Action<string> onError)
        {
            EnsureSession(() =>
            {
                var parms = new Dictionary<string, string>
                {
                    { "session_token", sessionToken },
                    { "channel", channel ?? "general" }
                };
                StartCoroutine(GetRequest("chat", parms,
                    (res) =>
                    {
                        var parsed = JsonUtility.FromJson<ChatResponse>(res);
                        onComplete?.Invoke(parsed.messages ?? new List<ChatMessage>());
                    },
                    onError
                ));
            }, onError);
        }

        /// <summary>Send a chat message.</summary>
        public void SendChat(string sender, string message, string channel, Action<GenericResponse> onComplete, Action<string> onError)
        {
            EnsureSession(() =>
            {
                string json = JsonUtility.ToJson(new ChatPayload { session_token = sessionToken, channel = channel ?? "general", sender = sender, message = message });
                StartCoroutine(PostRequest("chat", json,
                    (res) =>
                    {
                        var parsed = JsonUtility.FromJson<GenericResponse>(res);
                        onComplete?.Invoke(parsed);
                    },
                    onError
                ));
            }, onError);
        }

        #region Payload Classes

        [Serializable] private class InitPayload { public string app_id; public string secret; public string version; }
        [Serializable] private class LicensePayload { public string session_token; public string key; public string hwid; }
        [Serializable] private class LoginPayload { public string session_token; public string username; public string password; public string hwid; }
        [Serializable] private class RegisterPayload { public string session_token; public string username; public string password; public string key; public string hwid; }
        [Serializable] private class SessionPayload { public string session_token; }
        [Serializable] private class VarPayload { public string session_token; public string name; }
        [Serializable] private class SetVarPayload { public string session_token; public string name; public string value; }
        [Serializable] private class LogPayload { public string session_token; public string message; public string level; }
        [Serializable] private class HWIDPayload { public string session_token; public string key; }
        [Serializable] private class ChatPayload { public string session_token; public string channel; public string sender; public string message; }
        [Serializable] public class ChatMessage { public string sender; public string message; public string channel; public string timestamp; }
        [Serializable] private class ChatResponse { public List<ChatMessage> messages; }

        #endregion
    }
}
