export default {
  name: 'play',
  aliases: ['p'],
  description: 'Play a song or playlist using yt-dlp & FFmpeg',
  usage: '!play <song name or URL>',
  category: 'Music',
  async run(client, message, args) {
    if (!args.length) {
      return message.reply({
        embeds: [
          client.embed({
            color: '#ef4444',
            description: `${client.config.emojis.error} Please provide a song name or URL to play! Example: \`${client.prefix}play blinding lights\``
          })
        ]
      });
    }

    const query = args.join(' ');
    const voiceChannel = message.member.voice.channel;

    const searchingMsg = await message.reply({
      embeds: [
        client.embed({
          color: '#6366f1',
          description: `${client.config.emojis.search || '🔍'} Searching for **${query}** using \`yt-dlp\`...`
        })
      ]
    });

    try {
      // 1. Search tracks with yt-dlp engine
      const tracks = await client.playerManager.search(query, 5);

      if (!tracks || !tracks.length) {
        return searchingMsg.edit({
          embeds: [
            client.embed({
              color: '#ef4444',
              description: `${client.config.emojis.error} No results found for **${query}**.`
            })
          ]
        });
      }

      const selectedTrack = tracks[0];
      selectedTrack.requester = message.author.id;

      // 2. Get or create player
      let player = client.playerManager.get(message.guild.id);
      if (!player) {
        player = await client.playerManager.create({
          guildId: message.guild.id,
          voiceChannelId: voiceChannel.id,
          textChannelId: message.channel.id
        });
      }

      // 3. If currently playing, add to queue
      if (player.current) {
        player.queue.push(selectedTrack);
        return searchingMsg.edit({
          embeds: [
            client.embed({
              title: `${client.config.emojis.queue || '📜'} Added to Queue`,
              description: `[**${selectedTrack.title}**](${selectedTrack.url})`,
              fields: [
                { name: 'Author', value: selectedTrack.author, inline: true },
                { name: 'Duration', value: selectedTrack.durationFormatted, inline: true },
                { name: 'Position in Queue', value: `#${player.queue.length}`, inline: true }
              ],
              thumbnail: selectedTrack.thumbnail ? { url: selectedTrack.thumbnail } : null
            })
          ]
        });
      }

      // 4. Start playback
      player.queue.push(selectedTrack);
      await player.play();

      searchingMsg.delete().catch(() => {});
    } catch (err) {
      console.error('[Play Command Error]:', err);
      searchingMsg.edit({
        embeds: [
          client.embed({
            color: '#ef4444',
            description: `${client.config.emojis.error} Failed to play track: ${err.message}`
          })
        ]
      });
    }
  }
};
