export default {
  name: 'autoplay',
  aliases: ['ap'],
  description: 'Toggle automatic recommendation playback when the queue ends',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} No active player found!` })]
      });
    }

    player.autoplay = !player.autoplay;
    message.reply({
      embeds: [
        client.embed({
          description: `${client.config.emojis.sparkles} Autoplay is now **${player.autoplay ? 'ENABLED' : 'DISABLED'}**!`
        })
      ]
    });
  }
};
