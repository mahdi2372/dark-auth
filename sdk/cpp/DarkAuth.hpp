#ifndef DARKAUTH_HPP
#define DARKAUTH_HPP

#include <string>
#include <iostream>
#include <sstream>
#include <vector>

#ifdef _WIN32
#include <windows.h>
#include <wininet.h>
#pragma comment(lib, "wininet.lib")
#endif

namespace DarkAuthSdk {

struct DarkAuthResponse {
    bool success = false;
    std::string code;
    std::string message;
    std::string rawJson;
    int level = 1;
};

class DarkAuth {
public:
    std::string appId;
    std::string secret;
    std::string version;
    std::string apiUrl;
    std::string sessionToken;
    std::string hwid;

    DarkAuth(const std::string& appId, const std::string& secret, const std::string& apiUrl, const std::string& version = "1.0.0")
        : appId(appId), secret(secret), version(version), apiUrl(apiUrl) {
        hwid = getHWID();
    }

    static std::string getHWID() {
#ifdef _WIN32
        HW_PROFILE_INFO hwProfileInfo;
        if (GetCurrentHwProfile(&hwProfileInfo)) {
            return std::string(hwProfileInfo.szHwProfileGuid);
        }
#endif
        return "GENERIC_CPP_CLIENT_HWID";
    }

    std::string httpPost(const std::string& path, const std::string& jsonPayload) {
#ifdef _WIN32
        // Parse apiUrl to extract host, port, and base path
        std::string url = apiUrl;
        std::string host = "localhost";
        INTERNET_PORT port = 443;
        std::string basePath = "";

        size_t schemeEnd = url.find("://");
        if (schemeEnd != std::string::npos) {
            std::string scheme = url.substr(0, schemeEnd);
            url = url.substr(schemeEnd + 3);
            port = (scheme == "https") ? 443 : 80;
        }

        size_t hostEnd = url.find('/');
        if (hostEnd != std::string::npos) {
            host = url.substr(0, hostEnd);
            basePath = url.substr(hostEnd);
        } else {
            host = url;
        }

        // Check for port in host
        size_t colonPos = host.find(':');
        if (colonPos != std::string::npos) {
            port = static_cast<INTERNET_PORT>(std::stoi(host.substr(colonPos + 1)));
            host = host.substr(0, colonPos);
        }

        std::string fullPath = basePath + path;

        HINTERNET hInternet = InternetOpenA("DarkAuthCppClient/1.0", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
        if (!hInternet) return "{\"success\":false,\"message\":\"InternetOpen failed\"}";

        HINTERNET hConnect = InternetConnectA(hInternet, host.c_str(), port, NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
        if (!hConnect) {
            InternetCloseHandle(hInternet);
            return "{\"success\":false,\"message\":\"InternetConnect failed\"}";
        }

        HINTERNET hRequest = HttpOpenRequestA(hConnect, "POST", fullPath.c_str(), NULL, NULL, NULL, INTERNET_FLAG_RELOAD, 0);
        if (!hRequest) {
            InternetCloseHandle(hConnect);
            InternetCloseHandle(hInternet);
            return "{\"success\":false,\"message\":\"HttpOpenRequest failed\"}";
        }

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
#else
        return "{\"success\":false,\"message\":\"Non-Windows platform requires libcurl\"}";
#endif
    }

    DarkAuthResponse init() {
        std::stringstream ss;
        ss << "{\"app_id\":\"" << appId << "\",\"secret\":\"" << secret << "\",\"version\":\"" << version << "\"}";
        std::string res = httpPost("/init", ss.str());
        
        DarkAuthResponse r;
        r.rawJson = res;
        r.success = (res.find("\"success\":true") != std::string::npos);
        
        // Extract session token
        size_t pos = res.find("\"session_token\":\"");
        if (pos != std::string::npos) {
            pos += 17;
            size_t end = res.find("\"", pos);
            sessionToken = res.substr(pos, end - pos);
        }
        return r;
    }

    DarkAuthResponse license(const std::string& key) {
        if (sessionToken.empty()) init();
        std::stringstream ss;
        ss << "{\"session_token\":\"" << sessionToken << "\",\"key\":\"" << key << "\",\"hwid\":\"" << hwid << "\"}";
        std::string res = httpPost("/license", ss.str());

        DarkAuthResponse r;
        r.rawJson = res;
        r.success = (res.find("\"success\":true") != std::string::npos);
        return r;
    }

    DarkAuthResponse login(const std::string& username, const std::string& password) {
        if (sessionToken.empty()) init();
        std::stringstream ss;
        ss << "{\"session_token\":\"" << sessionToken << "\",\"username\":\"" << username << "\",\"password\":\"" << password << "\",\"hwid\":\"" << hwid << "\"}";
        std::string res = httpPost("/login", ss.str());

        DarkAuthResponse r;
        r.rawJson = res;
        r.success = (res.find("\"success\":true") != std::string::npos);
        return r;
    }

    std::string getVar(const std::string& name) {
        std::stringstream ss;
        ss << "{\"session_token\":\"" << sessionToken << "\",\"name\":\"" << name << "\"}";
        std::string res = httpPost("/var/get", ss.str());
        size_t pos = res.find("\"value\":\"");
        if (pos != std::string::npos) {
            pos += 9;
            size_t end = res.find("\"", pos);
            return res.substr(pos, end - pos);
        }
        return "";
    }
};

} // namespace DarkAuthSdk

#endif // DARKAUTH_HPP
