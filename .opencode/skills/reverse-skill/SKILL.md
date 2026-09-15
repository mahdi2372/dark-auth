---
name: reverse-skill
description: Cybersecurity skills router for reverse engineering, penetration testing, malware analysis, mobile reverse, firmware pentest, CTF, and security research. Use when encountering APK analysis, binary reverse, JS encryption, CTF challenges, pentesting targets, or any security-related task requiring tool routing.
---

# Reverse Engineering Skills Router

Cybersecurity skills router with AI-powered routing, on-demand toolchain bootstrapping, and self-evolving knowledge base.

## Repository

Full source: `skills/reverse-skill/` (cloned from https://github.com/zhaoxuya520/reverse-skill)

## Supported Scenarios

| Scenario | Entry Point |
|----------|-------------|
| APK / Android analysis | `skills/reverse-skill/skills/apk-reverse/` |
| iOS / mobile | `skills/reverse-skill/skills/mobile-reverse/` |
| Binary reverse (exe/dll/so/elf) | `skills/reverse-skill/skills/ida-reverse/` / `skills/reverse-skill/skills/radare2/` |
| Binary Ninja / HLIL / MLIL | `skills/reverse-skill/skills/binary-ninja-reverse/` |
| .NET / C# | `skills/reverse-skill/skills/dotnet-reverse/` |
| Frontend JS / encrypted params | `skills/reverse-skill/skills/js-reverse/` |
| HTTP capture / request replay | `skills/reverse-skill/skills/anything-analyzer/` + `js-reverse/` |
| Malware / YARA | `skills/reverse-skill/skills/malware-analysis/` |
| Penetration testing / scanning | `skills/reverse-skill/skills/pentest-tools/` |
| Attack chain / red-team orchestration | `skills/reverse-skill/skills/attack-chain/` |
| CTF competition | `skills/reverse-skill/CTF-Sandbox-Orchestrator/` |
| Firmware / IoT | `skills/reverse-skill/skills/firmware-pentest/` |
| Patch diff / N-day | `skills/reverse-skill/skills/patch-diff-exploit/` |
| Pwn / exploit development | `skills/reverse-skill/skills/pwn-chain/` |
| EDR bypass | `skills/reverse-skill/skills/edr-bypass-re/` |
| API / GraphQL security | `skills/reverse-skill/skills/api-security/` |
| Supply chain / SBOM | `skills/reverse-skill/skills/supply-chain-security/` |
| LLM / AI security | `skills/reverse-skill/skills/llm-security/` |
| Diagrams / reports | `skills/reverse-skill/skills/diagram-generator/` / `skills/reverse-skill/skills/docs-generator/` |
| Windows AD / Kerberos | `skills/reverse-skill/skills/windows-ad/` |
| Cloud / K8s | `skills/reverse-skill/skills/cloud-k8s/` |
| Digital forensics | `skills/reverse-skill/skills/digital-forensics/` |
| Code audit / SAST | `skills/reverse-skill/skills/code-audit/` |
| Threat intelligence | `skills/reverse-skill/skills/threat-intelligence/` |
| Threat hunting | `skills/reverse-skill/skills/threat-hunting/` |

## Quick Start

1. Run the router for your platform:
   - Windows: `powershell -File skills/reverse-skill/skills/scripts/master-route.ps1 -Hint "<task>"`
   - Linux/macOS: `bash skills/reverse-skill/skills/scripts/master-route.sh --hint "<task>"`
2. Initialize case: `powershell -File skills/reverse-skill/skills/scripts/case-init.ps1 -Hint "<task>"`
3. Open the PRIMARY skill's SKILL.md and execute

## Key Files

| File | Purpose |
|------|---------|
| `skills/reverse-skill/skills/SKILL.md` | Master entry point |
| `skills/reverse-skill/skills/MASTER-ROUTING.md` | Primary fast ladder |
| `skills/reverse-skill/skills/routing.md` | Task-to-skill routing matrix |
| `skills/reverse-skill/skills/config/routing.json` | Routing source of truth (44 rules) |
| `skills/reverse-skill/skills/tool-index.md` | Local tool status |

## Tool Bootstrap

When a workflow finds missing tools, use the platform-native bootstrap:

```powershell
# Windows
powershell -NoProfile -ExecutionPolicy Bypass -File "skills/reverse-skill/skills/scripts/bootstrap-reverse.ps1" -Capability @('toolname') -StartServices
```

```bash
# Linux/macOS
bash skills/reverse-skill/skills/scripts/bootstrap-reverse.sh toolname --start-services
```

Supported capabilities: jadx, apktool, frida, idapro, r2, ghidra-mcp, nmap, yara, pwntools, and more.

## Disclaimer

This skill is intended solely for lawful security research, education, CTF competitions, and testing of systems you own or have explicit authorization to assess.
