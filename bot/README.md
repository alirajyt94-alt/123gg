# 🎵 Groove Music Bot (yt-dlp & FFmpeg Edition)

> **Major Update**: All Lavalink dependencies and node connections have been completely removed! The bot now uses a high-performance, native audio pipeline powered directly by **yt-dlp** and **FFmpeg** using `@discordjs/voice`.

---

## ⚡ What Changed? (Lavalink vs. yt-dlp + FFmpeg)

| Feature | Old Lavalink Bot | New yt-dlp & FFmpeg Bot |
| :--- | :--- | :--- |
| **External Server** | Requires separate Java Lavalink server | ❌ **None!** Runs 100% standalone |
| **Java Dependency** | Java 17+ required | ❌ **No Java needed** |
| **Extractor** | YouTube plugin / Java Lavaplayer | ✅ **yt-dlp** (Fastest, latest updates, bypasses IP blocks) |
| **Audio Processing** | Lavalink WebSocket packets | ✅ **FFmpeg** native PCM stream |
| **Latency** | Network hop (Bot -> Lavalink -> Discord) | ✅ Direct UDP Opus stream to Discord Voice |
| **Memory Footprint** | ~500MB+ for Lavalink JVM + Node | ✅ ~80MB lightweight Node.js footprint |
| **Hosting Cost** | Needs 2 servers (Node + Java Lavalink) | ✅ Single cheap VPS, container, or local machine |

---

## 🚀 Prerequisites

1. **Node.js** (v18.0.0 or higher)
2. **FFmpeg** installed and accessible in your system PATH (`ffmpeg -version`)
   - Ubuntu/Debian: `sudo apt install ffmpeg`
   - Windows: `winget install Gyan.FFmpeg` or download from [ffmpeg.org](https://ffmpeg.org)
   - macOS: `brew install ffmpeg`
3. **yt-dlp** installed and accessible in your system PATH (`yt-dlp --version`)
   - Linux: `sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp`
   - Windows: `winget install yt-dlp`
   - Python/pip: `pip install -U yt-dlp`

---

## 🛠️ Quick Installation

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file or edit `src/config.json`:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   BOT_PREFIX=!
   OWNER_IDS=your_discord_user_id
   YTDLP_PATH=yt-dlp
   FFMPEG_PATH=ffmpeg
   ```

3. **Start the Bot:**
   ```bash
   # Standard mode
   npm start

   # Sharded mode (for 1000+ servers)
   npm run shard
   ```

---

## 📜 Commands Reference

### 🎵 Music Commands
- `!play <song or URL>` - Searches via yt-dlp and streams into your voice channel
- `!pause` - Pauses current playback
- `!resume` - Resumes paused playback
- `!skip` - Skips to the next song in the queue
- `!skipto <number>` - Jumps to a specific position in the queue
- `!forceskip` - Force skips without vote restrictions
- `!stop` - Stops playback, clears queue, and disconnects
- `!queue` - Shows paginated list of queued tracks
- `!nowplaying` - Displays animated progress bar, duration, volume, and active filter
- `!volume <0-200>` - Sets playback volume
- `!loop <off/track/queue>` - Sets repeat mode
- `!shuffle` - Randomizes track queue
- `!clearqueue` - Removes all tracks from queue
- `!seek <seconds or mm:ss>` - Seeks to timestamp via FFmpeg
- `!forward [seconds]` - Fast-forwards audio by 10s or custom seconds
- `!rewind [seconds]` - Rewinds audio by 10s or custom seconds
- `!previous` - Plays the previously played track from history
- `!replay` - Restarts the current track from beginning
- `!search <query>` - Interactive top 5 search picker
- `!autoplay` - Automatically queues similar songs when queue ends
- `!speed <0.5 - 2.0>` - Dynamically adjusts audio tempo via FFmpeg `atempo`
- `!mood <chill/lofi/gaming/workout/party>` - Streams themed mood radio
- `!artistradio <artist>` - Curates hits radio for any artist
- `!similar` - Queues similar tracks using yt-dlp recommendations
- `!join` - Summons the bot to your voice channel
- `!leave` - Disconnects the bot from voice
- `!grab` - DMs you song details
- `!lyrics [song name]` - Fetches and displays plain or synced lyrics for currently playing or searched track with interactive pagination buttons (powered by LRCLIB and yt-dlp metadata)

### 🎛️ FFmpeg Audio Filters (`!filter <name>`)
- `bassboost` / `bassboost_soft` / `bassboost_hard` - Deep bass frequency amplification
- `nightcore` - 1.25x tempo + pitch elevation
- `vaporwave` - 0.8x slowed tempo + aesthetic low-pass
- `8d` - Spatial 8D surround sound rotation
- `karaoke` - Center channel vocal suppression
- `tremolo` - Rapid amplitude modulation
- `echo` - Rich delay reverberation
- `pop` / `rock` / `electronic` / `classical` - Preset multi-band equalizers
- `clear` - Resets all filters back to crystal-clear default audio

### ⚙️ Config & Utility
- `!247` - Keeps the bot permanently inside voice channel
- `!setprefix <prefix>` - Sets custom server prefix
- `!source` - Displays yt-dlp & FFmpeg audio engine information
- `!system` / `!node` - Displays CPU, RAM, yt-dlp version, FFmpeg version, active voice streams
- `!ping` - Shows WebSocket and audio latency
- `!help` - Interactive command browser
- `!stats` - Guild count, member count, uptime stats
