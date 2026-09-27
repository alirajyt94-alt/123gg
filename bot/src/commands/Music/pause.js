export default {
  name: 'pause',
  description: 'Pause the currently playing track',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Nothing is currently playing!` })]
      });
    }

    if (player.paused) {
      return message.reply({
        embeds: [client.embed({ color: '#f59e0b', description: `${client.config.emojis.warn} The playback is already paused!` })]
      });
    }

    player.pause();
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.pause} Paused **${player.current.title}**` })]
    });
  }
};
