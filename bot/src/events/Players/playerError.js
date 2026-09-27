export default async function playerError(client, player, error) {
  if (!player.textChannelId) return;

  const channel = client.channels.cache.get(player.textChannelId);
  if (!channel) return;

  const embed = client.embed({
    color: '#ef4444',
    title: `${client.config.emojis.error || '❌'} Playback Error`,
    description: `An audio streaming error occurred: \`${error.message || 'Stream disrupted'}\`. Skipping to next track...`
  });

  try {
    await channel.send({ embeds: [embed] });
  } catch {}
}
