# DARK-AUTH Client Tools

## Files

| File | Purpose |
|------|---------|
| `get-sid.ps1` | PowerShell script to grab your Windows SID (Hardware ID) |
| `darkauth_client.py` | Python EXE client with full V2 API integration |
| `build-exe.bat` | Build script to compile Python to EXE |

## Full Flow

### Step 1: Get Your Windows SID
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File get-sid.ps1
```
This copies your SID to clipboard.

### Step 2: Register SID on Website
1. Go to https://darkauth.vercel.app/client
2. Click **"Enter Manually"** next to Hardware ID
3. Paste your SID from Step 1
4. Enter your license key
5. Click **"Redeem & Activate Key"**

### Step 3: Run the EXE
```
DarkAuth.exe
```
Enter your license key when prompted. The EXE will:
1. Auto-grab your Windows SID
2. Connect to the DARK-AUTH server
3. Verify your license + SID
4. Grant access

## Build to EXE

```cmd
cd client-tools
build-exe.bat
```

Output: `dist\DarkAuth.exe`

## Configuration

Edit `darkauth_client.py` and change these values:

```python
APP_ID = "app_your_app_id_here"
APP_SECRET = "secret_your_secret_here"
API_URL = "https://darkauth.vercel.app/api"
```

Get your App ID and Secret from the dashboard at:
https://darkauth.vercel.app/apps
