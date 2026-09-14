using System;
using System.Collections.Generic;
using System.IO;
using System.Management;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace DarkAuthSdk
{
    public class DarkAuth
    {
        public string AppId { get; }
        public string Secret { get; }
        public string Version { get; }
        public string ApiUrl { get; }
        public string SessionToken { get; private set; }
        public string Hwid { get; }

        private static readonly HttpClient _httpClient = new HttpClient();

        public DarkAuth(string appId, string secret, string apiUrl, string version = "1.0.0")
        {
            AppId = appId;
            Secret = secret;
            Version = version;
            ApiUrl = apiUrl.TrimEnd('/');
            Hwid = GenerateHwid();
        }

        public static string GenerateHwid()
        {
            var raw = Environment.MachineName + ":" + Environment.UserName + ":" + Environment.ProcessorCount;
            using var sha = SHA256.Create();
            var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(raw));
            return BitConverter.ToString(bytes).Replace("-", "").ToLower();
        }

        public static string ComputeFileHash(string filePath)
        {
            using var sha = SHA256.Create();
            using var stream = File.OpenRead(filePath);
            var bytes = sha.ComputeHash(stream);
            return BitConverter.ToString(bytes).Replace("-", "").ToLower();
        }

        private async Task<JsonElement> PostAsync(string endpoint, object data)
        {
            var json = JsonSerializer.Serialize(data);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync($"{ApiUrl}/{endpoint.TrimStart('/')}", content);
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

        public async Task<JsonElement> InitAsync(string binaryPath = null)
        {
            var hash = string.IsNullOrEmpty(binaryPath) ? null : ComputeFileHash(binaryPath);
            var payload = new
            {
                app_id = AppId,
                secret = Secret,
                version = Version,
                hash
            };
            var res = await PostAsync("/init", payload);
            if (res.TryGetProperty("session_token", out var token))
            {
                SessionToken = token.GetString();
            }
            return res;
        }

        public async Task<JsonElement> LicenseAsync(string key)
        {
            if (string.IsNullOrEmpty(SessionToken)) await InitAsync();
            var payload = new
            {
                session_token = SessionToken,
                key,
                hwid = Hwid
            };
            return await PostAsync("/license", payload);
        }

        public async Task<JsonElement> LoginAsync(string username, string password)
        {
            if (string.IsNullOrEmpty(SessionToken)) await InitAsync();
            var payload = new
            {
                session_token = SessionToken,
                username,
                password,
                hwid = Hwid
            };
            return await PostAsync("/login", payload);
        }

        public async Task<JsonElement> RegisterAsync(string username, string password, string key)
        {
            if (string.IsNullOrEmpty(SessionToken)) await InitAsync();
            var payload = new
            {
                session_token = SessionToken,
                username,
                password,
                key,
                hwid = Hwid
            };
            return await PostAsync("/register", payload);
        }

        public async Task<bool> CheckSessionAsync()
        {
            if (string.IsNullOrEmpty(SessionToken)) return false;
            try
            {
                var res = await PostAsync("/check", new { session_token = SessionToken });
                return res.TryGetProperty("success", out var s) && s.GetBoolean();
            }
            catch
            {
                return false;
            }
        }

        public async Task<string> GetVarAsync(string name)
        {
            var res = await PostAsync("/var/get", new { session_token = SessionToken, name });
            return res.TryGetProperty("value", out var val) ? val.GetString() : null;
        }

        public async Task<JsonElement> SetVarAsync(string name, string value)
        {
            return await PostAsync("/var/set", new { session_token = SessionToken, name, value });
        }

        public async Task LogAsync(string message, string level = "INFO")
        {
            await PostAsync("/log", new { session_token = SessionToken, message, level });
        }

        public async Task ResetHwidAsync(string key)
        {
            await PostAsync("/hwid/reset", new { session_token = SessionToken, key });
        }
    }
}
