export default {
  name: 'leave',
  aliases: ['disconnect', 'dc'],
  description: 'Disconnect the bot from the voice channel',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: 'I am not in a voice channel!' })]
      });
    }

    player.destroy();
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.success} Disconnected from voice channel.` })]
    });
  }
};
