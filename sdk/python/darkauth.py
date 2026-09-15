"""
DARK-AUTH Official Python SDK
=============================
KeyAuth / Authly compatible client library.
Supports: Init, License Auth, User Login/Register, Cloud Variables, Chat, Logging, HWID lock.
"""

import hashlib
import platform
import subprocess
import uuid
import requests


class DarkAuth:
    def __init__(self, app_id: str, secret: str, api_url: str, version: str = "1.0.0"):
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
        """Collect stable hardware identifiers and return SHA-256 fingerprint."""
        components = [platform.node(), platform.machine(), platform.processor()]
        try:
            mac = hex(uuid.getnode())
            components.append(mac)
        except Exception:
            pass

        if platform.system() == "Windows":
            try:
                out = subprocess.check_output("wmic csproduct get uuid", shell=True).decode()
                lines = [l.strip() for l in out.splitlines() if l.strip()]
                if len(lines) > 1:
                    components.append(lines[1])
            except Exception:
                pass

        raw = ":".join(components)
        return hashlib.sha256(raw.encode()).hexdigest()

    @staticmethod
    def file_hash(file_path: str) -> str:
        """Calculate SHA-256 of file for binary integrity anti-tamper checking."""
        h = hashlib.sha256()
        with open(file_path, "rb") as f:
            while chunk := f.read(8192):
                h.update(chunk)
        return h.hexdigest()

    def _post(self, endpoint: str, data: dict) -> dict:
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        resp = requests.post(url, json=data, timeout=15)
        res_json = resp.json()
        if not res_json.get("success"):
            raise Exception(f"[{res_json.get('code', 'ERROR')}] {res_json.get('message', 'Request failed')}")
        return res_json

    def init(self, binary_path: str = None) -> dict:
        """Initialize session and check for software updates and anti-tamper hash."""
        h = self.file_hash(binary_path) if binary_path else None
        data = {
            "app_id": self.app_id,
            "secret": self.secret,
            "version": self.version,
            "hash": h,
        }
        res = self._post("/init", data)
        self.session_token = res.get("session_token")
        return res

    def license(self, key: str) -> dict:
        """Authenticate directly with a license key (KeyAuth style)."""
        if not self.session_token:
            self.init()
        data = {
            "session_token": self.session_token,
            "key": key.strip(),
            "hwid": self.hwid,
        }
        res = self._post("/license", data)
        self.license_info = res
        return res

    def login(self, username: str, password: str) -> dict:
        """Authenticate with existing user account."""
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
        """Check if active session is still valid."""
        if not self.session_token:
            return False
        try:
            res = self._post("/check", {"session_token": self.session_token})
            return res.get("success", False)
        except Exception:
            return False

    def get_var(self, name: str) -> str:
        """Fetch remote cloud variable securely at runtime."""
        res = self._post("/var/get", {"session_token": self.session_token, "name": name})
        return res.get("value")

    def set_var(self, name: str, value: str) -> dict:
        """Modify user-writeable cloud variable."""
        return self._post("/var/set", {"session_token": self.session_token, "name": name, "value": value})

    def log(self, message: str, level: str = "INFO") -> dict:
        """Stream telemetry or error logs to the developer dashboard."""
        return self._post("/log", {"session_token": self.session_token, "message": message, "level": level})

    def reset_hwid(self, key: str) -> dict:
        """Request HWID reset for a key."""
        return self._post("/hwid/reset", {"session_token": self.session_token, "key": key})

    def get_chat(self, channel: str = "general") -> list:
        """Retrieve recent in-app chat or announcements."""
        url = f"{self.api_url}/chat?session_token={self.session_token}&channel={channel}"
        resp = requests.get(url, timeout=10)
        return resp.json().get("messages", [])

    def send_chat(self, sender: str, message: str, channel: str = "general") -> dict:
        """Broadcast an in-app chat message."""
        return self._post("/chat", {
            "session_token": self.session_token,
            "channel": channel,
            "sender": sender,
            "message": message,
        })
