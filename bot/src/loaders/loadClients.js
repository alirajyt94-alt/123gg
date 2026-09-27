import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

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

      const eventName = file.split('.')[0];
      if (typeof event === 'function') {
        client.on(eventName, event.bind(null, client));
      } else if (event.name && typeof event.run === 'function') {
        if (event.once) {
          client.once(event.name, (...args) => event.run(client, ...args));
        } else {
          client.on(event.name, (...args) => event.run(client, ...args));
        }
      }
    } catch (err) {
      console.error(`[loadClients] Failed to load event ${file}:`, err.message);
    }
  }
}

export default loadClients;
