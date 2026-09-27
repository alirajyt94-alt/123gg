export default {
  name: 'speed',
  description: 'Adjust audio playback speed (0.5x - 2.0x) using FFmpeg atempo',
  usage: '!speed <0.5 - 2.0>',
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
        embeds: [client.embed({ description: `${client.config.emojis.headphones} Current playback speed is **${player.speed}x**` })]
      });
    }

    const speed = parseFloat(args[0]);
    if (isNaN(speed) || speed < 0.5 || speed > 2.0) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Please provide a speed between \`0.5\` and \`2.0\`!` })]
      });
    }

    await player.setSpeed(speed);
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.success} Audio playback speed set to **${speed}x** via FFmpeg.` })]
    });
  }
};
