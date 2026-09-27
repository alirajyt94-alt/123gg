export default async function playerEmpty(client, player) {
  if (!player.textChannelId) return;

  const channel = client.channels.cache.get(player.textChannelId);
  if (!channel) return;

  const embed = client.embed({
    title: `${client.config.emojis.warn || '⚠️'} Queue Finished`,
    description: player.twentyFourSeven
      ? 'The queue is now empty. **24/7 Mode** is enabled, so I will stay in the voice channel.'
      : 'The queue is now empty. Leaving voice channel in 3 minutes if no more songs are added.'
  });

  try {
    await channel.send({ embeds: [embed] });
  } catch {}
}
