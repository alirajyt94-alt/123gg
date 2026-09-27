export default {
  name: 'join',
  aliases: ['connect', 'j'],
  description: 'Connect the bot to your current voice channel',
  category: 'Music',
  async run(client, message) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: 'You must join a voice channel first!' })]
      });
    }

    let player = client.playerManager.get(message.guild.id);
    if (player) {
      return message.reply({
        embeds: [client.embed({ description: `Already connected to <#${player.voiceChannelId}>!` })]
      });
    }

    try {
      player = await client.playerManager.create({
        guildId: message.guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: message.channel.id
      });

      message.reply({
        embeds: [client.embed({ description: `${client.config.emojis.success} Connected to <#${voiceChannel.id}>!` })]
      });
    } catch (err) {
      message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `Could not connect: ${err.message}` })]
      });
    }
  }
};
