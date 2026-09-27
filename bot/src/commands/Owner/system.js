import os from 'os';
import { execSync } from 'child_process';

export default {
  name: 'system',
  aliases: ['node', 'sys', 'engine'],
  description: 'View host system, yt-dlp & FFmpeg engine metrics (replaces legacy Lavalink node command)',
  category: 'Owner',
  async run(client, message) {
    let ytdlpVer = 'Unknown';
    let ffmpegVer = 'Unknown';

    try {
      ytdlpVer = execSync('yt-dlp --version', { timeout: 3000 }).toString().trim();
    } catch {}

    try {
      ffmpegVer = execSync('ffmpeg -version', { timeout: 3000 }).toString().split('\n')[0].replace('ffmpeg version ', '').split(' ')[0];
    } catch {}

    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    const usedMem = totalMem - freeMem;
    const processMem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    const activePlayers = client.playerManager.players.size;
    let playingTracks = 0;
    client.playerManager.players.forEach(p => {
      if (p.current && !p.paused) playingTracks++;
    });

    message.reply({
      embeds: [
        client.embed({
          title: '🚀 Groove Music Audio Engine & System Metrics',
          description: '**Lavalink Removed**: Running pure direct `@discordjs/voice` with `yt-dlp` and `FFmpeg`!',
          fields: [
            { name: 'yt-dlp Engine', value: `\`v${ytdlpVer}\``, inline: true },
            { name: 'FFmpeg Core', value: `\`v${ffmpegVer}\``, inline: true },
            { name: 'Bot Latency', value: `\`${Math.round(client.ws.ping)}ms\``, inline: true },
            { name: 'Active Players', value: `\`${activePlayers} guilds\``, inline: true },
            { name: 'Playing Streams', value: `\`${playingTracks} streams\``, inline: true },
            { name: 'Node.js Heap', value: `\`${processMem} MB\``, inline: true },
            { name: 'System RAM', value: `\`${usedMem}MB / ${totalMem}MB\``, inline: true },
            { name: 'Platform', value: `\`${os.type()} (${os.arch()})\``, inline: true },
            { name: 'CPU Cores', value: `\`${os.cpus().length} Cores\``, inline: true }
          ]
        })
      ]
    });
  }
};
