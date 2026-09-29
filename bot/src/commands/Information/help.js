export default {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'List all available bot commands and features',
  usage: '/help [command]',
  category: 'Information',
  async run(client, message, args) {
    if (args[0]) {
      const cmd = client.commands.get(args[0].toLowerCase()) || client.aliases.get(args[0].toLowerCase());
      if (!cmd) {
        return message.reply({
          embeds: [client.embed({ color: '#ef4444', description: `Command \`${args[0]}\` not found.` })]
        });
      }

      return message.reply({
        embeds: [
          client.embed({
            title: `Command: ${cmd.name}`,
            description: cmd.description || 'No description provided.',
            fields: [
              { name: 'Category', value: cmd.category || 'General', inline: true },
              { name: 'Usage', value: `\`${cmd.usage || `${client.prefix}${cmd.name}`}\``, inline: true },
              { name: 'Aliases', value: cmd.aliases?.map(a => `\`${a}\``).join(', ') || 'None', inline: true }
            ]
          })
        ]
      });
    }

    const categories = ['Music', 'Filters', 'Config', 'Information', 'Owner'];
    const fields = [];

    for (const cat of categories) {
      const cmds = Array.from(client.commands.values())
        .filter(c => c.category === cat)
        .map(c => `\`${c.name}\``)
        .join(', ');

      if (cmds) {
        fields.push({
          name: `${cat} (${Array.from(client.commands.values()).filter(c => c.category === cat).length})`,
          value: cmds
        });
      }
    }

    message.reply({
      embeds: [
        client.embed({
          title: '🎵 Groove Music Commands (yt-dlp + FFmpeg)',
          description: `Use \`${client.prefix}help <command>\` for detailed information on any command.\n**Zero Lavalink**: High-speed native audio streaming directly via yt-dlp & FFmpeg.`,
          fields
        })
      ]
    });
  }
};
