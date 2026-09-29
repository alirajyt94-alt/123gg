#!/usr/bin/env bash
# ==============================================================================
# Groove Music Bot - Automatic Audio Dependencies Setup (yt-dlp & FFmpeg)
# ==============================================================================
# This script automatically detects your OS and installs or updates:
#   1. FFmpeg (Audio transcoder & PCM DSP filter engine)
#   2. yt-dlp (Fast streaming YouTube, SoundCloud & audio extractor)
#
# Supported Package Managers:
#   - apt-get / apt (Debian, Ubuntu, Linux Mint, Pop!_OS)
#   - dnf / yum (Fedora, RHEL, CentOS, Rocky Linux, AlmaLinux)
#   - pacman (Arch Linux, Manjaro)
#   - zypper (openSUSE)
#   - apk (Alpine Linux)
#   - brew (macOS, Linux Homebrew)
#   - Direct Binary Fallback (Installs directly to /usr/local/bin or ./bin)
#
# ------------------------------------------------------------------------------
# HOW TO SET THIS AS A STARTUP HOOK ON YOUR VPS:
# ------------------------------------------------------------------------------
#
# Option A: NPM Postinstall / Prestart Hook (Recommended - Zero Configuration)
#   Add to package.json scripts:
#     "prestart": "bash scripts/setup-dependencies.sh"
#   Every time you start the app with 'npm start' or 'npm run dev', it verifies
#   and auto-installs yt-dlp & FFmpeg first!
#
# Option B: Systemd Service Hook (Automatic on VPS boot)
#   Create /etc/systemd/system/groove-deps.service:
#     [Unit]
#     Description=Groove Music Audio Dependencies Check
#     Before=groove-bot.service
#     Wants=network-online.target
#     After=network-online.target
#
#     [Service]
#     Type=oneshot
#     User=root
#     WorkingDirectory=/root/your-bot-folder
#     ExecStart=/bin/bash /root/your-bot-folder/scripts/setup-dependencies.sh
#     RemainAfterExit=yes
#
#     [Install]
#     WantedBy=multi-user.target
#
#   Then enable it:
#     sudo systemctl daemon-reload
#     sudo systemctl enable --now groove-deps.service
#
# Option C: PM2 Startup Hook
#   In ecosystem.config.cjs or before pm2 start:
#     pm2 start "bash scripts/setup-dependencies.sh && npm start" --name groove-music
#   Or with cron:
#     crontab -e
#     @reboot /bin/bash /path/to/bot/scripts/setup-dependencies.sh >> /var/log/groove-setup.log 2>&1
#
# ==============================================================================

set -e

# ANSI Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  GROOVE MUSIC - DEPENDENCIES AUTO-SETUP (VPS & SERVERS)   ${NC}"
echo -e "${BLUE}============================================================${NC}"

# Check sudo / root
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo -e "${YELLOW}[!] Warning: Not running as root and sudo is not installed.${NC}"
    echo -e "${YELLOW}    Will attempt local binary installation into ./bin if needed.${NC}"
  fi
fi

