import { MusicClient } from './src/structures/MusicClient.js';
import { ensureBinaries } from './src/utils/binaryInstaller.js';
import config from './src/config.js';

console.log('='.repeat(60));
console.log(' GROOVE MUSIC BOT - POWERED BY YT-DLP & FFMPEG');
console.log(' Zero Lavalink Architecture • Direct @discordjs/voice Streaming');
console.log('='.repeat(60));

async function start() {
  try {
    console.log('[Auto-Installer] Verifying audio engine binaries (yt-dlp & FFmpeg)...');
    await ensureBinaries({
      onProgress: (msg) => console.log(msg)
    });
  } catch (err) {
    console.warn('[Auto-Installer Warning] Binary verification error:', err.message);
  }

  const client = new MusicClient();
  await client.build();
  return client;
}

const clientPromise = start().catch((err) => {
  console.error('[Groove-Music Fatal Error]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

export default clientPromise;
