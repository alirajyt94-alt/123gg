export default {
  name: 'skipto',
  aliases: ['st'],
  description: 'Skip to a specific track index in the queue',
  usage: '!skipto <number>',
  category: 'Music',
  async run(client, message, args) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Nothing is currently playing!` })]
      });
    }

    const index = parseInt(args[0], 10);
    if (isNaN(index) || index < 1 || index > player.queue.length) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Please provide a valid queue index between 1 and ${player.queue.length}!` })]
      });
    }

    player.skipto(index);
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.skip} Skipped to track #${index}!` })]
    });
  }
};
