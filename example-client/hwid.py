"""
Hardware ID (HWID) Collection Utility
======================================
Generates a unique, stable hardware identifier from:
  - CPU info
  - MAC address
  - Disk serial number (Windows)
  - Machine ID (Linux)

The resulting HWID is a SHA-256 hash of combined hardware data.
"""

import hashlib
import platform
import uuid
import os
import subprocess


def get_cpu_info():
    """Get CPU identifier."""
    try:
        if platform.system() == "Windows":
            result = subprocess.run(
                ["wmic", "cpu", "get", "ProcessorId"],
                capture_output=True, text=True, timeout=5
            )
            lines = [l.strip() for l in result.stdout.strip().split("\n") if l.strip()]
            if len(lines) > 1:
                return lines[1]
        elif platform.system() == "Linux":
            with open("/proc/cpuinfo", "r") as f:
                for line in f:
                    if "Serial" in line or "model name" in line:
                        return line.split(":")[1].strip()
        elif platform.system() == "Darwin":
            result = subprocess.run(
                ["sysctl", "-n", "machdep.cpu.brand_string"],
                capture_output=True, text=True, timeout=5
            )
            return result.stdout.strip()
    except Exception:
        pass
    return platform.processor()


def get_mac_address():
    """Get primary MAC address."""
    mac = uuid.getnode()
    return ':'.join(f'{(mac >> i) & 0xff:02x}' for i in range(40, -1, -8))


def get_disk_serial():
    """Get disk serial number."""
    try:
        if platform.system() == "Windows":
            result = subprocess.run(
                ["wmic", "diskdrive", "get", "SerialNumber"],
                capture_output=True, text=True, timeout=5
            )
            lines = [l.strip() for l in result.stdout.strip().split("\n") if l.strip()]
            if len(lines) > 1:
                return lines[1]
        elif platform.system() == "Linux":
            # Try machine-id first
            for path in ["/etc/machine-id", "/var/lib/dbus/machine-id"]:
                if os.path.exists(path):
                    with open(path, "r") as f:
                        return f.read().strip()
    except Exception:
        pass
    return ""


def get_machine_name():
    """Get machine hostname."""
    return platform.node()


def get_hwid():
    """
    Generate a stable hardware fingerprint.

    Combines CPU, MAC, disk serial, and machine name into
    a SHA-256 hash that uniquely identifies the machine.

    Returns:
        str: 64-character hex HWID
    """
    components = [
        get_cpu_info(),
        get_mac_address(),
        get_disk_serial(),
        get_machine_name(),
        platform.system(),
        platform.machine(),
    ]

    raw = "|".join(str(c) for c in components)
    hwid = hashlib.sha256(raw.encode()).hexdigest()

    return hwid


if __name__ == "__main__":
    print(f"Hardware ID: {get_hwid()}")
    print(f"CPU: {get_cpu_info()}")
    print(f"MAC: {get_mac_address()}")
    print(f"Disk: {get_disk_serial()}")
    print(f"Host: {get_machine_name()}")
    print(f"OS: {platform.system()} {platform.machine()}")
