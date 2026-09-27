export default {
  name: 'similar',
  description: 'Find and queue tracks similar to the current song',
  category: 'Music',
  async run(client, message) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: 'Nothing is currently playing!' })]
      });
    }

    const current = player.current;
    const msg = await message.reply({
      embeds: [client.embed({ description: `Finding songs similar to **${current.title}**...` })]
    });

    try {
      const results = await client.playerManager.search(`${current.author} music similar`, 3);
      const filtered = results.filter(r => r.url !== current.url);

      filtered.forEach(t => {
        t.requester = message.author.id;
        player.queue.push(t);
      });

      msg.edit({
        embeds: [
          client.embed({
            description: `Queued **${filtered.length}** similar songs recommended by yt-dlp!`
          })
        ]
      });
    } catch (err) {
      msg.edit({ embeds: [client.embed({ color: '#ef4444', description: err.message })] });
    }
  }
};
