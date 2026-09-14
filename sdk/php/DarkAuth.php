<?php
/**
 * DARK-AUTH Official PHP SDK
 * Suitable for web apps, member areas, licensing scripts, and PHP CLI tools.
 */

namespace DarkAuth;

class DarkAuth {
    private string $appId;
    private string $secret;
    private string $version;
    private string $apiUrl;
    private ?string $sessionToken = null;
    private string $hwid;

    public function __construct(string $appId, string $secret, string $apiUrl, string $version = "1.0.0") {
        $this->appId = $appId;
        $this->secret = $secret;
        $this->version = $version;
        $this->apiUrl = rtrim($apiUrl, "/");
        $this->hwid = $this->generateHWID();
    }

    private function generateHWID(): string {
        $serverInfo = php_uname() . ':' . ($_SERVER['SERVER_ADDR'] ?? '127.0.0.1');
        return hash('sha256', $serverInfo);
    }

    private function post(string $endpoint, array $data): array {
        $url = $this->apiUrl . '/' . ltrim($endpoint, '/');
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $response = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            throw new \Exception("cURL Error: " . $err);
        }

        $decoded = json_decode($response, true);
        if (!$decoded || !($decoded['success'] ?? false)) {
            $msg = $decoded['message'] ?? 'Request failed';
            $code = $decoded['code'] ?? 'ERROR';
            throw new \Exception("[$code] $msg");
        }

        return $decoded;
    }

    public function init(?string $hash = null): array {
        $res = $this->post('/init', [
            'app_id' => $this->appId,
            'secret' => $this->secret,
            'version' => $this->version,
            'hash' => $hash,
        ]);
        $this->sessionToken = $res['session_token'] ?? null;
        return $res;
    }

    public function license(string $key): array {
        if (!$this->sessionToken) $this->init();
        return $this->post('/license', [
            'session_token' => $this->sessionToken,
            'key' => trim($key),
            'hwid' => $this->hwid,
        ]);
    }

    public function login(string $username, string $password): array {
        if (!$this->sessionToken) $this->init();
        return $this->post('/login', [
            'session_token' => $this->sessionToken,
            'username' => $username,
            'password' => $password,
            'hwid' => $this->hwid,
        ]);
    }

    public function register(string $username, string $password, string $key): array {
        if (!$this->sessionToken) $this->init();
        return $this->post('/register', [
            'session_token' => $this->sessionToken,
            'username' => $username,
            'password' => $password,
            'key' => trim($key),
            'hwid' => $this->hwid,
        ]);
    }

    public function check(): bool {
        if (!$this->sessionToken) return false;
        try {
            $res = $this->post('/check', ['session_token' => $this->sessionToken]);
            return (bool)($res['success'] ?? false);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function getVar(string $name): ?string {
        $res = $this->post('/var/get', [
            'session_token' => $this->sessionToken,
            'name' => $name,
        ]);
        return $res['value'] ?? null;
    }

    public function log(string $message, string $level = 'INFO'): array {
        return $this->post('/log', [
            'session_token' => $this->sessionToken,
            'message' => $message,
            'level' => $level,
        ]);
    }
}
