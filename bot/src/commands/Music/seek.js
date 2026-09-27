export default {
  name: 'seek',
  description: 'Seek to a specific time in the current track using FFmpeg',
  usage: '!seek <seconds or mm:ss>',
  category: 'Music',
  async run(client, message, args) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Nothing is currently playing!` })]
      });
    }

    if (!args[0]) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Please specify a timestamp to seek to! Example: \`${client.prefix}seek 1:30\` or \`${client.prefix}seek 90\`` })]
      });
    }

    let seekSeconds = 0;
    if (args[0].includes(':')) {
      const parts = args[0].split(':').map(Number);
      if (parts.length === 2) {
        seekSeconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        seekSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
    } else {
      seekSeconds = parseInt(args[0], 10);
    }

    if (isNaN(seekSeconds) || seekSeconds < 0 || (player.current.duration && seekSeconds > player.current.duration)) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Invalid seek duration!` })]
      });
    }

    await player.seek(seekSeconds);
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.success} Seeked to **${client.playerManager.engine.formatDuration(seekSeconds)}** via FFmpeg.` })]
    });
  }
};
