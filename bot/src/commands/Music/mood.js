export default {
  name: 'mood',
  description: 'Queue a mood playlist (chill, lofi, gaming, workout, party)',
  usage: '!mood <chill/lofi/gaming/workout/party>',
  category: 'Music',
  async run(client, message, args) {
    const moods = {
      chill: 'chill vibes acoustic playlist',
      lofi: 'lofi hip hop radio beats to relax study to',
      gaming: 'synthwave cyberpunk gaming playlist',
      workout: 'high energy workout motivation playlist',
      party: 'club edm dance party hits'
    };

    const choice = args[0]?.toLowerCase() || 'lofi';
    const query = moods[choice] || moods.lofi;

    const msg = await message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.music} Finding **${choice.toUpperCase()}** radio station...` })]
    });

    try {
      const tracks = await client.playerManager.search(query, 1);
      if (!tracks.length) {
        return msg.edit({
          embeds: [client.embed({ color: '#ef4444', description: 'Could not locate mood playlist stream.' })]
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

      const track = tracks[0];
      track.requester = message.author.id;
      player.queue.push(track);
      if (!player.current) await player.play();

      msg.edit({
        embeds: [
          client.embed({
            title: `🎵 Mood Station: ${choice.toUpperCase()}`,
            description: `Now streaming: [**${track.title}**](${track.url})`
          })
        ]
      });
    } catch (err) {
      msg.edit({ embeds: [client.embed({ color: '#ef4444', description: err.message })] });
    }
  }
};
