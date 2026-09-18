"""
Windows compatibility shim for google-colab-cli.
Provides mock termios and tty modules and sets UTF-8 encoding.
"""

import sys
import os
import types

# Ensure UTF-8 output encoding on Windows consoles
if sys.platform == "win32":
    os.environ["PYTHONIOENCODING"] = "utf-8"
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

# Mock termios module for Windows
if "termios" not in sys.modules:
    t = types.ModuleType("termios")
    t.TCSAFLUSH = 2
    t.TCSANOW = 0
    t.TCSADRAIN = 1
    t.IFLAG = 0
    t.OFLAG = 1
    t.CFLAG = 2
    t.LFLAG = 3
    t.ISPEED = 4
    t.OSPEED = 5
    t.CC = 6
    t.tcgetattr = lambda fd: [0] * 7
    t.tcsetattr = lambda fd, when, attributes: None
    t.error = Exception
    sys.modules["termios"] = t

# Mock tty module if needed
if "tty" not in sys.modules:
    tty_mod = types.ModuleType("tty")
    tty_mod.setraw = lambda fd, when=2: None
    tty_mod.setcbreak = lambda fd, when=2: None
    sys.modules["tty"] = tty_mod

# Run the official colab CLI
from colab_cli.cli import app

if __name__ == "__main__":
    app()
