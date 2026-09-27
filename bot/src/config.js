import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rawConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

export const config = {
  ...rawConfig,
  token: process.env.DISCORD_TOKEN || rawConfig.token,
  prefix: process.env.BOT_PREFIX || rawConfig.prefix,
  ownerIds: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : rawConfig.ownerIds,
  engine: {
    ...rawConfig.engine,
    ytdlpPath: process.env.YTDLP_PATH || rawConfig.engine.ytdlpPath,
    ffmpegPath: process.env.FFMPEG_PATH || rawConfig.engine.ffmpegPath,
  }
};

export default config;
