export default {
  name: 'forceskip',
  aliases: ['fs'],
  description: 'Force skip the current song without voting',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Nothing is playing to skip!` })]
      });
    }

    const title = player.current.title;
    player.skip();

    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.skip} Force skipped **${title}**!` })]
    });
  }
};
