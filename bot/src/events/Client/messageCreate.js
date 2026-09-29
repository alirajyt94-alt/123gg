import { PermissionsBitField } from 'discord.js';

export default async function messageCreate(client, message) {
  if (!message.guild || message.author.bot) return;

  const prefix = client.guildSettings.get(message.guild.id)?.prefix || client.prefix;

  // Mention prefix support
  const mentionRegex = new RegExp(`^<@!?${client.user?.id}>( |$)`);
  let usedPrefix = '';

  if (message.content.startsWith(prefix)) {
    usedPrefix = prefix;
  } else if (mentionRegex.test(message.content)) {
    usedPrefix = message.content.match(mentionRegex)[0];
  } else {
    return;
  }

  const args = message.content.slice(usedPrefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = client.commands.get(commandName) || client.aliases.get(commandName);
  if (!command) return;

  // Bot permissions check
  const me = message.guild.members.me || await message.guild.members.fetchMe().catch(() => null);
  const botPermissions = me ? message.channel.permissionsFor(me) : null;
  if (!botPermissions || !botPermissions.has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])) {
    return;
  }

  // Voice requirement check for music commands
  if (command.category === 'Music' || command.category === 'Filters') {
    if (!message.member?.voice?.channel) {
      return message.reply({
        embeds: [
          client.embed({
            color: '#ef4444',
            description: `${client.config.emojis.error} You need to be in a voice channel to use music commands!`
          })
        ]
      });
    }

    if (me?.voice?.channel && me.voice.channel.id !== message.member.voice.channel.id) {
      return message.reply({
        embeds: [
          client.embed({
            color: '#ef4444',
            description: `${client.config.emojis.error} You must be in the same voice channel as me to control music!`
          })
        ]
      });
    }
  }

  // Owner check
  if (command.ownerOnly && !client.config.ownerIds.includes(message.author.id)) {
    return message.reply({
      embeds: [
        client.embed({
          color: '#ef4444',
          description: `${client.config.emojis.error} This command is restricted to the bot owner.`
        })
      ]
    });
  }

  try {
    await command.run(client, message, args);
  } catch (error) {
    console.error(`[Command Error: ${commandName}]`, error);
    message.reply({
      embeds: [
        client.embed({
          color: '#ef4444',
          title: 'Command Error',
          description: `An error occurred while executing \`${commandName}\`: ${error.message}`
        })
      ]
    }).catch(() => {});
  }
}
