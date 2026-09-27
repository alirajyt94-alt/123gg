export default {
  name: 'clearqueue',
  aliases: ['clear', 'cq'],
  description: 'Remove all tracks from the queue',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.queue.length) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} The queue is already empty!` })]
      });
    }

    const removed = player.clearQueue();
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.success} Cleared **${removed}** songs from the queue!` })]
    });
  }
};
