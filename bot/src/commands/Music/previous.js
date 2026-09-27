export default {
  name: 'previous',
  aliases: ['prev'],
  description: 'Play the previously played song from history',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} No active player found!` })]
      });
    }

    if (!player.history.length) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} There are no previously played songs in history!` })]
      });
    }

    const prevTrack = player.history.shift();
    if (player.current) {
      player.queue.unshift(player.current);
    }

    await player.play({ track: prevTrack });
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.previous} Playing previous track: [**${prevTrack.title}**](${prevTrack.url})` })]
    });
  }
};
