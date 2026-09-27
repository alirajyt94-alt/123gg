export default {
  name: 'stop',
  description: 'Stop playback, clear the queue, and disconnect',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} There is no active music player in this server!` })]
      });
    }

    player.destroy();
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.stop} Stopped playback and left voice channel.` })]
    });
  }
};
