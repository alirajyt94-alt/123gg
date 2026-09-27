export default {
  name: 'artistradio',
  aliases: ['ar'],
  description: 'Queue top radio tracks by a specific artist',
  usage: '!artistradio <artist name>',
  category: 'Music',
  async run(client, message, args) {
    if (!args.length) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: 'Please specify an artist!' })]
      });
    }

    const artist = args.join(' ');
    const msg = await message.reply({
      embeds: [client.embed({ description: `Curating radio station for **${artist}**...` })]
    });

    try {
      const tracks = await client.playerManager.search(`${artist} greatest hits audio`, 5);
      if (!tracks.length) {
        return msg.edit({
          embeds: [client.embed({ color: '#ef4444', description: `No songs found for ${artist}.` })]
        });
      }

      let player = client.playerManager.get(message.guild.id);
      if (!player) {
        player = await client.playerManager.create({
          guildId: message.guild.id,
          voiceChannelId: message.member.voice.channel.id,
          textChannelId: message.channel.id
        });
      }

      tracks.forEach(t => {
        t.requester = message.author.id;
        player.queue.push(t);
      });

      if (!player.current) await player.play();

      msg.edit({
        embeds: [
          client.embed({
            title: `📻 Artist Radio: ${artist}`,
            description: `Added **${tracks.length}** hit tracks by **${artist}** to the queue!`
          })
        ]
      });
    } catch (err) {
      msg.edit({ embeds: [client.embed({ color: '#ef4444', description: err.message })] });
    }
  }
};
