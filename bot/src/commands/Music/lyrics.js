import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { lyricsService } from '../../utils/lyricsService.js';

export default {
  name: 'lyrics',
  aliases: ['ly', 'lyric'],
  description: 'Fetch and display lyrics for the currently playing track or a search query using yt-dlp metadata & LRCLIB API',
  usage: '!lyrics [song name or artist]',
  category: 'Music',
  async run(client, message, args) {
    const player = client.playerManager.get(message.guild.id);
    let titleToSearch = '';
    let artistToSearch = '';
    let trackUrl = '';

    if (args.length > 0) {
      titleToSearch = args.join(' ');
    } else if (player && player.current) {
      titleToSearch = player.current.title;
      artistToSearch = player.current.author || '';
      trackUrl = player.current.url || '';
    } else {
      return message.reply({
        embeds: [
          client.embed({
            color: '#ef4444',
            description: `${client.config.emojis.error || '❌'} Nothing is currently playing! Please specify a song title: \`${client.prefix}lyrics <song name>\``
          })
        ]
      });
    }

    const searchingMsg = await message.reply({
      embeds: [
        client.embed({
          color: '#6366f1',
          description: `🔍 Searching lyrics for **${titleToSearch}** via LRCLIB & yt-dlp metadata...`
        })
      ]
    });

    try {
      const data = await lyricsService.fetchLyrics(titleToSearch, artistToSearch, trackUrl);

      if (!data || !data.lyrics || data.lyrics.trim().length === 0) {
        return searchingMsg.edit({
          embeds: [
            client.embed({
              color: '#ef4444',
              title: '📝 Lyrics Not Found',
              description: `Could not find lyrics for **${titleToSearch}**.\n\n*Tips: Try providing the artist name: \`${client.prefix}lyrics ${titleToSearch} by <artist>\`*`
            })
          ]
        });
      }

      // Chunk lyrics into pages if exceeding 2048 characters
      const lines = data.lyrics.split('\n');
      const pages = [];
      let currentChunk = '';

      for (const line of lines) {
        if ((currentChunk + line + '\n').length > 1800) {
          pages.push(currentChunk.trim());
          currentChunk = line + '\n';
        } else {
          currentChunk += line + '\n';
        }
      }
      if (currentChunk.trim().length > 0) {
        pages.push(currentChunk.trim());
      }

      let currentPage = 0;

      const generateEmbed = (pageIdx) => {
        return client.embed({
          title: `📝 Lyrics: ${data.title} ${data.artist ? `- ${data.artist}` : ''}`,
          description: pages[pageIdx],
          fields: [
            { name: 'Source', value: `\`${data.source}\``, inline: true },
            { name: 'Synced Support', value: data.isSynced ? '`Yes (LRC Available)`' : '`Plain Text`', inline: true },
            ...(data.album ? [{ name: 'Album', value: `\`${data.album}\``, inline: true }] : [])
          ],
          footer: { text: `Page ${pageIdx + 1} of ${pages.length} • Requested by ${message.author.tag}` }
        });
      };

      // If single page, send without buttons
      if (pages.length <= 1) {
        return searchingMsg.edit({ embeds: [generateEmbed(0)] });
      }

      // If multiple pages, add interactive navigation buttons
      const getButtons = (pageIdx) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('lyrics_prev')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(pageIdx === 0),
          new ButtonBuilder()
            .setCustomId('lyrics_next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pageIdx === pages.length - 1)
        );
      };

      const reply = await searchingMsg.edit({
        embeds: [generateEmbed(0)],
        components: [getButtons(0)]
      });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120_000
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== message.author.id) {
          return i.reply({ content: 'Only the command author can change pages.', ephemeral: true });
        }

        if (i.customId === 'lyrics_prev' && currentPage > 0) {
          currentPage--;
        } else if (i.customId === 'lyrics_next' && currentPage < pages.length - 1) {
          currentPage++;
        }

        await i.update({
          embeds: [generateEmbed(currentPage)],
          components: [getButtons(currentPage)]
        });
      });

      collector.on('end', async () => {
        try {
          await reply.edit({ components: [] });
        } catch {}
      });

    } catch (err) {
      console.error('[Lyrics Command Error]:', err);
      searchingMsg.edit({
        embeds: [
          client.embed({
            color: '#ef4444',
            description: `Error fetching lyrics: ${err.message}`
          })
        ]
      });
    }
  }
};
