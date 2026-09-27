export default {
  name: 'loop',
  aliases: ['repeat'],
  description: 'Set repeat mode: off, track, or queue',
  usage: '!loop [off/track/queue]',
  category: 'Music',
  async run(client, message, args) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Nothing is currently playing!` })]
      });
    }

    const mode = args[0]?.toLowerCase();

    if (!mode) {
      const modes = ['off', 'track', 'queue'];
      const nextIdx = (modes.indexOf(player.loop) + 1) % modes.length;
      player.loop = modes[nextIdx];
    } else if (['off', 'track', 'queue'].includes(mode)) {
      player.loop = mode;
    } else {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Invalid mode! Use \`off\`, \`track\`, or \`queue\`.` })]
      });
    }

    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.loop} Loop mode is now **${player.loop.toUpperCase()}**` })]
    });
  }
};
