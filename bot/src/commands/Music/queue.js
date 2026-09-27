export default {
  name: 'queue',
  aliases: ['q'],
  description: 'View the current music queue',
  category: 'Music',
  async run(client, message, args) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Nothing is currently playing!` })]
      });
    }

    const currentTrack = player.current;
    const tracks = player.queue;

    if (!tracks.length) {
      return message.reply({
        embeds: [
          client.embed({
            title: `${client.config.emojis.queue} Queue for ${message.guild.name}`,
            description: `**Now Playing:**\n[${currentTrack.title}](${currentTrack.url}) \`[${currentTrack.durationFormatted}]\`\n\n*No tracks in queue.*`
          })
        ]
      });
    }

    const page = parseInt(args[0], 10) || 1;
    const perPage = 10;
    const totalPages = Math.ceil(tracks.length / perPage);
    const currentPage = Math.max(1, Math.min(totalPages, page));

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const currentQueue = tracks.slice(start, end);

    const description = [
      `**Now Playing:**`,
      `[${currentTrack.title}](${currentTrack.url}) \`[${currentTrack.durationFormatted}]\`\n`,
      `**Up Next:**`,
      currentQueue.map((t, i) => `\`${start + i + 1}.\` [${t.title}](${t.url}) - \`${t.durationFormatted}\``).join('\n')
    ].join('\n');

    message.reply({
      embeds: [
        client.embed({
          title: `${client.config.emojis.queue} Queue for ${message.guild.name}`,
          description,
          footer: { text: `Page ${currentPage} of ${totalPages} • Total tracks: ${tracks.length}` }
        })
      ]
    });
  }
};
