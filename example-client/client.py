"""
DARK-AUTH Example Python Client
================================
Demonstrates:
  - License activation with HWID binding
  - License verification
  - Update check
  - Activation token verification

Usage:
  pip install requests
  python client.py
"""

import os
import requests
import json
from hwid import get_hwid

# ============================================
# Configuration — change these
# ============================================
API_BASE = os.environ.get("DARK_AUTH_API_URL", "http://localhost:5000/api")
APP_ID = "app_your_app_id_here"  # Your application's public app_id
LICENSE_KEY = "XXXXX-XXXXX-XXXXX-XXXXX"  # User's license key
CURRENT_VERSION = "1.0.0"  # Client's current version


class DarkAuthClient:
    """Client SDK for DARK-AUTH licensing platform."""

    def __init__(self, api_base, app_id):
        self.api_base = api_base.rstrip("/")
        self.app_id = app_id
        self.activation_token = None
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def activate(self, license_key, hwid=None):
        """
        Activate this client with a license key.
        Optionally binds to hardware ID for anti-piracy.

        Returns:
            dict: activation result with token
        """
        payload = {
            "licenseKey": license_key,
            "appId": self.app_id,
        }
        if hwid:
            payload["hwid"] = hwid

        resp = self.session.post(f"{self.api_base}/client/activate", json=payload)
        data = resp.json()

        if data.get("success"):
            self.activation_token = data.get("activationToken")
            print(f"✅ Activation successful!")
            print(f"   Token: {self.activation_token}")
            print(f"   License: {data.get('license', {}).get('key')}")
            print(f"   Type: {data.get('license', {}).get('type')}")
            print(f"   Expires: {data.get('license', {}).get('expiresAt', 'Never')}")
        else:
            print(f"❌ Activation failed: {data.get('message')}")

        return data

    def verify_license(self, license_key, hwid=None):
        """
        Verify a license key is still valid.

        Returns:
            dict: verification result
        """
        payload = {
            "licenseKey": license_key,
            "appId": self.app_id,
        }
        if hwid:
            payload["hwid"] = hwid

        resp = self.session.post(f"{self.api_base}/licenses/verify", json=payload)
        data = resp.json()

        if data.get("valid"):
            print(f"✅ License is valid!")
            print(f"   Status: {data.get('license', {}).get('status')}")
            print(f"   Expires: {data.get('license', {}).get('expiresAt', 'Never')}")
        else:
            print(f"❌ License invalid: {data.get('message')}")

        return data

    def verify_activation(self, activation_token=None):
        """
        Verify an activation token is still valid.

        Returns:
            dict: activation verification result
        """
        token = activation_token or self.activation_token
        if not token:
            print("❌ No activation token available")
            return {"valid": False, "message": "No token"}

        resp = self.session.post(
            f"{self.api_base}/client/verify-activation",
            json={"activationToken": token},
        )
        data = resp.json()

        if data.get("valid"):
            print(f"✅ Activation is valid!")
            print(f"   App: {data.get('app', {}).get('name')}")
        else:
            print(f"❌ Activation invalid: {data.get('message')}")

        return data

    def check_update(self, current_version):
        """
        Check if a newer version is available.

        Returns:
            dict: update check result
        """
        resp = self.session.get(
            f"{self.api_base}/client/check-update",
            params={"appId": self.app_id, "currentVersion": current_version},
        )
        data = resp.json()

        if data.get("needsUpdate"):
            print(f"🔄 Update available!")
            print(f"   Current: {current_version}")
            print(f"   Latest:  {data.get('latestVersion')}")
            print(f"   Notes:   {data.get('releaseNotes', 'N/A')}")
            if data.get("downloadUrl"):
                print(f"   Download: {data['downloadUrl']}")
        else:
            print(f"✅ Already up to date ({current_version})")

        return data

    def get_latest_version(self):
        """
        Get latest version metadata.

        Returns:
            dict: version info
        """
        resp = self.session.get(f"{self.api_base}/client/latest-version/{self.app_id}")
        data = resp.json()
        print(f"📦 Latest version: {data.get('version', 'N/A')}")
        return data


def main():
    print("=" * 50)
    print("  DARK-AUTH Client Example")
    print("=" * 50)
    print()

    # Initialize client
    client = DarkAuthClient(API_BASE, APP_ID)

    # Collect HWID
    hwid = get_hwid()
    print(f"🖥️  Hardware ID: {hwid}")
    print()

    # Step 1: Verify license
    print("--- Step 1: Verify License ---")
    client.verify_license(LICENSE_KEY, hwid)
    print()

    # Step 2: Activate client
    print("--- Step 2: Activate Client ---")
    result = client.activate(LICENSE_KEY, hwid)
    print()

    # Step 3: Verify activation token
    if result.get("success"):
        print("--- Step 3: Verify Activation ---")
        client.verify_activation()
        print()

    # Step 4: Check for updates
    print("--- Step 4: Check for Updates ---")
    client.check_update(CURRENT_VERSION)
    print()

    # Step 5: Get latest version info
    print("--- Step 5: Latest Version Info ---")
    client.get_latest_version()
    print()


if __name__ == "__main__":
    main()
