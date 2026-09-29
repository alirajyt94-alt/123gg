import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import http from 'http';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Finds the project root and bin directories
 */
export function getBinDir() {
  // Check common bin directories: ./bin, ../bin, ../../bin, bot/bin
  const candidates = [
    path.resolve(process.cwd(), 'bin'),
    path.resolve(process.cwd(), 'bot', 'bin'),
    path.resolve(__dirname, '..', '..', '..', 'bin'),
    path.resolve(__dirname, '..', '..', 'bin')
  ];

  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }

  // Default to process.cwd()/bin
  const defaultBin = path.resolve(process.cwd(), 'bin');
  if (!fs.existsSync(defaultBin)) {
    fs.mkdirSync(defaultBin, { recursive: true });
  }
  return defaultBin;
}

/**
 * Checks if a binary is executable and returns its version
 */
export function testBinary(binaryPath, versionArg = '--version') {
  try {
    const res = spawnSync(binaryPath, [versionArg], {
      timeout: 4000,
      encoding: 'utf-8',
      env: { ...process.env, PATH: `${getBinDir()}:${process.env.PATH}` }
    });
    if (res.status === 0 || (res.stdout && res.stdout.trim())) {
      const output = (res.stdout || res.stderr || '').trim().split('\n')[0];
      return output;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Locates an existing binary in PATH or local bin directory
 */
export function findBinary(name) {
  const isWin = process.platform === 'win32';
  const binName = isWin && !name.endsWith('.exe') ? `${name}.exe` : name;

  // 1. Check environment variable override
  if (name.includes('ytdlp') || name.includes('yt-dlp')) {
    if (process.env.YTDLP_PATH && fs.existsSync(process.env.YTDLP_PATH)) {
      return process.env.YTDLP_PATH;
    }
  }
  if (name.includes('ffmpeg')) {
    if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
      return process.env.FFMPEG_PATH;
    }
  }

  // 2. Check local bin directories
  const binDir = getBinDir();
  const localPath = path.join(binDir, binName);
  if (fs.existsSync(localPath)) {
    try {
      if (!isWin) fs.chmodSync(localPath, 0o755);
    } catch {}
    if (testBinary(localPath)) return localPath;
  }

  // Also check bot/bin
  const botBinPath = path.resolve(process.cwd(), 'bot', 'bin', binName);
  if (fs.existsSync(botBinPath)) {
    try {
      if (!isWin) fs.chmodSync(botBinPath, 0o755);
    } catch {}
    if (testBinary(botBinPath)) return botBinPath;
  }

  // 3. Check system PATH
  const versionArg = name.includes('ffmpeg') ? '-version' : '--version';
  const sysVersion = testBinary(binName, versionArg);
  if (sysVersion) {
    try {
      const whichCmd = isWin ? `where ${binName}` : `command -v ${binName} || which ${binName}`;
      const foundPath = execSync(whichCmd, { encoding: 'utf-8', shell: '/bin/bash' }).trim().split('\n')[0].trim();
      if (foundPath && fs.existsSync(foundPath)) return foundPath;
    } catch {}
    return binName; // Available in PATH
  }

  return null;
}

/**
 * Resolves platform-specific direct download URLs
 */
export function getBinaryDownloadUrls() {
  const platform = process.platform;
  const arch = process.arch;

  let ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
  let ffmpegUrl = 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64';

  if (platform === 'linux') {
    if (arch === 'arm64' || arch === 'aarch64') {
      ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_aarch64';
      ffmpegUrl = 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-arm64';
    } else if (arch === 'arm') {
      ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux_armv7l';
      ffmpegUrl = 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-arm';
    } else {
      ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
      ffmpegUrl = 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-linux-x64';
    }
  } else if (platform === 'darwin') {
    ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
    ffmpegUrl = arch === 'arm64'
      ? 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-arm64'
      : 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-darwin-x64';
  } else if (platform === 'win32') {
    ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    ffmpegUrl = 'https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/ffmpeg-win32-x64';
  }

  return { ytdlpUrl, ffmpegUrl };
}

/**
 * Downloads a file with support for HTTP 301/302 redirects
 */
export function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const tmpPath = `${destPath}.tmp.${Date.now()}`;
    const fileStream = fs.createWriteStream(tmpPath);

    function get(currentUrl, redirectCount = 0) {
      if (redirectCount > 10) {
        fileStream.close();
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        return reject(new Error('Too many redirects while downloading ' + url));
      }

      const client = currentUrl.startsWith('https') ? https : http;
      const req = client.get(currentUrl, {
        headers: {
          'User-Agent': 'GrooveMusicBot-VPS-AutoInstaller/2.0'
        }
      }, (res) => {
        // Handle HTTP 3xx Redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, currentUrl).toString();
          return get(redirectUrl, redirectCount + 1);
        }

        if (res.statusCode !== 200) {
          fileStream.close();
          if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
          return reject(new Error(`Failed to download ${url}: HTTP status ${res.statusCode}`));
        }

        const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;
        let lastReport = 0;

        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const now = Date.now();
          if (onProgress && now - lastReport > 600) {
            lastReport = now;
            const percent = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
            const mb = (downloadedBytes / (1024 * 1024)).toFixed(1);
            const totalMb = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : '?';
            onProgress({ downloadedBytes, totalBytes, percent, message: `${mb} MB / ${totalMb} MB (${percent}%)` });
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => {
            try {
              if (process.platform !== 'win32') {
                fs.chmodSync(tmpPath, 0o755);
              }
              if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
              }
              fs.renameSync(tmpPath, destPath);
              resolve(destPath);
            } catch (err) {
              reject(err);
            }
          });
        });
      });

      req.on('error', (err) => {
        fileStream.close();
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        reject(err);
      });

      req.setTimeout(90000, () => {
        req.destroy();
        fileStream.close();
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        reject(new Error('Download timed out after 90 seconds.'));
      });
    }

    get(url);
  });
}

