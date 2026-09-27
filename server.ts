import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const archiver = require('archiver');
import dotenv from 'dotenv';
import { YtdlpFFmpegEngine, AUDIO_FILTERS } from './bot/src/structures/YtdlpFFmpegEngine.js';
import { MusicClient } from './bot/src/structures/MusicClient.js';
import { lyricsService } from './bot/src/utils/lyricsService.js';

dotenv.config();

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-memory bot instance & logs
let activeBot: MusicClient | null = null;
const botLogs: Array<{ timestamp: string; level: 'info' | 'warn' | 'error'; message: string }> = [];

function addLog(level: 'info' | 'warn' | 'error', message: string) {
  const entry = {
    timestamp: new Date().toLocaleTimeString(),
    level,
    message
  };
  botLogs.unshift(entry);
  if (botLogs.length > 100) botLogs.pop();
}

addLog('info', 'Web dashboard & audio studio initialized.');

const engine = new YtdlpFFmpegEngine({
  ytdlpPath: process.env.YTDLP_PATH || 'yt-dlp',
  ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg'
});

// 1. System & Engine Status API
app.get('/api/engine/status', (req: Request, res: Response) => {
  let ytdlpVersion = 'Not Installed';
  let ffmpegVersion = 'Not Installed';

  try {
    ytdlpVersion = execSync('yt-dlp --version', { timeout: 3000 }).toString().trim();
  } catch {}

  try {
    ffmpegVersion = execSync('ffmpeg -version', { timeout: 3000 }).toString().split('\n')[0].replace('ffmpeg version ', '').split(' ')[0];
  } catch {}

  const totalMem = Math.round(os.totalmem() / 1024 / 1024);
  const freeMem = Math.round(os.freemem() / 1024 / 1024);
  const usedMem = totalMem - freeMem;

  res.json({
    engine: {
      type: 'yt-dlp + FFmpeg',
      ytdlpVersion,
      ffmpegVersion,
      lavalinkRemoved: true,
      audioFormats: ['s16le', 'opus', 'mp3', 'wav'],
      filtersAvailable: Object.keys(AUDIO_FILTERS)
    },
    system: {
      platform: `${os.type()} (${os.arch()})`,
      uptimeSeconds: Math.floor(os.uptime()),
      memory: {
        totalMb: totalMem,
        usedMb: usedMem,
        freeMb: freeMem,
        usagePercent: Math.round((usedMem / totalMem) * 100)
      },
      cpuCount: os.cpus().length
    },
    bot: {
      online: Boolean(activeBot && activeBot.isReady()),
      user: activeBot?.user ? { id: activeBot.user.id, tag: activeBot.user.tag, avatar: activeBot.user.displayAvatarURL() } : null,
      guildCount: activeBot?.guilds.cache.size || 0,
      activeVoicePlayers: activeBot?.playerManager.players.size || 0,
      ping: activeBot?.ws ? Math.round(activeBot.ws.ping) : 0
    }
  });
});

