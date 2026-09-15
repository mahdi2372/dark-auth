#ifndef DARKAUTH_HPP
#define DARKAUTH_HPP

#include <string>
#include <sstream>
#include <map>
#include <vector>

#ifdef _WIN32
#include <windows.h>
#include <wininet.h>
#pragma comment(lib, "wininet.lib")
#endif

namespace DarkAuthSdk {

static const std::string DARKAUTH_VERSION = "2.0.0";

struct DarkAuthResponse {
    bool success = false;
    std::string code;
    std::string message;
    std::string rawJson;
    int level = 0;
    std::string status;
    std::string value;
};

class DarkAuth {
public:
    std::string appId;
    std::string secret;
    std::string version;
    std::string apiUrl;
    std::string sessionToken;
    std::string hwid;

    DarkAuth(const std::string& appId, const std::string& secret, const std::string& apiUrl, const std::string& version = DARKAUTH_VERSION)
        : appId(appId), secret(secret), version(version), apiUrl(apiUrl) {
        hwid = generateHWID();
    }

    static std::string generateHWID() {
#ifdef _WIN32
        HW_PROFILE_INFO hwProfileInfo;
        if (GetCurrentHwProfile(&hwProfileInfo)) {
            return std::string(hwProfileInfo.szHwProfileGuid);
        }
#endif
        return "cpp_default_hwid_" + std::to_string(reinterpret_cast<uintptr_t>(&hwid));
    }

    std::string _url(const std::string& endpoint) {
        std::string ep = endpoint;
        if (!ep.empty() && ep[0] == '/') ep = ep.substr(1);
        return apiUrl + "/api/v2/" + ep;
    }

