using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace DarkAuthUnity
{
    [Serializable]
    public class InitResponse
    {
        public bool success;
        public string message;
        public string session_token;
    }

    [Serializable]
    public class LicenseResponse
    {
        public bool success;
        public string message;
        public int level;
        public string status;
    }

    [Serializable]
    public class VarResponse
    {
        public bool success;
        public string value;
    }

    public class DarkAuthUnity : MonoBehaviour
    {
        [Header("Configuration")]
        public string appId = "";
        public string secret = "";
        public string version = "1.0.0";
        public string apiUrl = "";

        [Header("Runtime State")]
        public string sessionToken;
        public bool isAuthenticated;
        public string clientHwid;

        public static DarkAuthUnity Instance { get; private set; }

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

        private IEnumerator PostRequest(string endpoint, string jsonPayload, Action<string> onSuccess, Action<string> onError)
        {
            string url = apiUrl.TrimEnd('/') + "/" + endpoint.TrimStart('/');
            using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonPayload);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");

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

        public void Initialize(Action<InitResponse> onComplete, Action<string> onError)
        {
            string json = JsonUtility.ToJson(new
            {
                app_id = appId,
                secret = secret,
                version = version
            });

            StartCoroutine(PostRequest("init", $"{{\"app_id\":\"{appId}\",\"secret\":\"{secret}\",\"version\":\"{version}\"}}",
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
                        onError?.Invoke(parsed.message);
                    }
                },
                onError
            ));
        }

        public void AuthenticateLicense(string key, Action<LicenseResponse> onComplete, Action<string> onError)
        {
            if (string.IsNullOrEmpty(sessionToken))
            {
                Initialize(
                    (initRes) => AuthenticateLicense(key, onComplete, onError),
                    onError
                );
                return;
            }

            string payload = $"{{\"session_token\":\"{sessionToken}\",\"key\":\"{key.Trim()}\",\"hwid\":\"{clientHwid}\"}}";
            StartCoroutine(PostRequest("license", payload,
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
                        onError?.Invoke(parsed.message);
                    }
                },
                onError
            ));
        }

        public void GetVariable(string name, Action<string> onComplete, Action<string> onError)
        {
            string payload = $"{{\"session_token\":\"{sessionToken}\",\"name\":\"{name}\"}}";
            StartCoroutine(PostRequest("var/get", payload,
                (res) =>
                {
                    var parsed = JsonUtility.FromJson<VarResponse>(res);
                    if (parsed.success)
                    {
                        onComplete?.Invoke(parsed.value);
                    }
                    else
                    {
                        onError?.Invoke("Variable not found");
                    }
                },
                onError
            ));
        }
    }
}
