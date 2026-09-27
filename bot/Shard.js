import { ShardingManager } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './src/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!config.token || config.token === 'YOUR_DISCORD_BOT_TOKEN_HERE') {
  console.error('[Groove Shard Manager] Error: Please provide a valid DISCORD_TOKEN in .env or config.json');
  process.exit(1);
}

const manager = new ShardingManager(path.join(__dirname, 'index.js'), {
  token: config.token,
  totalShards: 'auto',
  respawn: true
});

manager.on('shardCreate', (shard) => {
  console.log(`[Groove Shard Manager] Launched shard #${shard.id}`);
});

manager.spawn().catch((err) => {
  console.error('[Groove Shard Manager] Failed to spawn shards:', err);
});
