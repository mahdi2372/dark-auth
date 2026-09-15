package com.darkauth;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * DARK-AUTH Official Java SDK v2.0.0
 */
public class DarkAuth {
    private final String appId;
    private final String secret;
    private final String version;
    private final String apiUrl;
    private String sessionToken;
    private final String hwid;
    private final HttpClient httpClient;
    private Map<String, Object> user;

    public DarkAuth(String appId, String secret, String apiUrl, String version) {
        this.appId = appId;
        this.secret = secret;
        this.version = version != null ? version : "2.0.0";
        this.apiUrl = apiUrl.replaceAll("/+$", "");
        this.hwid = generateHWID();
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();
    }

    public DarkAuth(String appId, String secret, String apiUrl) {
        this(appId, secret, apiUrl, "2.0.0");
    }

    /**
     * Generate a hardware fingerprint from system properties.
     */
    public static String generateHWID() {
        try {
            String raw = System.getProperty("os.name", "") + ":" +
                         System.getProperty("os.arch", "") + ":" +
                         System.getProperty("user.name", "") + ":" +
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
            return "java_default_hwid";
        }
    }

    /**
     * Compute SHA-256 hash of a file for integrity checking.
     */
    public static String computeFileHash(String filePath) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[8192];
        try (java.io.FileInputStream fis = new java.io.FileInputStream(filePath)) {
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }
        }
        byte[] hash = digest.digest();
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    private String url(String endpoint) {
        return apiUrl + "/api/v2/" + endpoint.replaceFirst("^/+", "");
    }

    private String post(String endpoint, String jsonBody) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url(endpoint)))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(15))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }

    private String get(String endpoint, Map<String, String> params) throws Exception {
        String queryString = params.entrySet().stream()
                .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "=" +
                          URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url(endpoint) + "?" + queryString))
                .GET()
                .timeout(Duration.ofSeconds(15))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }

    private String extractField(String json, String field) {
        String needle = "\"" + field + "\":\"";
        int idx = json.indexOf(needle);
        if (idx != -1) {
            idx += needle.length();
            int end = json.indexOf("\"", idx);
            if (end != -1) return json.substring(idx, end);
        }
        return null;
    }

    private boolean extractBool(String json, String field) {
        return json.contains("\"" + field + "\":true");
    }

    private void ensureSession() throws Exception {
        if (sessionToken == null) init();
    }

    /**
     * Initialize session with the DARK-AUTH API.
     */
    public String init() throws Exception {
        String json = String.format(
            "{\"app_id\":\"%s\",\"secret\":\"%s\",\"version\":\"%s\"}",
            appId, secret, version
        );
        String res = post("/init", json);
        this.sessionToken = extractField(res, "session_token");
        return res;
    }

    /**
     * Initialize with a binary integrity hash.
     */
    public String init(String binaryHash) throws Exception {
        String json;
        if (binaryHash != null && !binaryHash.isEmpty()) {
            json = String.format(
                "{\"app_id\":\"%s\",\"secret\":\"%s\",\"version\":\"%s\",\"hash\":\"%s\"}",
                appId, secret, version, binaryHash
            );
        } else {
            json = String.format(
                "{\"app_id\":\"%s\",\"secret\":\"%s\",\"version\":\"%s\"}",
                appId, secret, version
            );
        }
        String res = post("/init", json);
        this.sessionToken = extractField(res, "session_token");
        return res;
    }

    /**
     * Authenticate with a license key.
     */
    public String license(String key) throws Exception {
        ensureSession();
        return post("/license", String.format(
            "{\"session_token\":\"%s\",\"key\":\"%s\",\"hwid\":\"%s\"}",
            sessionToken, key.trim(), hwid
        ));
    }

    /**
     * Log in with username and password.
     */
    public String login(String username, String password) throws Exception {
        ensureSession();
        return post("/login", String.format(
            "{\"session_token\":\"%s\",\"username\":\"%s\",\"password\":\"%s\",\"hwid\":\"%s\"}",
            sessionToken, username, password, hwid
        ));
    }

    /**
     * Register a new account with a license key.
     */
    public String register(String username, String password, String key) throws Exception {
        ensureSession();
        return post("/register", String.format(
            "{\"session_token\":\"%s\",\"username\":\"%s\",\"password\":\"%s\",\"key\":\"%s\",\"hwid\":\"%s\"}",
            sessionToken, username, password, key.trim(), hwid
        ));
    }

    /**
     * Check if the current session is valid.
     */
    public boolean check() {
        if (sessionToken == null) return false;
        try {
            String res = post("/check", "{\"session_token\":\"" + sessionToken + "\"}");
            return extractBool(res, "success");
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get a cloud variable value.
     */
    public String getVar(String name) throws Exception {
        ensureSession();
        String res = post("/var/get", String.format(
            "{\"session_token\":\"%s\",\"name\":\"%s\"}", sessionToken, name
        ));
        return extractField(res, "value");
    }

    /**
     * Set a cloud variable value.
     */
    public String setVar(String name, String value) throws Exception {
        ensureSession();
        return post("/var/set", String.format(
            "{\"session_token\":\"%s\",\"name\":\"%s\",\"value\":\"%s\"}",
            sessionToken, name, value
        ));
    }

    /**
     * Send a log entry.
     */
    public String log(String message, String level) throws Exception {
        ensureSession();
        if (level == null || level.isEmpty()) level = "INFO";
        return post("/log", String.format(
            "{\"session_token\":\"%s\",\"message\":\"%s\",\"level\":\"%s\"}",
            sessionToken, message, level
        ));
    }

    /**
     * Request a HWID reset for a key.
     */
    public String resetHWID(String key) throws Exception {
        ensureSession();
        return post("/hwid/reset", String.format(
            "{\"session_token\":\"%s\",\"key\":\"%s\"}", sessionToken, key
        ));
    }

    /**
     * Get chat messages from a channel.
     */
    public String getChat(String channel) throws Exception {
        ensureSession();
        if (channel == null || channel.isEmpty()) channel = "general";
        Map<String, String> params = new LinkedHashMap<>();
        params.put("session_token", sessionToken);
        params.put("channel", channel);
        return get("/chat", params);
    }

    /**
     * Send a chat message.
     */
    public String sendChat(String sender, String message, String channel) throws Exception {
        ensureSession();
        if (channel == null || channel.isEmpty()) channel = "general";
        return post("/chat", String.format(
            "{\"session_token\":\"%s\",\"channel\":\"%s\",\"sender\":\"%s\",\"message\":\"%s\"}",
            sessionToken, channel, sender, message
        ));
    }

    /** Get the current session token. */
    public String getSessionToken() { return sessionToken; }

    /** Get the hardware identifier. */
    public String getHwid() { return hwid; }
}
