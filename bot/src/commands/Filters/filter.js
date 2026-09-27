import { AUDIO_FILTERS } from '../../structures/YtdlpFFmpegEngine.js';

export default {
  name: 'filter',
  aliases: ['filters', 'f'],
  description: 'Apply FFmpeg audio DSP filters to the music stream',
  usage: '!filter <bassboost/nightcore/vaporwave/8d/karaoke/tremolo/echo/pop/rock/clear>',
  category: 'Filters',
  async run(client, message, args) {
    const player = client.playerManager.get(message.guild.id);
    if (!player || !player.current) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: 'Nothing is currently playing!' })]
      });
    }

    const availableFilters = Object.keys(AUDIO_FILTERS);

    if (!args[0]) {
      const list = availableFilters.map(f => `\`${f}\``).join(', ');
      return message.reply({
        embeds: [
          client.embed({
            title: '🎛️ FFmpeg Audio Filters',
            description: `Active Filter: **${player.filter.toUpperCase()}**\n\nAvailable Filters:\n${list}\n\n*Usage:* \`${client.prefix}filter <name>\` (e.g. \`${client.prefix}filter nightcore\` or \`${client.prefix}filter clear\`)`
          })
        ]
      });
    }

    const requestedFilter = args[0].toLowerCase();

    if (!AUDIO_FILTERS.hasOwnProperty(requestedFilter)) {
      return message.reply({
        embeds: [
          client.embed({
            color: '#ef4444',
            description: `Invalid filter! Choose one of: ${availableFilters.map(f => `\`${f}\``).join(', ')}`
          })
        ]
      });
    }

    const statusMsg = await message.reply({
      embeds: [
        client.embed({
          description: `Applying FFmpeg audio filter **${requestedFilter.toUpperCase()}**...`
        })
      ]
    });

    await player.setFilter(requestedFilter);

    statusMsg.edit({
      embeds: [
        client.embed({
          title: '🎛️ Filter Applied',
          description: requestedFilter === 'clear'
            ? 'All FFmpeg audio filters have been removed.'
            : `Applied **${requestedFilter.toUpperCase()}** filter seamlessly via FFmpeg audio pipeline!`
        })
      ]
    });
  }
};