/**
 * Ensures both yt-dlp and ffmpeg are installed and ready.
 * If missing, downloads them automatically into the bin/ directory.
 */
export async function ensureBinaries(options = {}) {
  const { force = false, onProgress = console.log } = options;
  const binDir = getBinDir();
  const isWin = process.platform === 'win32';

  // Ensure binDir is in PATH
  if (!process.env.PATH?.includes(binDir)) {
    process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH}`;
  }

  const { ytdlpUrl, ffmpegUrl } = getBinaryDownloadUrls();
  const targetYtdlp = path.join(binDir, isWin ? 'yt-dlp.exe' : 'yt-dlp');
  const targetFfmpeg = path.join(binDir, isWin ? 'ffmpeg.exe' : 'ffmpeg');

  let currentYtdlp = force ? null : findBinary('yt-dlp');
  let currentFfmpeg = force ? null : findBinary('ffmpeg');

  const result = {
    ytdlpPath: currentYtdlp,
    ffmpegPath: currentFfmpeg,
    ytdlpVersion: null,
    ffmpegVersion: null,
    downloadedYtdlp: false,
    downloadedFfmpeg: false,
    success: true
  };

  // 1. Handle yt-dlp
  if (!currentYtdlp || force) {
    onProgress(`[Auto-Installer] yt-dlp missing or update requested. Downloading from ${ytdlpUrl}...`);
    try {
      await downloadFile(ytdlpUrl, targetYtdlp, (p) => {
        onProgress(`[Auto-Installer] Downloading yt-dlp: ${p.message}`);
      });
      if (process.platform !== 'win32') fs.chmodSync(targetYtdlp, 0o755);
      result.downloadedYtdlp = true;
      currentYtdlp = targetYtdlp;
      onProgress(`[Auto-Installer] ✓ yt-dlp successfully downloaded to ${targetYtdlp}`);
    } catch (err) {
      onProgress(`[Auto-Installer] ⚠️ Failed to download yt-dlp: ${err.message}`);
      result.success = false;
    }
  }

  // 2. Handle FFmpeg
  if (!currentFfmpeg || force) {
    onProgress(`[Auto-Installer] FFmpeg missing or update requested. Downloading static binary from ${ffmpegUrl}...`);
    try {
      await downloadFile(ffmpegUrl, targetFfmpeg, (p) => {
        onProgress(`[Auto-Installer] Downloading FFmpeg: ${p.message}`);
      });
      if (process.platform !== 'win32') fs.chmodSync(targetFfmpeg, 0o755);
      result.downloadedFfmpeg = true;
      currentFfmpeg = targetFfmpeg;
      onProgress(`[Auto-Installer] ✓ FFmpeg successfully downloaded to ${targetFfmpeg}`);
    } catch (err) {
      onProgress(`[Auto-Installer] ⚠️ Failed to download FFmpeg: ${err.message}`);
      result.success = false;
    }
  }

  // Update PATH and result
  result.ytdlpPath = currentYtdlp || targetYtdlp;
  result.ffmpegPath = currentFfmpeg || targetFfmpeg;

  // Set environment variable overrides for child processes
  process.env.YTDLP_PATH = result.ytdlpPath;
  process.env.FFMPEG_PATH = result.ffmpegPath;

  // Measure versions
  try {
    result.ytdlpVersion = testBinary(result.ytdlpPath, '--version') || 'Installed';
  } catch {}
  try {
    const rawFf = testBinary(result.ffmpegPath, '-version') || '';
    result.ffmpegVersion = rawFf.split('\n')[0].replace('ffmpeg version ', '').split(' ')[0] || 'Installed';
  } catch {}

  onProgress(`[Auto-Installer] System Ready: yt-dlp (${result.ytdlpVersion}) at ${result.ytdlpPath} | FFmpeg (${result.ffmpegVersion}) at ${result.ffmpegPath}`);

  return result;
}

// Standalone execution: node binaryInstaller.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('='.repeat(60));
  console.log(' GROOVE MUSIC - AUTO VPS BINARY INSTALLER');
  console.log(' Downloading and verifying yt-dlp & FFmpeg static binaries');
  console.log('='.repeat(60));

  ensureBinaries({ force: process.argv.includes('--force') })
    .then((res) => {
      console.log('\n[Auto-Installer Summary]');
      console.log('yt-dlp Location:', res.ytdlpPath, `(${res.ytdlpVersion})`);
      console.log('FFmpeg Location:', res.ffmpegPath, `(${res.ffmpegVersion})`);
      console.log('Status: All audio dependencies ready!');
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('[Auto-Installer Fatal Error]:', err);
      process.exit(1);
    });
}
