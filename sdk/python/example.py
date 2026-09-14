from darkauth import DarkAuth

def main():
    print("=== DARK-AUTH Python Client Demo ===")
    auth = DarkAuth(
        app_id="YOUR_APP_ID",
        secret="YOUR_SECRET",
        api_url="YOUR_API_URL",
        version="1.0.0"
    )

    print(f"Generated Client HWID: {auth.hwid}")
    
    # 1. Initialize session
    print("\n[1] Initializing handshake...")
    init_res = auth.init()
    print(f"Session Token: {auth.session_token}")
    if init_res.get("update", {}).get("available"):
        print(f"⚠️ Update available: v{init_res['update']['latest_version']}")

    # 2. License Login
    print("\n[2] Testing License Authentication...")
    try:
        lic_res = auth.license("XXXXX-XXXXX-XXXXX-XXXXX")
        print(f"✅ Success! Level: {lic_res['level']} | Status: {lic_res['status']}")
    except Exception as e:
        print(f"❌ License login failed: {e}")

    # 3. Read Cloud Variable
    print("\n[3] Reading Cloud Variable (MOTD)...")
    try:
        motd = auth.get_var("MOTD")
        print(f"MOTD Value: {motd}")
    except Exception as e:
        print(f"Variable lookup: {e}")

    # 4. Check in-app announcements / chat
    print("\n[4] Checking chat messages...")
    try:
        chats = auth.get_chat()
        for msg in chats:
            print(f"  [{msg.get('sender')}]: {msg.get('message')}")
    except Exception as e:
        print(f"Chat error: {e}")

if __name__ == "__main__":
    main()
