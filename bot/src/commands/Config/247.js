export default {
  name: '247',
  aliases: ['stay', '24/7'],
  description: 'Toggle 24/7 mode so the bot never leaves the voice channel',
  category: 'Config',
  async run(client, message) {
    let player = client.playerManager.get(message.guild.id);

    if (!player) {
      if (!message.member.voice.channel) {
        return message.reply({
          embeds: [client.embed({ color: '#ef4444', description: 'Join a voice channel first to enable 24/7 mode!' })]
        });
      }

      player = await client.playerManager.create({
        guildId: message.guild.id,
        voiceChannelId: message.member.voice.channel.id,
        textChannelId: message.channel.id
      });
    }

    player.twentyFourSeven = !player.twentyFourSeven;

    message.reply({
      embeds: [
        client.embed({
          title: '🕒 24/7 Voice Channel Mode',
          description: `24/7 Mode is now **${player.twentyFourSeven ? 'ACTIVATED' : 'DEACTIVATED'}**.\n${player.twentyFourSeven ? 'The bot will remain connected even when the queue finishes.' : 'The bot will disconnect after 3 minutes of inactivity.'}`
        })
      ]
    });
  }
};
