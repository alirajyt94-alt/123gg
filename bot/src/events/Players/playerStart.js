import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export default async function playerStart(client, player, track) {
  if (!player.textChannelId) return;

  const channel = client.channels.cache.get(player.textChannelId);
  if (!channel) return;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`pause_${player.guildId}`)
      .setLabel('Play/Pause')
      .setEmoji(client.config.emojis.pause || '⏸️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`skip_${player.guildId}`)
      .setLabel('Skip')
      .setEmoji(client.config.emojis.skip || '⏭️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`loop_${player.guildId}`)
      .setLabel('Loop')
      .setEmoji(client.config.emojis.loop || '🔁')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`shuffle_${player.guildId}`)
      .setLabel('Shuffle')
      .setEmoji(client.config.emojis.shuffle || '🔀')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`stop_${player.guildId}`)
      .setLabel('Stop')
      .setEmoji(client.config.emojis.stop || '⏹️')
      .setStyle(ButtonStyle.Danger)
  );

  const embed = client.embed({
    title: `${client.config.emojis.music || '🎵'} Now Playing`,
    description: `[**${track.title}**](${track.url})`,
    fields: [
      { name: 'Author', value: track.author || 'Unknown', inline: true },
      { name: 'Duration', value: track.durationFormatted || '00:00', inline: true },
      { name: 'Requested By', value: track.requester ? `<@${track.requester}>` : 'Unknown', inline: true },
      { name: 'Engine', value: '`yt-dlp` + `FFmpeg`', inline: true },
      { name: 'Active Filter', value: `\`${player.filter || 'None'}\``, inline: true },
      { name: 'Volume', value: `\`${player.volume}%\``, inline: true }
    ],
    thumbnail: track.thumbnail ? { url: track.thumbnail } : null
  });

  try {
    const msg = await channel.send({ embeds: [embed], components: [row] });
    // Cleanup old message if tracked
    player.nowPlayingMessage = msg;
  } catch (err) {
    console.error('[playerStart] Error sending embed:', err.message);
  }
}
