import { MusicClient } from './src/structures/MusicClient.js';
import config from './src/config.js';

console.log('='.repeat(60));
console.log(' GROOVE MUSIC BOT - POWERED BY YT-DLP & FFMPEG');
console.log(' Zero Lavalink Architecture • Direct @discordjs/voice Streaming');
console.log('='.repeat(60));

const client = new MusicClient();

client.build().catch((err) => {
  console.error('[Groove-Music Fatal Error]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

export default client;
