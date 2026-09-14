<#
.SYNOPSIS
    DARK-AUTH - Windows SID (Hardware ID) Grabber
.DESCRIPTION
    Grabs your Windows SID and copies it to clipboard.
    Use this SID as your Hardware ID in the DARK-AUTH client portal or EXE.
.NOTES
    Run this command in PowerShell:
    powershell -NoProfile -ExecutionPolicy Bypass -File get-sid.ps1
#>

$sid = ([System.Security.Principal.WindowsIdentity]::GetCurrent()).User.Value

Write-Host ""
Write-Host "========================================" -ForegroundColor DarkRed
Write-Host "  DARK-AUTH - Windows SID Grabber" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor DarkRed
Write-Host ""
Write-Host "Your Windows SID (Hardware ID):" -ForegroundColor Yellow
Write-Host ""
Write-Host "  $sid" -ForegroundColor Green
Write-Host ""
Write-Host "Copied to clipboard!" -ForegroundColor Cyan
Write-Host ""

Set-Clipboard $sid

Write-Host "Paste this SID in:" -ForegroundColor Gray
Write-Host "  1. Client Portal website (https://darkauth.vercel.app/client)" -ForegroundColor Gray
Write-Host "  2. EXE Client login" -ForegroundColor Gray
Write-Host ""
