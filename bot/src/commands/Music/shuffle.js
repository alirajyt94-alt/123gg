export default {
  name: 'shuffle',
  description: 'Randomly shuffle the music queue',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.queue.length) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} There are not enough songs in queue to shuffle!` })]
      });
    }

    player.shuffle();
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.shuffle} Shuffled **${player.queue.length}** songs in queue!` })]
    });
  }
};