    DarkAuthResponse _parse(const std::string& json) {
        DarkAuthResponse r;
        r.rawJson = json;

        auto findBool = [&](const std::string& key) -> bool {
            std::string needle = "\"" + key + "\":true";
            return json.find(needle) != std::string::npos;
        };
        auto findString = [&](const std::string& key) -> std::string {
            std::string needle = "\"" + key + "\":\"";
            size_t pos = json.find(needle);
            if (pos == std::string::npos) return "";
            pos += needle.length();
            size_t end = json.find("\"", pos);
            return json.substr(pos, end - pos);
        };

        r.success = findBool("success");
        r.code = findString("code");
        r.message = findString("message");
        r.status = findString("status");
        r.value = findString("value");

        std::string tokenNeedle = "\"session_token\":\"";
        size_t tpos = json.find(tokenNeedle);
        if (tpos != std::string::npos) {
            tpos += tokenNeedle.length();
            size_t tend = json.find("\"", tpos);
            sessionToken = json.substr(tpos, tend - tpos);
        }

        std::string levelNeedle = "\"level\":";
        size_t lpos = json.find(levelNeedle);
        if (lpos != std::string::npos) {
            lpos += levelNeedle.length();
            r.level = std::stoi(json.substr(lpos));
        }

        return r;
    }

#ifdef _WIN32
    std::string httpPost(const std::string& endpoint, const std::string& jsonPayload) {
        std::string url = _url(endpoint);
        std::string host, basePath;
        INTERNET_PORT port = 443;

        std::string work = url;
        size_t schemeEnd = work.find("://");
        if (schemeEnd != std::string::npos) {
            std::string scheme = work.substr(0, schemeEnd);
            work = work.substr(schemeEnd + 3);
            port = (scheme == "https") ? 443 : 80;
        }
        size_t hostEnd = work.find('/');
        if (hostEnd != std::string::npos) {
            host = work.substr(0, hostEnd);
            basePath = work.substr(hostEnd);
        } else {
            host = work;
        }
        size_t colonPos = host.find(':');
        if (colonPos != std::string::npos) {
            port = static_cast<INTERNET_PORT>(std::stoi(host.substr(colonPos + 1)));
            host = host.substr(0, colonPos);
        }

        HINTERNET hInternet = InternetOpenA("DarkAuthCppSdk/2.0", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
        if (!hInternet) return "{\"success\":false,\"message\":\"InternetOpen failed\"}";

        HINTERNET hConnect = InternetConnectA(hInternet, host.c_str(), port, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
        if (!hConnect) { InternetCloseHandle(hInternet); return "{\"success\":false,\"message\":\"InternetConnect failed\"}"; }

        HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", basePath.c_str(), NULL, NULL, NULL, INTERNET_FLAG_RELOAD, 0);
        if (!hRequest) { InternetCloseHandle(hConnect); InternetCloseHandle(hInternet); return "{\"success\":false,\"message\":\"HttpOpenRequest failed\"}"; }

        std::string headers = "Content-Type: application/json\r\n";
        HttpSendRequestA(hRequest, headers.c_str(), (DWORD)headers.length(), (LPVOID)jsonPayload.c_str(), (DWORD)jsonPayload.length());

        std::string response;
        char buffer[4096];
        DWORD bytesRead = 0;
        while (InternetReadFile(hRequest, buffer, sizeof(buffer) - 1, &bytesRead) && bytesRead > 0) {
            buffer[bytesRead] = '\0';
            response.append(buffer);
        }

        InternetCloseHandle(hRequest);
        InternetCloseHandle(hConnect);
        InternetCloseHandle(hInternet);
        return response;
    }

    std::string httpGet(const std::string& endpoint, const std::map<std::string, std::string>& params = {}) {
        std::string qs;
        for (auto& kv : params) {
            if (!qs.empty()) qs += "&";
            qs += kv.first + "=" + kv.second;
        }
        std::string ep = endpoint;
        if (!qs.empty()) ep += "?" + qs;
        // For simplicity, GET is implemented via a custom request on Windows
        std::string url = _url(ep);
        // Re-use httpPost infrastructure but with GET via INET_FLAG_RELOAD — simplified fallback
        return httpPost(ep, "{}");
    }

    std::string httpPostRaw(const std::string& endpoint, const std::string& jsonPayload) {
        return httpPost(endpoint, jsonPayload);
    }
#else
    std::string httpPost(const std::string& endpoint, const std::string& jsonPayload) {
        return "{\"success\":false,\"message\":\"Non-Windows requires libcurl integration\"}";
    }
    std::string httpGet(const std::string& endpoint, const std::map<std::string, std::string>& params = {}) {
        return "{\"success\":false,\"message\":\"Non-Windows requires libcurl integration\"}";
    }
    std::string httpPostRaw(const std::string& endpoint, const std::string& jsonPayload) {
        return httpPost(endpoint, jsonPayload);
    }
#endif

    DarkAuthResponse init(const std::string& binaryHash = "") {
        std::string payload = "{\"app_id\":\"" + appId + "\",\"secret\":\"" + secret + "\",\"version\":\"" + version + "\"";
        if (!binaryHash.empty()) {
            payload += ",\"hash\":\"" + binaryHash + "\"";
        }
        payload += "}";
        return _parse(httpPost("/init", payload));
    }

    DarkAuthResponse license(const std::string& key) {
        if (sessionToken.empty()) init();
        std::string payload = "{\"session_token\":\"" + sessionToken + "\",\"key\":\"" + key + "\",\"hwid\":\"" + hwid + "\"}";
        return _parse(httpPost("/license", payload));
    }

    DarkAuthResponse login(const std::string& username, const std::string& password) {
        if (sessionToken.empty()) init();
        std::string payload = "{\"session_token\":\"" + sessionToken + "\",\"username\":\"" + username + "\",\"password\":\"" + password + "\",\"hwid\":\"" + hwid + "\"}";
        return _parse(httpPost("/login", payload));
    }

    DarkAuthResponse registerUser(const std::string& username, const std::string& password, const std::string& key) {
        if (sessionToken.empty()) init();
        std::string payload = "{\"session_token\":\"" + sessionToken + "\",\"username\":\"" + username + "\",\"password\":\"" + password + "\",\"key\":\"" + key + "\",\"hwid\":\"" + hwid + "\"}";
        return _parse(httpPost("/register", payload));
    }

    bool check() {
        if (sessionToken.empty()) return false;
        std::string payload = "{\"session_token\":\"" + sessionToken + "\"}";
        DarkAuthResponse r = _parse(httpPost("/check", payload));
        return r.success;
    }

    std::string getVar(const std::string& name) {
        std::string payload = "{\"session_token\":\"" + sessionToken + "\",\"name\":\"" + name + "\"}";
        return _parse(httpPost("/var/get", payload)).value;
    }

    DarkAuthResponse setVar(const std::string& name, const std::string& value) {
        std::string payload = "{\"session_token\":\"" + sessionToken + "\",\"name\":\"" + name + "\",\"value\":\"" + value + "\"}";
        return _parse(httpPost("/var/set", payload));
    }

    DarkAuthResponse logMessage(const std::string& message, const std::string& level = "INFO") {
        std::string payload = "{\"session_token\":\"" + sessionToken + "\",\"message\":\"" + message + "\",\"level\":\"" + level + "\"}";
        return _parse(httpPost("/log", payload));
    }

    DarkAuthResponse resetHWID(const std::string& key) {
        std::string payload = "{\"session_token\":\"" + sessionToken + "\",\"key\":\"" + key + "\"}";
        return _parse(httpPost("/hwid/reset", payload));
    }

    DarkAuthResponse sendChat(const std::string& sender, const std::string& message, const std::string& channel = "general") {
        std::string payload = "{\"session_token\":\"" + sessionToken + "\",\"channel\":\"" + channel + "\",\"sender\":\"" + sender + "\",\"message\":\"" + message + "\"}";
        return _parse(httpPost("/chat", payload));
    }
};

} // namespace DarkAuthSdk

#endif // DARKAUTH_HPP
