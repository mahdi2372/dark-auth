"""
DARK-AUTH Windows EXE Client
=============================
Full client application with:
  - Windows SID (Hardware ID) grabber
  - V2 API init + license login
  - Version, Owner, Secret, API integration
  - Auto HWID binding

Usage:
  pip install requests
  python darkauth_client.py

Build to EXE:
  pip install pyinstaller
  pyinstaller --onefile --name DarkAuth darkauth_client.py
"""

import os
import sys
import json
import hashlib
import platform
import subprocess
import time

try:
    import requests
except ImportError:
    print("[!] requests library not found. Installing...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

# ============================================================
# CONFIGURATION — Edit these values for your application
# ============================================================
APP_OWNER = "DARK-AUTH"
APP_NAME = "DARK-AUTH Client"
APP_VERSION = "1.0.0"

API_URL = "https://darkauth.vercel.app/api"
APP_ID = "app_your_app_id_here"         # Replace with your app's App ID
APP_SECRET = "secret_your_secret_here"  # Replace with your app's Secret Key
LICENSE_KEY = "XXXXX-XXXXX-XXXXX-XXXXX"  # Replace or enter at runtime

# ============================================================
# COLOR CODES
# ============================================================
class C:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    GRAY = '\033[90m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'


# ============================================================
# WINDOWS SID GRABBER
# ============================================================
def get_windows_sid():
    """Get the Windows Security Identifier (SID) as Hardware ID."""
    try:
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command",
             "([System.Security.Principal.WindowsIdentity]::GetCurrent()).User.Value"],
            capture_output=True, text=True, timeout=10,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
        )
        sid = result.stdout.strip()
        if sid and sid.startswith("S-1-5-"):
            return sid
    except Exception:
        pass

    # Fallback: use hardware fingerprint
    return get_hardware_hwid()


def get_hardware_hwid():
    """Fallback HWID from hardware components (cross-platform)."""
    components = []
    try:
        if sys.platform == "win32":
            r = subprocess.run(["wmic", "cpu", "get", "ProcessorId"],
                             capture_output=True, text=True, timeout=5)
            lines = [l.strip() for l in r.stdout.strip().split("\n") if l.strip()]
            if len(lines) > 1:
                components.append(lines[1])
        else:
            components.append(platform.processor())
    except Exception:
        components.append(platform.processor())

    try:
        import uuid
        mac = uuid.getnode()
        components.append(':'.join(f'{(mac >> i) & 0xff:02x}' for i in range(40, -1, -8)))
    except Exception:
        pass

    try:
        if sys.platform == "win32":
            r = subprocess.run(["wmic", "diskdrive", "get", "SerialNumber"],
                             capture_output=True, text=True, timeout=5)
            lines = [l.strip() for l in r.stdout.strip().split("\n") if l.strip()]
            if len(lines) > 1:
                components.append(lines[1])
    except Exception:
        pass

    components.append(platform.node())
    components.append(platform.system())
    components.append(platform.machine())

    raw = "|".join(str(c) for c in components)
    return hashlib.sha256(raw.encode()).hexdigest()


# ============================================================
# API CLIENT
# ============================================================
class DarkAuthClient:
    def __init__(self, api_url, app_id, app_secret):
        self.api_url = api_url.rstrip("/")
        self.app_id = app_id
        self.app_secret = app_secret
        self.session_token = None
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})

    def init(self, version="1.0.0"):
        """Step 1: Handshake with server."""
        try:
            resp = self.session.post(f"{self.api_url}/v2/init", json={
                "app_id": self.app_id,
                "secret": self.app_secret,
                "version": version,
            }, timeout=15)
            data = resp.json()
            if data.get("success"):
                self.session_token = data.get("session_token")
                return True, data
            return False, data
        except requests.exceptions.ConnectionError:
            return False, {"message": "Cannot connect to server. Check your internet."}
        except Exception as e:
            return False, {"message": str(e)}

    def license_login(self, key, hwid):
        """Step 2: Login with license key."""
        if not self.session_token:
            return False, {"message": "No session. Call init() first."}
        try:
            resp = self.session.post(f"{self.api_url}/v2/license", json={
                "session_token": self.session_token,
                "key": key,
                "hwid": hwid,
            }, timeout=15)
            data = resp.json()
            return data.get("success", False), data
        except Exception as e:
            return False, {"message": str(e)}

    def verify_activate(self, license_key, hwid):
        """Fallback: Direct V1 activation."""
        try:
            resp = self.session.post(f"{self.api_url}/client/activate", json={
                "licenseKey": license_key,
                "appId": self.app_id,
                "hwid": hwid,
            }, timeout=15)
            data = resp.json()
            if data.get("success"):
                return True, data
            return False, data
        except Exception as e:
            return False, {"message": str(e)}

    def verify_token(self, token):
        """Verify an activation token."""
        try:
            resp = self.session.post(f"{self.api_url}/client/verify-activation", json={
                "activationToken": token,
            }, timeout=15)
            return resp.json()
        except Exception:
            return {"valid": False}


