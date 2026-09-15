<?php
/**
 * DARK-AUTH Official PHP SDK v2.0.0
 *
 * Client library for the DARK-AUTH V2 API.
 * Supports: Init, License Auth, User Login/Register, Cloud Variables, Chat, Logging, HWID lock.
 */

namespace DarkAuth;

class DarkAuth
{
    private string $appId;
    private string $secret;
    private string $version;
    private string $apiUrl;
    private ?string $sessionToken = null;
    private string $hwid;
    private ?array $user = null;
    private ?array $licenseInfo = null;

    const SDK_VERSION = "2.0.0";

    public function __construct(string $appId, string $secret, string $apiUrl, string $version = self::SDK_VERSION)
    {
        $this->appId = $appId;
        $this->secret = $secret;
        $this->version = $version;
        $this->apiUrl = rtrim($apiUrl, "/");
        $this->hwid = $this->generateHWID();
    }

    /**
     * Generate a hardware fingerprint from server information.
     */
    private function generateHWID(): string
    {
        $components = [
            php_uname('n'),
            php_uname('m'),
            php_uname('s'),
            php_uname('v'),
        ];

        if (isset($_SERVER['SERVER_ADDR'])) {
            $components[] = $_SERVER['SERVER_ADDR'];
        }

        if (function_exists('gethostname')) {
            $components[] = gethostname();
        }

        $raw = implode(':', $components);
        return hash('sha256', $raw);
    }

    /**
     * Compute SHA-256 hash of a file.
     */
    public static function computeFileHash(string $filePath): string
    {
        return hash_file('sha256', $filePath);
    }

    /**
     * Build the full URL for an API v2 endpoint.
     */
    private function url(string $endpoint): string
    {
        return $this->apiUrl . '/api/v2/' . ltrim($endpoint, '/');
    }

    /**
     * Send a POST request to the API.
     */
    private function post(string $endpoint, array $data): array
    {
        $ch = curl_init($this->url($endpoint));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($data),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($ch);
        $err = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($err) {
            throw new \Exception("cURL Error: " . $err);
        }

        $decoded = json_decode($response, true);
        if (!$decoded || !isset($decoded['success']) || !$decoded['success']) {
            $msg = $decoded['message'] ?? 'Request failed';
            $code = $decoded['code'] ?? 'ERROR';
            throw new \Exception("[$code] $msg");
        }

        return $decoded;
    }

    /**
     * Send a GET request to the API.
     */
    private function get(string $endpoint, array $params): array
    {
        $queryString = http_build_query($params);
        $url = $this->url($endpoint) . '?' . $queryString;

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPGET        => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            throw new \Exception("cURL Error: " . $err);
        }

        $decoded = json_decode($response, true);
        return $decoded ?: [];
    }

    /**
     * Ensure a session token exists.
     */
    private function ensureSession(): void
    {
        if (!$this->sessionToken) {
            $this->init();
        }
    }

    /**
     * Initialize a session with the DARK-AUTH API.
     */
    public function init(?string $hash = null): array
    {
        $payload = [
            'app_id'  => $this->appId,
            'secret'  => $this->secret,
            'version' => $this->version,
        ];
        if ($hash !== null) {
            $payload['hash'] = $hash;
        }

        $res = $this->post('/init', $payload);
        $this->sessionToken = $res['session_token'] ?? null;
        return $res;
    }

    /**
     * Authenticate with a license key.
     */
    public function license(string $key): array
    {
        $this->ensureSession();
        $res = $this->post('/license', [
            'session_token' => $this->sessionToken,
            'key'           => trim($key),
            'hwid'          => $this->hwid,
        ]);
        $this->licenseInfo = $res;
        $this->user = $res['user'] ?? null;
        return $res;
    }

    /**
     * Log in with username and password.
     */
    public function login(string $username, string $password): array
    {
        $this->ensureSession();
        $res = $this->post('/login', [
            'session_token' => $this->sessionToken,
            'username'      => $username,
            'password'      => $password,
            'hwid'          => $this->hwid,
        ]);
        $this->user = $res['user'] ?? null;
        return $res;
    }

    /**
     * Register a new account with a license key.
     */
    public function register(string $username, string $password, string $key): array
    {
        $this->ensureSession();
        $res = $this->post('/register', [
            'session_token' => $this->sessionToken,
            'username'      => $username,
            'password'      => $password,
            'key'           => trim($key),
            'hwid'          => $this->hwid,
        ]);
        $this->user = $res['user'] ?? null;
        return $res;
    }

    /**
     * Check if the current session is still valid.
     */
    public function check(): bool
    {
        if (!$this->sessionToken) return false;
        try {
            $res = $this->post('/check', ['session_token' => $this->sessionToken]);
            return (bool) ($res['success'] ?? false);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get a cloud variable value.
     */
    public function getVar(string $name): ?string
    {
        $this->ensureSession();
        $res = $this->post('/var/get', [
            'session_token' => $this->sessionToken,
            'name'          => $name,
        ]);
        return $res['value'] ?? null;
    }

    /**
     * Set a cloud variable value.
     */
    public function setVar(string $name, string $value): array
    {
        $this->ensureSession();
        return $this->post('/var/set', [
            'session_token' => $this->sessionToken,
            'name'          => $name,
            'value'         => $value,
        ]);
    }

    /**
     * Send a log entry to the API.
     */
    public function log(string $message, string $level = 'INFO'): array
    {
        $this->ensureSession();
        return $this->post('/log', [
            'session_token' => $this->sessionToken,
            'message'       => $message,
            'level'         => $level,
        ]);
    }

    /**
     * Request a HWID reset for a key.
     */
    public function resetHWID(string $key): array
    {
        $this->ensureSession();
        return $this->post('/hwid/reset', [
            'session_token' => $this->sessionToken,
            'key'           => $key,
        ]);
    }

    /**
     * Get chat messages from a channel.
     */
    public function getChat(string $channel = 'general'): array
    {
        $this->ensureSession();
        $res = $this->get('/chat', [
            'session_token' => $this->sessionToken,
            'channel'       => $channel,
        ]);
        return $res['messages'] ?? [];
    }

    /**
     * Send a chat message.
     */
    public function sendChat(string $sender, string $message, string $channel = 'general'): array
    {
        $this->ensureSession();
        return $this->post('/chat', [
            'session_token' => $this->sessionToken,
            'channel'       => $channel,
            'sender'        => $sender,
            'message'       => $message,
        ]);
    }

    /**
     * Get the current session token.
     */
    public function getSessionToken(): ?string
    {
        return $this->sessionToken;
    }

    /**
     * Get the hardware identifier.
     */
    public function getHwid(): string
    {
        return $this->hwid;
    }
}
