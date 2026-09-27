export default {
  name: 'search',
  description: 'Search for tracks with yt-dlp and select which to play',
  usage: '!search <query>',
  category: 'Music',
  async run(client, message, args) {
    if (!args.length) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Please specify a search query!` })]
      });
    }

    const query = args.join(' ');
    const searchMsg = await message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.search} Searching tracks for **${query}** via yt-dlp...` })]
    });

    try {
      const tracks = await client.playerManager.search(query, 5);

      if (!tracks.length) {
        return searchMsg.edit({
          embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} No tracks found for **${query}**.` })]
        });
      }

      const listDesc = tracks.map((t, idx) => `\`${idx + 1}.\` [**${t.title}**](${t.url}) - \`${t.durationFormatted}\` • *${t.author}*`).join('\n\n');

      await searchMsg.edit({
        embeds: [
          client.embed({
            title: `${client.config.emojis.search} Select a Track (Reply 1 - ${tracks.length})`,
            description: `${listDesc}\n\n*Reply with a number between 1 and ${tracks.length} within 30 seconds to play.*`
          })
        ]
      });

      const filter = (m) => m.author.id === message.author.id && /^[1-5]$/.test(m.content.trim());
      const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] }).catch(() => null);

      if (!collected || !collected.first()) {
        return searchMsg.edit({
          embeds: [client.embed({ color: '#ef4444', description: 'Search timed out.' })]
        });
      }

      const choice = parseInt(collected.first().content.trim(), 10) - 1;
      const selected = tracks[choice];
      selected.requester = message.author.id;

      let player = client.playerManager.get(message.guild.id);
      if (!player) {
        player = await client.playerManager.create({
          guildId: message.guild.id,
          voiceChannelId: message.member.voice.channel.id,
          textChannelId: message.channel.id
        });
      }

      player.queue.push(selected);
      if (!player.current) {
        await player.play();
      }

      searchMsg.edit({
        embeds: [
          client.embed({
            description: `${client.config.emojis.success} Queued [**${selected.title}**](${selected.url})`
          })
        ]
      });
    } catch (err) {
      searchMsg.edit({
        embeds: [client.embed({ color: '#ef4444', description: `Error during search: ${err.message}` })]
      });
    }
  }
};
