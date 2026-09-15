"""
DARK-AUTH Python SDK v2.0.0 — Example Usage
"""

from darkauth import DarkAuth


def main():
    print("=== DARK-AUTH Python SDK Demo ===\n")

    auth = DarkAuth(
        app_id="YOUR_APP_ID",
        secret="YOUR_SECRET",
        api_url="https://your-api-url.com",
        version="2.0.0",
    )

    print(f"HWID: {auth.hwid}")

    # 1. Initialize session
    print("\n[1] Initializing...")
    init_res = auth.init()
    print(f"Session token: {auth.session_token}")
    if init_res.get("update", {}).get("available"):
        print(f"Update available: v{init_res['update']['latest_version']}")

    # 2. License authentication
    print("\n[2] License authentication...")
    try:
        lic_res = auth.license("XXXXX-XXXXX-XXXXX-XXXXX")
        print(f"Success — level: {lic_res.get('level')} | status: {lic_res.get('status')}")
    except Exception as e:
        print(f"License failed: {e}")

    # 3. User registration
    print("\n[3] Registering user...")
    try:
        reg_res = auth.register("testuser", "testpass123", "XXXXX-XXXXX-XXXXX-XXXXX")
        print(f"Registered: {reg_res.get('user', {}).get('username', 'unknown')}")
    except Exception as e:
        print(f"Registration failed: {e}")

    # 4. User login
    print("\n[4] Logging in...")
    try:
        login_res = auth.login("testuser", "testpass123")
        print(f"Logged in: {login_res.get('user', {}).get('username', 'unknown')}")
    except Exception as e:
        print(f"Login failed: {e}")

    # 5. Session check
    print("\n[5] Checking session...")
    valid = auth.check()
    print(f"Session valid: {valid}")

    # 6. Cloud variables
    print("\n[6] Cloud variables...")
    try:
        motd = auth.get_var("MOTD")
        print(f"MOTD: {motd}")
    except Exception as e:
        print(f"getVar failed: {e}")

    try:
        auth.set_var("last_login", "now")
        print("setVar succeeded")
    except Exception as e:
        print(f"setVar failed: {e}")

    # 7. Logging
    print("\n[7] Sending log...")
    try:
        auth.log("Python SDK test completed", "INFO")
        print("Log sent")
    except Exception as e:
        print(f"Log failed: {e}")

    # 8. HWID reset
    print("\n[8] HWID reset...")
    try:
        auth.reset_hwid("XXXXX-XXXXX-XXXXX-XXXXX")
        print("HWID reset requested")
    except Exception as e:
        print(f"HWID reset failed: {e}")

    # 9. Chat
    print("\n[9] Chat...")
    try:
        messages = auth.get_chat("general")
        for msg in messages:
            print(f"  [{msg.get('sender')}]: {msg.get('message')}")
    except Exception as e:
        print(f"getChat failed: {e}")

    try:
        auth.send_chat("PythonBot", "Hello from Python SDK!", "general")
        print("Message sent")
    except Exception as e:
        print(f"sendChat failed: {e}")

    print("\n=== Done ===")


if __name__ == "__main__":
    main()
