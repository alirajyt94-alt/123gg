export default {
  name: 'nowplaying',
  aliases: ['np'],
  description: 'Show details and progress of the currently playing track',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Nothing is currently playing!` })]
      });
    }

    const track = player.current;
    const currentMs = player.getPosition();
    const currentSec = Math.floor(currentMs / 1000);
    const totalSec = track.duration || 1;

    const progressPercent = Math.min(1, currentSec / totalSec);
    const totalBars = 16;
    const filledBars = Math.round(progressPercent * totalBars);
    const emptyBars = totalBars - filledBars;
    const progressBar = '▬'.repeat(Math.max(0, filledBars)) + '🔘' + '▬'.repeat(Math.max(0, emptyBars));

    const currentFormatted = client.playerManager.engine.formatDuration(currentSec);

    message.reply({
      embeds: [
        client.embed({
          title: `${client.config.emojis.headphones || '🎧'} Now Playing`,
          description: `[**${track.title}**](${track.url})\n\n\`${currentFormatted}\` ${progressBar} \`${track.durationFormatted}\``,
          fields: [
            { name: 'Channel / Author', value: track.author || 'Unknown', inline: true },
            { name: 'Audio Engine', value: '`yt-dlp` + `FFmpeg`', inline: true },
            { name: 'Active Filter', value: `\`${player.filter || 'None'}\``, inline: true },
            { name: 'Volume', value: `\`${player.volume}%\``, inline: true },
            { name: 'Speed', value: `\`${player.speed}x\``, inline: true },
            { name: 'Loop Mode', value: `\`${player.loop}\``, inline: true }
          ],
          thumbnail: track.thumbnail ? { url: track.thumbnail } : null
        })
      ]
    });
  }
};
