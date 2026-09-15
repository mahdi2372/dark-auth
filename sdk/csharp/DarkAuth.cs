using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Management;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace DarkAuthSdk
{
    /// <summary>DARK-AUTH Official C# SDK v2.0.0</summary>
    public class DarkAuth : IDisposable
    {
        public string AppId { get; }
        public string Secret { get; }
        public string Version { get; }
        public string ApiUrl { get; }
        public string SessionToken { get; private set; }
        public string Hwid { get; }
        public Dictionary<string, object> User { get; private set; }
        public Dictionary<string, object> LicenseInfo { get; private set; }

        private static readonly HttpClient _httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };

        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        };

        public DarkAuth(string appId, string secret, string apiUrl, string version = "2.0.0")
        {
            AppId = appId;
            Secret = secret;
            Version = version;
            ApiUrl = apiUrl.TrimEnd('/');
            Hwid = GenerateHwid();
        }

        /// <summary>Generate a hardware fingerprint from system information.</summary>
        public static string GenerateHwid()
        {
            try
            {
                var sb = new StringBuilder();
                sb.Append(Environment.MachineName);
                sb.Append(':');
                sb.Append(Environment.UserName);

                try
                {
                    using var searcher = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct");
                    foreach (var obj in searcher.Get())
                    {
                        sb.Append(':');
                        sb.Append(obj["UUID"]?.ToString() ?? "");
                    }
                }
                catch { }

                using var sha = SHA256.Create();
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(sb.ToString()));
                return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
            }
            catch
            {
                return "csharp_default_hwid";
            }
        }

        /// <summary>Compute SHA-256 hash of a file for integrity checking.</summary>
        public static string ComputeFileHash(string filePath)
        {
            using var sha = SHA256.Create();
            using var stream = File.OpenRead(filePath);
            var bytes = sha.ComputeHash(stream);
            return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
        }

        private string Url(string endpoint)
        {
            return $"{ApiUrl}/api/v2/{endpoint.TrimStart('/')}";
        }

        private async Task<JsonElement> PostAsync(string endpoint, object data)
        {
            var json = JsonSerializer.Serialize(data, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(Url(endpoint), content);
            var resString = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(resString);
            var root = doc.RootElement;

            if (root.TryGetProperty("success", out var success) && !success.GetBoolean())
            {
                var msg = root.TryGetProperty("message", out var m) ? m.GetString() : "Request failed";
                var code = root.TryGetProperty("code", out var c) ? c.GetString() : "ERROR";
                throw new Exception($"[{code}] {msg}");
            }
            return root;
        }

        private async Task<JsonElement> GetAsync(string endpoint, Dictionary<string, string> queryParams)
        {
            var qs = string.Join("&", queryParams.Select(kv => $"{kv.Key}={Uri.EscapeDataString(kv.Value)}"));
            var url = string.IsNullOrEmpty(qs) ? Url(endpoint) : $"{Url(endpoint)}?{qs}";
            var response = await _httpClient.GetAsync(url);
            var resString = await response.Content.ReadAsStringAsync();
            return JsonDocument.Parse(resString).RootElement;
        }

        /// <summary>Initialize session with the DARK-AUTH API.</summary>
        public async Task<JsonElement> InitAsync(string binaryPath = null)
        {
            var payload = new Dictionary<string, object>
            {
                ["app_id"] = AppId,
                ["secret"] = Secret,
                ["version"] = Version,
            };
            if (!string.IsNullOrEmpty(binaryPath))
                payload["hash"] = ComputeFileHash(binaryPath);

            var res = await PostAsync("/init", payload);
            if (res.TryGetProperty("session_token", out var token))
                SessionToken = token.GetString();
            return res;
        }

        /// <summary>Authenticate with a license key.</summary>
        public async Task<JsonElement> LicenseAsync(string key)
        {
            if (string.IsNullOrEmpty(SessionToken)) await InitAsync();
            var res = await PostAsync("/license", new Dictionary<string, string>
            {
                ["session_token"] = SessionToken,
                ["key"] = key.Trim(),
                ["hwid"] = Hwid,
            });
            LicenseInfo = res.EnumerateObject().ToDictionary(p => p.Name, p => (object)(p.Value.ToString()));
            if (res.TryGetProperty("user", out var userProp))
                User = userProp.EnumerateObject().ToDictionary(p => p.Name, p => (object)(p.Value.ToString()));
            return res;
        }

        /// <summary>Log in with username and password.</summary>
        public async Task<JsonElement> LoginAsync(string username, string password)
        {
            if (string.IsNullOrEmpty(SessionToken)) await InitAsync();
            var res = await PostAsync("/login", new Dictionary<string, string>
            {
                ["session_token"] = SessionToken,
                ["username"] = username,
                ["password"] = password,
                ["hwid"] = Hwid,
            });
            if (res.TryGetProperty("user", out var userProp))
                User = userProp.EnumerateObject().ToDictionary(p => p.Name, p => (object)(p.Value.ToString()));
            return res;
        }

        /// <summary>Register a new account with a license key.</summary>
        public async Task<JsonElement> RegisterAsync(string username, string password, string key)
        {
            if (string.IsNullOrEmpty(SessionToken)) await InitAsync();
            var res = await PostAsync("/register", new Dictionary<string, string>
            {
                ["session_token"] = SessionToken,
                ["username"] = username,
                ["password"] = password,
                ["key"] = key.Trim(),
                ["hwid"] = Hwid,
            });
            if (res.TryGetProperty("user", out var userProp))
                User = userProp.EnumerateObject().ToDictionary(p => p.Name, p => (object)(p.Value.ToString()));
            return res;
        }

        /// <summary>Check if the current session is still valid.</summary>
        public async Task<bool> CheckAsync()
        {
            if (string.IsNullOrEmpty(SessionToken)) return false;
            try
            {
                var res = await PostAsync("/check", new Dictionary<string, string> { ["session_token"] = SessionToken });
                return res.TryGetProperty("success", out var s) && s.GetBoolean();
            }
            catch { return false; }
        }

        /// <summary>Get a cloud variable value.</summary>
        public async Task<string> GetVarAsync(string name)
        {
            var res = await PostAsync("/var/get", new Dictionary<string, string>
            {
                ["session_token"] = SessionToken,
                ["name"] = name,
            });
            return res.TryGetProperty("value", out var val) ? val.GetString() : null;
        }

        /// <summary>Set a cloud variable value.</summary>
        public async Task<JsonElement> SetVarAsync(string name, string value)
        {
            return await PostAsync("/var/set", new Dictionary<string, string>
            {
                ["session_token"] = SessionToken,
                ["name"] = name,
                ["value"] = value,
            });
        }

        /// <summary>Send a log entry to the API.</summary>
        public async Task LogAsync(string message, string level = "INFO")
        {
            await PostAsync("/log", new Dictionary<string, string>
            {
                ["session_token"] = SessionToken,
                ["message"] = message,
                ["level"] = level,
            });
        }

        /// <summary>Request a HWID reset for a key.</summary>
        public async Task<JsonElement> ResetHwidAsync(string key)
        {
            return await PostAsync("/hwid/reset", new Dictionary<string, string>
            {
                ["session_token"] = SessionToken,
                ["key"] = key,
            });
        }

        /// <summary>Get chat messages from a channel.</summary>
        public async Task<List<Dictionary<string, object>>> GetChatAsync(string channel = "general")
        {
            var res = await GetAsync("/chat", new Dictionary<string, string>
            {
                ["session_token"] = SessionToken,
                ["channel"] = channel,
            });
            if (res.TryGetProperty("messages", out var messages))
            {
                return messages.EnumerateArray()
                    .Select(m => m.EnumerateObject().ToDictionary(p => p.Name, p => (object)(p.Value.ToString())))
                    .ToList();
            }
            return new List<Dictionary<string, object>>();
        }

        /// <summary>Send a chat message.</summary>
        public async Task<JsonElement> SendChatAsync(string sender, string message, string channel = "general")
        {
            return await PostAsync("/chat", new Dictionary<string, string>
            {
                ["session_token"] = SessionToken,
                ["channel"] = channel,
                ["sender"] = sender,
                ["message"] = message,
            });
        }

        public void Dispose()
        {
            _httpClient?.Dispose();
        }
    }
}
