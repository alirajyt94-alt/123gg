export default {
  name: 'resume',
  description: 'Resume the paused track',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Nothing is currently playing!` })]
      });
    }

    if (!player.paused) {
      return message.reply({
        embeds: [client.embed({ color: '#f59e0b', description: `${client.config.emojis.warn} The playback is not paused!` })]
      });
    }

    player.resume();
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.play} Resumed **${player.current.title}**` })]
    });
  }
};
