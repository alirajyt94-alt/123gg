import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  const commandsDir = path.join(__dirname, '..', 'commands');
  if (!fs.existsSync(commandsDir)) return;

  const categories = fs.readdirSync(commandsDir);

  for (const category of categories) {
    const categoryPath = path.join(commandsDir, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    client.categories.add(category);
    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      try {
        const filePath = path.join(categoryPath, file);
        const fileUrl = pathToFileURL(filePath).href;
        const module = await import(fileUrl);
        const command = module.default || module;

        if (command && command.name) {
          command.category = category;
          client.commands.set(command.name.toLowerCase(), command);

          if (command.aliases && Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
              client.aliases.set(alias.toLowerCase(), command);
            }
          }
        }
      } catch (err) {
        console.error(`[loadCommands] Failed to load command ${category}/${file}:`, err.message);
      }
    }
  }

  console.log(`[Groove-Music] Loaded ${client.commands.size} commands across ${client.categories.size} categories.`);
}

export default loadCommands;
