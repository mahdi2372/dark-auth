package com.darkauth;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;

public class DarkAuth {
    private final String appId;
    private final String secret;
    private final String version;
    private final String apiUrl;
    private String sessionToken;
    private final String hwid;
    private final HttpClient httpClient;

    public DarkAuth(String appId, String secret, String version, String apiUrl) {
        this.appId = appId;
        this.secret = secret;
        this.version = (version != null) ? version : "1.0.0";
        this.apiUrl = apiUrl.replaceAll("/+$", "");
        this.hwid = generateHWID();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public DarkAuth(String appId, String secret) {
        this(appId, secret, "1.0.0", "");
    }

    public static String generateHWID() {
        try {
            String raw = System.getProperty("os.name") + ":" +
                         System.getProperty("user.name") + ":" +
                         Runtime.getRuntime().availableProcessors();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return "JAVA_DEFAULT_HWID";
        }
    }

    private String post(String endpoint, String jsonBody) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl + "/" + endpoint.replaceFirst("^/+", "")))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }

    public String init() throws Exception {
        String json = String.format("{\"app_id\":\"%s\",\"secret\":\"%s\",\"version\":\"%s\"}", appId, secret, version);
        String res = post("/init", json);
        // Simple extraction of session_token
        int idx = res.indexOf("\"session_token\":\"");
        if (idx != -1) {
            idx += 17;
            int end = res.indexOf("\"", idx);
            this.sessionToken = res.substring(idx, end);
        }
        return res;
    }

    public String license(String key) throws Exception {
        if (this.sessionToken == null) init();
        String json = String.format("{\"session_token\":\"%s\",\"key\":\"%s\",\"hwid\":\"%s\"}", sessionToken, key, hwid);
        return post("/license", json);
    }

    public String login(String username, String password) throws Exception {
        if (this.sessionToken == null) init();
        String json = String.format("{\"session_token\":\"%s\",\"username\":\"%s\",\"password\":\"%s\",\"hwid\":\"%s\"}", sessionToken, username, password, hwid);
        return post("/login", json);
    }

    public String register(String username, String password, String key) throws Exception {
        if (this.sessionToken == null) init();
        String json = String.format("{\"session_token\":\"%s\",\"username\":\"%s\",\"password\":\"%s\",\"key\":\"%s\",\"hwid\":\"%s\"}", sessionToken, username, password, key, hwid);
        return post("/register", json);
    }

    public String getVar(String name) throws Exception {
        String json = String.format("{\"session_token\":\"%s\",\"name\":\"%s\"}", sessionToken, name);
        String res = post("/var/get", json);
        int idx = res.indexOf("\"value\":\"");
        if (idx != -1) {
            idx += 9;
            int end = res.indexOf("\"", idx);
            return res.substring(idx, end);
        }
        return null;
    }

    public String getSessionToken() { return sessionToken; }
    public String getHwid() { return hwid; }
}
