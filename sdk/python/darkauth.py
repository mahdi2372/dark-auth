"""
DARK-AUTH Official Python SDK v2.0.0
=====================================
Client library for the DARK-AUTH V2 API.
Supports: Init, License Auth, User Login/Register, Cloud Variables, Chat, Logging, HWID lock.
"""

import hashlib
import platform
import subprocess
import uuid
import requests

VERSION = "2.0.0"


class DarkAuth:
    """Main DARK-AUTH client for Python."""

    def __init__(self, app_id: str, secret: str, api_url: str, version: str = VERSION):
        self.app_id = app_id
        self.secret = secret
        self.version = version
        self.api_url = api_url.rstrip("/")
        self.session_token = None
        self.hwid = self.generate_hwid()
        self.user = None
        self.license_info = None

    @staticmethod
    def generate_hwid() -> str:
        """Generate a hardware fingerprint using platform-specific identifiers."""
        components = [platform.node(), platform.machine(), platform.processor()]
        try:
            components.append(hex(uuid.getnode()))
        except Exception:
            pass
        if platform.system() == "Windows":
            try:
                out = subprocess.check_output(
                    "wmic csproduct get uuid", shell=True
                ).decode()
                lines = [line.strip() for line in out.splitlines() if line.strip()]
                if len(lines) > 1:
                    components.append(lines[1])
            except Exception:
                pass
        elif platform.system() == "Linux":
            try:
                with open("/etc/machine-id") as f:
                    components.append(f.read().strip())
            except Exception:
                pass
        elif platform.system() == "Darwin":
            try:
                out = subprocess.check_output(
                    ["ioreg", "-rd1", "-c", "IOPlatformExpertDevice"]
                ).decode()
                for line in out.splitlines():
                    if "IOPlatformUUID" in line:
                        components.append(line.split('"')[-2])
                        break
            except Exception:
                pass
        return hashlib.sha256(":".join(components).encode()).hexdigest()

    @staticmethod
    def file_hash(file_path: str) -> str:
        """Calculate SHA-256 hash of a file for binary integrity checking."""
        h = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()

    def _post(self, endpoint: str, data: dict) -> dict:
        """Send a POST request to the DARK-AUTH V2 API."""
        url = f"{self.api_url}/api/v2/{endpoint.lstrip('/')}"
        resp = requests.post(url, json=data, timeout=15)
        resp.raise_for_status()
        result = resp.json()
        if not result.get("success"):
            raise Exception(
                f"[{result.get('code', 'ERROR')}] {result.get('message', 'Request failed')}"
            )
        return result

    def _get(self, endpoint: str, params: dict) -> dict:
        """Send a GET request to the DARK-AUTH V2 API."""
        url = f"{self.api_url}/api/v2/{endpoint.lstrip('/')}"
        resp = requests.get(url, params=params, timeout=15)
        resp.raise_for_status()
        return resp.json()

    def init(self, binary_path: str = None) -> dict:
        """Initialize session, check for updates, and verify binary integrity."""
        data = {
            "app_id": self.app_id,
            "secret": self.secret,
            "version": self.version,
        }
        if binary_path:
            data["hash"] = self.file_hash(binary_path)
        res = self._post("/init", data)
        self.session_token = res.get("session_token")
        return res

    def license(self, key: str) -> dict:
        """Authenticate directly with a license key."""
        if not self.session_token:
            self.init()
        data = {
            "session_token": self.session_token,
            "key": key.strip(),
            "hwid": self.hwid,
        }
        res = self._post("/license", data)
        self.license_info = res
        self.user = res.get("user")
        return res

    def login(self, username: str, password: str) -> dict:
        """Authenticate with an existing user account."""
        if not self.session_token:
            self.init()
        data = {
            "session_token": self.session_token,
            "username": username,
            "password": password,
            "hwid": self.hwid,
        }
        res = self._post("/login", data)
        self.user = res.get("user")
        return res

    def register(self, username: str, password: str, key: str) -> dict:
        """Register a new account with a license key."""
        if not self.session_token:
            self.init()
        data = {
            "session_token": self.session_token,
            "username": username,
            "password": password,
            "key": key.strip(),
            "hwid": self.hwid,
        }
        res = self._post("/register", data)
        self.user = res.get("user")
        return res

    def check(self) -> bool:
        """Check if the active session is still valid."""
        if not self.session_token:
            return False
        try:
            res = self._post("/check", {"session_token": self.session_token})
            return res.get("success", False)
        except Exception:
            return False

    def get_var(self, name: str) -> str:
        """Fetch a remote cloud variable."""
        res = self._post("/var/get", {"session_token": self.session_token, "name": name})
        return res.get("value")

    def set_var(self, name: str, value: str) -> dict:
        """Set a cloud variable."""
        return self._post(
            "/var/set",
            {"session_token": self.session_token, "name": name, "value": value},
        )

    def log(self, message: str, level: str = "INFO") -> dict:
        """Send a telemetry or error log entry."""
        return self._post(
            "/log",
            {"session_token": self.session_token, "message": message, "level": level},
        )

    def reset_hwid(self, key: str) -> dict:
        """Request a HWID reset for a license key."""
        return self._post(
            "/hwid/reset", {"session_token": self.session_token, "key": key}
        )

    def get_chat(self, channel: str = "general") -> list:
        """Retrieve chat messages from a channel."""
        res = self._get(
            "/chat",
            {"session_token": self.session_token, "channel": channel},
        )
        return res.get("messages", [])

    def send_chat(self, sender: str, message: str, channel: str = "general") -> dict:
        """Send a chat message to a channel."""
        return self._post(
            "/chat",
            {
                "session_token": self.session_token,
                "channel": channel,
                "sender": sender,
                "message": message,
            },
        )
