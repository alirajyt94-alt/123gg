export default {
  name: 'replay',
  description: 'Restart the current track from the beginning',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Nothing is currently playing!` })]
      });
    }

    await player.seek(0);
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.previous} Replaying **${player.current.title}** from the beginning!` })]
    });
  }
};
