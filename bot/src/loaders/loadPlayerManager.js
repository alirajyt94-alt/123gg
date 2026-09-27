import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadPlayerManager(client) {
  const playersDir = path.join(__dirname, '..', 'events', 'Players');
  if (!fs.existsSync(playersDir)) return;

  const files = fs.readdirSync(playersDir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    try {
      const filePath = path.join(playersDir, file);
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      const event = module.default || module;

      const eventName = file.split('.')[0];
      if (typeof event === 'function') {
        client.playerManager.on(eventName, event.bind(null, client));
      } else if (event.name && typeof event.run === 'function') {
        client.playerManager.on(event.name, (...args) => event.run(client, ...args));
      }
    } catch (err) {
      console.error(`[loadPlayerManager] Failed to load player event ${file}:`, err.message);
    }
  }

  console.log('[Groove-Music] Player Manager initialized with native yt-dlp & FFmpeg pipeline.');
}

export default loadPlayerManager;