# ============================================================
# UI
# ============================================================
def print_banner():
    os.system('cls' if os.name == 'nt' else 'clear')
    print(f"""
{C.RED}{C.BOLD}    ╔══════════════════════════════════════════════════╗
    ║                                                  ║
    ║   ██████╗  █████╗ ███████╗██╗  ██╗██████╗  ██████╗  ║
    ║   ██╔══██╗██╔══██╗██╔════╝██║ ██╔╝██╔══██╗██╔═══██╗ ║
    ║   ██║  ██║███████║███████╗█████╔╝ ██████╔╝██║   ██║ ║
    ║   ██║  ██║██╔══██║╚════██║██╔═██╗ ██╔══██╗██║   ██║ ║
    ║   ██████╔╝██║  ██║███████║██║  ██╗██║  ██║╚██████╔╝ ║
    ║   ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ║
    ║                                                  ║
    ╚══════════════════════════════════════════════════╝{C.RESET}
{C.GRAY}    v{APP_VERSION} | {APP_OWNER} Licensing Platform{C.RESET}
""")


def print_section(title):
    print(f"\n  {C.CYAN}{C.BOLD}{'─' * 44}{C.RESET}")
    print(f"  {C.CYAN}{C.BOLD}  {title}{C.RESET}")
    print(f"  {C.CYAN}{C.BOLD}{'─' * 44}{C.RESET}\n")


def print_ok(msg):
    print(f"  {C.GREEN}✓{C.RESET} {msg}")


def print_err(msg):
    print(f"  {C.RED}✗{C.RESET} {msg}")


def print_info(label, value):
    print(f"  {C.GRAY}{label}:{C.RESET} {C.WHITE}{value}{C.RESET}")


