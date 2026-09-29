import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findBinary } from './utils/binaryInstaller.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

const resolvedYtdlp = process.env.YTDLP_PATH || findBinary('yt-dlp') || rawConfig.engine?.ytdlpPath || 'yt-dlp';
const resolvedFfmpeg = process.env.FFMPEG_PATH || findBinary('ffmpeg') || rawConfig.engine?.ffmpegPath || 'ffmpeg';

export const config = {
  ...rawConfig,
  token: process.env.DISCORD_TOKEN || rawConfig.token,
  prefix: process.env.BOT_PREFIX || rawConfig.prefix,
  ownerIds: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',').map(s => s.trim()) : rawConfig.ownerIds,
  engine: {
    ...rawConfig.engine,
    ytdlpPath: resolvedYtdlp,
    ffmpegPath: resolvedFfmpeg,
  }
};

export default config;