// 2. yt-dlp Music Search API
app.get('/api/music/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    addLog('info', `yt-dlp search query: "${query}"`);
    const results = await engine.search(query, 6);
    res.json({ results });
  } catch (err: any) {
    addLog('error', `yt-dlp search failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// 2b. Lyrics Extraction (LRCLIB & yt-dlp metadata)
app.get('/api/music/lyrics', async (req: Request, res: Response) => {
  const track = req.query.track as string;
  const artist = (req.query.artist as string) || '';
  const url = (req.query.url as string) || '';

  if (!track && !url) {
    return res.status(400).json({ error: 'Track name or URL is required' });
  }

  try {
    addLog('info', `Fetching lyrics for: "${track || url}"`);
    const data = await lyricsService.fetchLyrics(track || '', artist, url);
    if (!data) {
      return res.status(404).json({ error: 'No lyrics found for this track' });
    }
    res.json({ lyrics: data });
  } catch (err: any) {
    addLog('error', `Lyrics fetch error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// 3. Audio Preview Stream (Transcoded with FFmpeg & Filters)
app.get('/api/music/stream', async (req: Request, res: Response) => {
  const trackUrl = req.query.url as string;
  const filter = (req.query.filter as string) || '';
  const speed = parseFloat(req.query.speed as string) || 1.0;

  if (!trackUrl) {
    return res.status(400).json({ error: 'Track URL is required' });
  }

  try {
    addLog('info', `Initiating audio preview stream for ${trackUrl} [Filter: ${filter || 'none'}]`);
    const directStreamUrl = await engine.getDirectStreamUrl(trackUrl);

    // Build FFmpeg filter string
    const filterParts: string[] = [];
    if (speed && speed !== 1.0) {
      filterParts.push(`atempo=${Math.max(0.5, Math.min(2.0, speed))}`);
    }
    if (filter && (AUDIO_FILTERS as any)[filter]) {
      filterParts.push((AUDIO_FILTERS as any)[filter]);
    }

    const afArg = filterParts.length > 0 ? ['-af', filterParts.join(',')] : [];

    const ffmpegArgs = [
      '-reconnect', '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '5',
      '-i', directStreamUrl,
      ...afArg,
      '-f', 'mp3',
      '-ac', '2',
      '-ar', '44100',
      '-b:a', '128k',
      'pipe:1'
    ];

    const proc = spawn('ffmpeg', ffmpegArgs);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');

    proc.stdout.pipe(res);

    proc.on('error', (err) => {
      console.error('[Stream Error]', err);
      if (!res.headersSent) res.status(500).end();
    });

    req.on('close', () => {
      try {
        proc.kill('SIGKILL');
      } catch {}
    });
  } catch (err: any) {
    addLog('error', `Stream failed: ${err.message}`);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// 4. Start / Stop Discord Bot
app.post('/api/bot/start', async (req: Request, res: Response) => {
  const { token, prefix } = req.body;
  const botToken = token || process.env.DISCORD_TOKEN;

  if (!botToken || botToken.trim() === '') {
    return res.status(400).json({ error: 'A Discord Bot Token is required to launch the bot.' });
  }

  if (activeBot && activeBot.isReady()) {
    return res.json({
      success: true,
      message: 'Bot is already running.',
      user: { tag: activeBot.user?.tag, id: activeBot.user?.id }
    });
  }

  try {
    addLog('info', 'Starting Groove Music Bot instance...');
    activeBot = new MusicClient();
    if (prefix) activeBot.prefix = prefix;
    activeBot.config.token = botToken;

    await activeBot.build();

    addLog('info', `Groove Music Bot successfully connected as ${activeBot.user?.tag}!`);
    res.json({
      success: true,
      message: 'Bot started successfully',
      user: {
        tag: activeBot.user?.tag,
        id: activeBot.user?.id,
        avatar: activeBot.user?.displayAvatarURL()
      }
    });
  } catch (err: any) {
    addLog('error', `Failed to start bot: ${err.message}`);
    activeBot = null;
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bot/stop', async (req: Request, res: Response) => {
  if (!activeBot) {
    return res.json({ success: true, message: 'Bot was not running.' });
  }

  try {
    activeBot.playerManager.players.forEach((p) => p.destroy());
    activeBot.destroy();
    activeBot = null;
    addLog('info', 'Groove Music Bot stopped.');
    res.json({ success: true, message: 'Bot stopped.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory bot configuration & guild defaults
let botConfig = {
  prefix: process.env.BOT_PREFIX || '!',
  defaultVolume: 80,
  defaultFilter: 'clear',
  defaultSpeed: 1.0,
  stay247: false,
  autoplay: true,
  emptyChannelTimeout: 3, // minutes
  announceNowPlaying: true,
  voteSkipPercentage: 50,
  maxQueueSize: 250,
  embedColor: '#6366f1',
  djOnlyMode: false
};

// 5. Bot Configuration Management
app.get('/api/bot/config', (req: Request, res: Response) => {
  const activeSessions: any[] = [];
  if (activeBot && activeBot.playerManager) {
    activeBot.playerManager.players.forEach((player, guildId) => {
      const guild = activeBot?.guilds.cache.get(guildId);
      activeSessions.push({
        guildId,
        guildName: guild?.name || 'Discord Server',
        voiceChannelId: player.voiceChannelId,
        textChannelId: player.textChannelId,
        isPlaying: Boolean(player.current && !player.paused),
        currentTrack: player.current ? {
          title: player.current.title,
          author: player.current.author,
          durationFormatted: player.current.durationFormatted
        } : null,
        queueCount: player.queue.length,
        volume: player.volume,
        filter: player.filter,
        speed: player.speed,
        stay247: player.twentyFourSeven,
        autoplay: player.autoplay
      });
    });
  }

  res.json({
    config: botConfig,
    activeSessions,
    availableFilters: Object.keys(AUDIO_FILTERS)
  });
});

app.post('/api/bot/config', (req: Request, res: Response) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Invalid configuration payload' });
  }

  // Update in-memory botConfig
  botConfig = {
    ...botConfig,
    ...updates
  };

  // Sync to activeBot if connected
  if (activeBot) {
    if (botConfig.prefix) activeBot.prefix = botConfig.prefix;
    if (botConfig.embedColor) activeBot.config.embedColor = botConfig.embedColor;

    // Apply defaults to active players if requested
    activeBot.playerManager.players.forEach((player) => {
      if (updates.defaultVolume !== undefined) {
        player.setVolume(updates.defaultVolume);
      }
      if (updates.stay247 !== undefined) {
        player.twentyFourSeven = updates.stay247;
      }
      if (updates.autoplay !== undefined) {
        player.autoplay = updates.autoplay;
      }
    });
  }

  addLog('info', `Bot configuration updated: Prefix=${botConfig.prefix}, Volume=${botConfig.defaultVolume}%, 24/7=${botConfig.stay247 ? 'ON' : 'OFF'}, Autoplay=${botConfig.autoplay ? 'ON' : 'OFF'}`);
  res.json({ success: true, config: botConfig });
});

// Engine Benchmark & Health Diagnostics
app.post('/api/engine/benchmark', async (req: Request, res: Response) => {
  const startTime = Date.now();
  let ytdlpLatency = 0;
  let ffmpegLatency = 0;
  let ytdlpStatus = 'Pass';
  let ffmpegStatus = 'Pass';
  let ytdlpVersion = 'Unknown';
  let ffmpegVersion = 'Unknown';

  try {
    const t0 = Date.now();
    ytdlpVersion = execSync('yt-dlp --version', { timeout: 3000 }).toString().trim();
    ytdlpLatency = Date.now() - t0;
  } catch (err: any) {
    ytdlpStatus = `Fail (${err.message})`;
  }

  try {
    const t0 = Date.now();
    execSync('ffmpeg -f lavfi -i anullsrc=r=48000:cl=stereo -t 0.5 -af "bass=g=12:f=110:w=0.6" -f null -', { timeout: 4000 });
    ffmpegLatency = Date.now() - t0;
    ffmpegVersion = execSync('ffmpeg -version', { timeout: 3000 }).toString().split('\n')[0].replace('ffmpeg version ', '').split(' ')[0];
  } catch (err: any) {
    ffmpegStatus = `Fail (${err.message})`;
  }

  const totalDuration = Date.now() - startTime;
  addLog('info', `Audio engine diagnostics completed: yt-dlp latency=${ytdlpLatency}ms, FFmpeg latency=${ffmpegLatency}ms`);

  res.json({
    success: true,
    diagnostics: {
      timestamp: new Date().toLocaleTimeString(),
      totalDurationMs: totalDuration,
      ytdlp: {
        status: ytdlpStatus,
        version: ytdlpVersion,
        latencyMs: ytdlpLatency
      },
      ffmpeg: {
        status: ffmpegStatus,
        version: ffmpegVersion,
        latencyMs: ffmpegLatency,
        transcodePipeline: '48kHz 16-bit Stereo PCM (Direct Opus Stream)'
      }
    }
  });
});

// 6. Bot Logs
app.get('/api/bot/logs', (req: Request, res: Response) => {
  res.json({ logs: botLogs });
});

// 6. Bot Codebase File Explorer
app.get('/api/bot/files', (req: Request, res: Response) => {
  const botRoot = path.join(process.cwd(), 'bot');

  function getFileList(dir: string, baseDir: string = ''): Array<{ path: string; name: string; isDir: boolean }> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let results: Array<{ path: string; name: string; isDir: boolean }> = [];

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const relPath = path.join(baseDir, entry.name);
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        results.push({ path: relPath, name: entry.name, isDir: true });
        results = results.concat(getFileList(fullPath, relPath));
      } else {
        results.push({ path: relPath, name: entry.name, isDir: false });
      }
    }
    return results;
  }

  try {
    const files = getFileList(botRoot);
    res.json({ files });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bot/file-content', (req: Request, res: Response) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'File path required' });

  const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  const fullPath = path.join(process.cwd(), 'bot', safePath);

  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    return res.status(404).json({ error: 'File not found' });
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  res.json({ path: safePath, content });
});

// 7. Download Complete Converted Bot ZIP
app.get('/api/download-bot', (req: Request, res: Response) => {
  const botDir = path.join(process.cwd(), 'bot');
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="Groove-Music-Ytdlp-FFmpeg.zip"');

  const archive = new archiver.ZipArchive({ zlib: { level: 9 } });

  archive.on('error', (err: any) => {
    res.status(500).send({ error: err.message });
  });

  archive.pipe(res);
  archive.directory(botDir, false);
  archive.finalize();
});

// Start Server with Vite or Static
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dashboard] Groove Music Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
