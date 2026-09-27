export default {
  name: 'volume',
  aliases: ['vol', 'v'],
  description: 'Adjust the music playback volume (0 - 200%)',
  usage: '!volume <0-200>',
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
        embeds: [client.embed({ description: `${client.config.emojis.volume} Current volume is **${player.volume}%**` })]
      });
    }

    const vol = parseInt(args[0], 10);
    if (isNaN(vol) || vol < 0 || vol > 200) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: `${client.config.emojis.error} Please specify a volume between 0 and 200!` })]
      });
    }

    const setVol = player.setVolume(vol);
    message.reply({
      embeds: [client.embed({ description: `${client.config.emojis.volume} Volume set to **${setVol}%**` })]
    });
  }
};