# ============================================================
# MAIN
# ============================================================
def main():
    print_banner()

    # --- Step 1: Grab SID ---
    print_section("Step 1: Hardware ID Detection")
    print(f"  {C.DIM}Grabbing Windows SID...{C.RESET}")

    hwid = get_windows_sid()
    is_sid = hwid.startswith("S-1-5-")

    if is_sid:
        print_ok(f"Windows SID detected!")
    else:
        print_ok(f"Hardware fingerprint generated (fallback)")
    print_info("HWID", hwid)
    print()

    # Copy to clipboard
    try:
        import subprocess
        process = subprocess.Popen(['clip'], stdin=subprocess.PIPE)
        process.communicate(hwid.encode('utf-16le'))
        print_ok("Copied to clipboard!")
    except Exception:
        pass

    # --- Step 2: License Key ---
    print_section("Step 2: License Key")

    key = LICENSE_KEY
    if key == "XXXXX-XXXXX-XXXXX-XXXXX":
        key = input(f"  {C.YELLOW}Enter your license key: {C.RESET}").strip()
        if not key:
            print_err("No license key provided. Exiting.")
            sys.exit(1)

    print_info("Key", key)
    print()

    # --- Step 3: Server Connection ---
    print_section("Step 3: Server Connection")
    print(f"  {C.DIM}Connecting to {API_URL}...{C.RESET}")

    client = DarkAuthClient(API_URL, APP_ID, APP_SECRET)

    # Try V2 init first
    ok, data = client.init(APP_VERSION)
    if ok:
        print_ok(f"Session established!")
        print_info("Session", client.session_token[:24] + "...")

        # Check for updates
        update = data.get("update")
        if update and update.get("available"):
            print()
            print(f"  {C.YELLOW}⚠ Update available: v{update.get('latest_version', '?')}{C.RESET}")
            if update.get("is_forced"):
                print_err("This update is REQUIRED. Please update before continuing.")
                sys.exit(1)
    else:
        print(f"  {C.YELLOW}⚠ V2 init failed: {data.get('message', 'Unknown')}{C.RESET}")
        print(f"  {C.DIM}Falling back to V1 activation...{C.RESET}")

    # --- Step 4: License Activation ---
    print_section("Step 4: License Activation")

    if client.session_token:
        # V2 flow
        print(f"  {C.DIM}Activating with license key (V2)...{C.RESET}")
        ok, lic_data = client.license_login(key, hwid)
        if ok:
            print_ok("License activated successfully!")
            print_info("Status", lic_data.get("status", "ACTIVE"))
            print_info("Level", f"Tier {lic_data.get('level', 1)}")
            print_info("HWID", lic_data.get("hwid", hwid)[:32] + "...")
            expires = lic_data.get("expires_at")
            if expires:
                print_info("Expires", expires)
            else:
                print_info("Expires", "Lifetime")
        else:
            msg = lic_data.get("message", "Activation failed")
            print_err(f"V2 activation failed: {msg}")

            # Try V1 fallback
            print(f"\n  {C.DIM}Trying V1 activation...{C.RESET}")
            ok2, v1_data = client.verify_activate(key, hwid)
            if ok2:
                print_ok("V1 activation successful!")
                print_info("Token", v1_data.get("activationToken", "N/A"))
                lic = v1_data.get("license", {})
                print_info("Type", lic.get("type", "N/A"))
                print_info("Expires", lic.get("expiresAt", "Lifetime"))
            else:
                print_err(f"V1 also failed: {v1_data.get('error', v1_data.get('message', 'Unknown'))}")
                print()
                print(f"  {C.YELLOW}Troubleshooting:{C.RESET}")
                print(f"  {C.GRAY}1. Check your license key is correct{C.RESET}")
                print(f"  {C.GRAY}2. Make sure APP_ID and APP_SECRET are configured{C.RESET}")
                print(f"  {C.GRAY}3. Verify the server is running{C.RESET}")
                print(f"  {C.GRAY}4. Run get-sid.ps1 to get your SID{C.RESET}")
                sys.exit(1)
    else:
        # Direct V1 flow
        print(f"  {C.DIM}Activating with license key (V1)...{C.RESET}")
        ok, v1_data = client.verify_activate(key, hwid)
        if ok:
            print_ok("Activation successful!")
            print_info("Token", v1_data.get("activationToken", "N/A"))
            lic = v1_data.get("license", {})
            print_info("Type", lic.get("type", "N/A"))
            print_info("Expires", lic.get("expiresAt", "Lifetime"))
        else:
            print_err(f"Activation failed: {v1_data.get('error', v1_data.get('message', 'Unknown'))}")
            print()
            print(f"  {C.YELLOW}Make sure you have:{C.RESET}")
            print(f"  {C.GRAY}1. A valid license key{C.RESET}")
            print(f"  {C.GRAY}2. Correct APP_ID and APP_SECRET in config{C.RESET}")
            print(f"  {C.GRAY}3. Internet connection{C.RESET}")
            sys.exit(1)

    # --- Step 5: Verified ---
    print_section("Step 5: Access Granted")
    print(f"  {C.GREEN}{C.BOLD}╔══════════════════════════════════════╗{C.RESET}")
    print(f"  {C.GREEN}{C.BOLD}║      ACCESS GRANTED - WELCOME!      ║{C.RESET}")
    print(f"  {C.GREEN}{C.BOLD}╚══════════════════════════════════════╝{C.RESET}")
    print()
    print_info("Owner", APP_OWNER)
    print_info("Version", APP_VERSION)
    print_info("HWID", hwid[:32] + "...")
    print_info("App ID", APP_ID)
    print()
    print(f"  {C.GRAY}Your application is now authenticated.{C.RESET}")
    print(f"  {C.GRAY}Press Enter to exit...{C.RESET}")
    input()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n  {C.RED}Interrupted.{C.RESET}")
        sys.exit(0)
    except Exception as e:
        print(f"\n  {C.RED}Fatal error: {e}{C.RESET}")
        sys.exit(1)
