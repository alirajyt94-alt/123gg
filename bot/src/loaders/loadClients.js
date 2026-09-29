import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Events } from 'discord.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadClients(client) {
  const eventsDir = path.join(__dirname, '..', 'events', 'Client');
  if (!fs.existsSync(eventsDir)) return;

  const files = fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    try {
      const filePath = path.join(eventsDir, file);
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      const event = module.default || module;

      let eventName = file.split('.')[0];
      if (eventName === 'ready') {
        eventName = Events?.ClientReady || 'clientReady';
      }

      if (typeof event === 'function') {
        client.on(eventName, event.bind(null, client));
      } else if (event.name && typeof event.run === 'function') {
        const targetName = event.name === 'ready' ? (Events?.ClientReady || 'clientReady') : event.name;
        if (event.once) {
          client.once(targetName, (...args) => event.run(client, ...args));
        } else {
          client.on(targetName, (...args) => event.run(client, ...args));
        }
      }
    } catch (err) {
      console.error(`[loadClients] Failed to load event ${file}:`, err.message);
    }
  }
}

export default loadClients;
