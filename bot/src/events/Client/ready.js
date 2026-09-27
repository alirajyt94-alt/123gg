import { ActivityType } from 'discord.js';

export default async function ready(client) {
  console.log(`[Groove-Music] Logged in as ${client.user.tag}!`);
  console.log(`[Groove-Music] Serving ${client.guilds.cache.size} guilds with yt-dlp & FFmpeg engine.`);

  client.user.setPresence({
    activities: [
      {
        name: `${client.prefix}play | Groove Music (yt-dlp + FFmpeg)`,
        type: ActivityType.Listening
      }
    ],
    status: 'online'
  });
}
