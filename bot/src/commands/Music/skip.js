export default {
  name: 'skip',
  aliases: ['s'],
  description: 'Skip to the next song in the queue',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Nothing is playing to skip!` })]
      });
    }

    const skipped = player.current.title;
    player.skip();

    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.skip} Skipped **${skipped}**` })]
    });
  }
};