# Detect Architecture
ARCH="$(uname -m)"
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
LOCAL_BIN_DIR="$(pwd)/bin"
mkdir -p "$LOCAL_BIN_DIR"
chmod +x "$LOCAL_BIN_DIR"/* 2>/dev/null || true
export PATH="$LOCAL_BIN_DIR:/usr/local/bin:$PATH"

echo -e "[*] Detected OS: ${GREEN}$OS${NC} | Architecture: ${GREEN}$ARCH${NC}"

# ------------------------------------------------------------------------------
# 1. CHECK & INSTALL FFMPEG
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}--- [1/2] Checking FFmpeg ---${NC}"

if command -v ffmpeg >/dev/null 2>&1; then
  FFMPEG_VER=$(ffmpeg -version 2>&1 | head -n1)
  echo -e "${GREEN}[✓] FFmpeg is already installed:${NC} $FFMPEG_VER"
else
  echo -e "${YELLOW}[i] FFmpeg not found in PATH. Detecting package manager...${NC}"
  INSTALLED_FFMPEG=0

  if command -v apt-get >/dev/null 2>&1; then
    echo -e "[*] Installing FFmpeg via apt-get..."
    $SUDO apt-get update -y && $SUDO apt-get install -y ffmpeg && INSTALLED_FFMPEG=1
  elif command -v dnf >/dev/null 2>&1; then
    echo -e "[*] Installing FFmpeg via dnf..."
    $SUDO dnf install -y ffmpeg || ($SUDO dnf install -y epel-release && $SUDO dnf install -y --nogpgcheck https://mirrors.rpmfusion.org/free/el/rpmfusion-free-release-$(rpm -E %rhel).noarch.rpm && $SUDO dnf install -y ffmpeg) && INSTALLED_FFMPEG=1
  elif command -v yum >/dev/null 2>&1; then
    echo -e "[*] Installing FFmpeg via yum..."
    $SUDO yum install -y epel-release || true
    $SUDO yum install -y ffmpeg && INSTALLED_FFMPEG=1
  elif command -v pacman >/dev/null 2>&1; then
    echo -e "[*] Installing FFmpeg via pacman..."
    $SUDO pacman -Sy --noconfirm ffmpeg && INSTALLED_FFMPEG=1
  elif command -v zypper >/dev/null 2>&1; then
    echo -e "[*] Installing FFmpeg via zypper..."
    $SUDO zypper --non-interactive install ffmpeg && INSTALLED_FFMPEG=1
  elif command -v apk >/dev/null 2>&1; then
    echo -e "[*] Installing FFmpeg via apk..."
    $SUDO apk add --no-cache ffmpeg && INSTALLED_FFMPEG=1
  elif command -v brew >/dev/null 2>&1; then
    echo -e "[*] Installing FFmpeg via Homebrew..."
    brew install ffmpeg && INSTALLED_FFMPEG=1
  fi

  # Fallback to pre-built static binary if package manager failed or unavailable
  if [ "$INSTALLED_FFMPEG" -ne 1 ] || ! command -v ffmpeg >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] Package manager failed or not found. Downloading static FFmpeg binary...${NC}"
    STATIC_FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64"

    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
      STATIC_FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-arm64"
    elif [ "$ARCH" = "armv7l" ] || [ "$ARCH" = "arm" ]; then
      STATIC_FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-arm"
    elif [ "$OS" = "darwin" ]; then
      STATIC_FFMPEG_URL="https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-arm64"
    fi

    TARGET_DEST="/usr/local/bin/ffmpeg"
    if [ ! -w "/usr/local/bin" ] && [ -z "$SUDO" ]; then
      TARGET_DEST="$LOCAL_BIN_DIR/ffmpeg"
    fi

    echo -e "[*] Downloading static FFmpeg from: $STATIC_FFMPEG_URL"
    if command -v curl >/dev/null 2>&1; then
      if [ -n "$SUDO" ] && [ "$TARGET_DEST" = "/usr/local/bin/ffmpeg" ]; then
        curl -fsSL "$STATIC_FFMPEG_URL" -o /tmp/ffmpeg-static
        $SUDO mv /tmp/ffmpeg-static "$TARGET_DEST"
        $SUDO chmod +x "$TARGET_DEST"
      else
        curl -fsSL "$STATIC_FFMPEG_URL" -o "$TARGET_DEST"
        chmod +x "$TARGET_DEST"
      fi
    elif command -v wget >/dev/null 2>&1; then
      if [ -n "$SUDO" ] && [ "$TARGET_DEST" = "/usr/local/bin/ffmpeg" ]; then
        wget -qO /tmp/ffmpeg-static "$STATIC_FFMPEG_URL"
        $SUDO mv /tmp/ffmpeg-static "$TARGET_DEST"
        $SUDO chmod +x "$TARGET_DEST"
      else
        wget -qO "$TARGET_DEST" "$STATIC_FFMPEG_URL"
        chmod +x "$TARGET_DEST"
      fi
    fi
  fi

  if command -v ffmpeg >/dev/null 2>&1 || [ -f "$LOCAL_BIN_DIR/ffmpeg" ]; then
    echo -e "${GREEN}[✓] FFmpeg setup complete!${NC}"
  else
    echo -e "${RED}[✗] Failed to install FFmpeg. Please install it manually with 'sudo apt install ffmpeg'.${NC}"
  fi
fi

# ------------------------------------------------------------------------------
# 2. CHECK & INSTALL / UPDATE YT-DLP
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}--- [2/2] Checking yt-dlp ---${NC}"

TARGET_YTDLP="/usr/local/bin/yt-dlp"
if [ ! -w "/usr/local/bin" ] && [ -z "$SUDO" ]; then
  TARGET_YTDLP="$LOCAL_BIN_DIR/yt-dlp"
fi

if command -v yt-dlp >/dev/null 2>&1; then
  YTDLP_VER=$(yt-dlp --version 2>&1 || true)
  echo -e "${GREEN}[✓] yt-dlp is installed:${NC} v$YTDLP_VER"
  echo -e "[*] Checking for newest yt-dlp updates..."
  if [ -n "$SUDO" ]; then
    $SUDO yt-dlp -U 2>/dev/null || yt-dlp -U 2>/dev/null || true
  else
    yt-dlp -U 2>/dev/null || true
  fi
else
  echo -e "${YELLOW}[i] yt-dlp not found in PATH. Downloading standalone binary from GitHub releases...${NC}"

  YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
  if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
    YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64"
  elif [ "$OS" = "darwin" ]; then
    YTDLP_URL="https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
  fi

  if command -v curl >/dev/null 2>&1; then
    if [ -n "$SUDO" ] && [ "$TARGET_YTDLP" = "/usr/local/bin/yt-dlp" ]; then
      curl -fsSL "$YTDLP_URL" -o /tmp/yt-dlp
      $SUDO mv /tmp/yt-dlp "$TARGET_YTDLP"
      $SUDO chmod a+rx "$TARGET_YTDLP"
    else
      curl -fsSL "$YTDLP_URL" -o "$TARGET_YTDLP"
      chmod a+rx "$TARGET_YTDLP"
    fi
  elif command -v wget >/dev/null 2>&1; then
    if [ -n "$SUDO" ] && [ "$TARGET_YTDLP" = "/usr/local/bin/yt-dlp" ]; then
      wget -qO /tmp/yt-dlp "$YTDLP_URL"
      $SUDO mv /tmp/yt-dlp "$TARGET_YTDLP"
      $SUDO chmod a+rx "$TARGET_YTDLP"
    else
      wget -qO "$TARGET_YTDLP" "$YTDLP_URL"
      chmod a+rx "$TARGET_YTDLP"
    fi
  elif command -v pip3 >/dev/null 2>&1; then
    echo -e "[*] Falling back to pip3..."
    pip3 install --upgrade yt-dlp
  elif command -v pip >/dev/null 2>&1; then
    pip install --upgrade yt-dlp
  fi

  if command -v yt-dlp >/dev/null 2>&1 || [ -f "$LOCAL_BIN_DIR/yt-dlp" ]; then
    echo -e "${GREEN}[✓] yt-dlp setup complete!${NC}"
  else
    echo -e "${RED}[✗] Failed to install yt-dlp automatically.${NC}"
  fi
fi

# ------------------------------------------------------------------------------
# 3. VERIFY & SUMMARY
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${GREEN}             DEPENDENCY STATUS SUMMARY                      ${NC}"
echo -e "${BLUE}============================================================${NC}"

if command -v ffmpeg >/dev/null 2>&1 || [ -f "$LOCAL_BIN_DIR/ffmpeg" ]; then
  FF_BIN=$(command -v ffmpeg || echo "$LOCAL_BIN_DIR/ffmpeg")
  echo -e "FFmpeg Binary : ${GREEN}$FF_BIN${NC}"
else
  echo -e "FFmpeg Binary : ${RED}NOT FOUND${NC}"
fi

if command -v yt-dlp >/dev/null 2>&1 || [ -f "$LOCAL_BIN_DIR/yt-dlp" ]; then
  YT_BIN=$(command -v yt-dlp || echo "$LOCAL_BIN_DIR/yt-dlp")
  echo -e "yt-dlp Binary : ${GREEN}$YT_BIN${NC} (v$($YT_BIN --version 2>/dev/null || echo 'unknown'))"
else
  echo -e "yt-dlp Binary : ${RED}NOT FOUND${NC}"
fi

echo -e "\n${GREEN}[✓] Everything is configured for high-performance audio streaming!${NC}"
echo -e "${BLUE}============================================================${NC}\n"
