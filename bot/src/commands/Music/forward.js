export default {
  name: 'forward',
  aliases: ['fwd'],
  description: 'Fast-forward playback by seconds (default 10s)',
  usage: '!forward [seconds]',
  category: 'Music',
  async run(client, message, args) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Nothing is currently playing!` })]
      });
    }

    const seconds = parseInt(args[0], 10) || 10;
    const currentSec = Math.floor(player.getPosition() / 1000);
    const target = currentSec + seconds;

    await player.seek(target);
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.skip} Forwarded **+${seconds}s** to \`${client.playerManager.engine.formatDuration(target)}\`` })]
    });
  }
};
