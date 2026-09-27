export default {
  name: 'grab',
  aliases: ['save'],
  description: 'Direct message you the currently playing track details',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: 'Nothing is currently playing!' })]
      });
    }

    const track = player.current;
    try {
      await message.author.send({
        embeds: [
          client.embed({
            title: `🎵 Saved Track from ${message.guild.name}`,
            description: `[**${track.title}**](${track.url})`,
            fields: [
              { name: 'Artist', value: track.author, inline: true },
              { name: 'Duration', value: track.durationFormatted, inline: true },
              { name: 'Server', value: message.guild.name, inline: true }
            ],
            thumbnail: track.thumbnail ? { url: track.thumbnail } : null
          })
        ]
      });

      message.react('📩').catch(() => {});
    } catch {
      message.reply({
        embeds: [client.embed({ color: '#ef4444', description: 'Could not send you a direct message. Please check your privacy settings.' })]
      });
    }
  }
};
