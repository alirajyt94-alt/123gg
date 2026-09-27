import { PermissionsBitField } from 'discord.js';

export default {
  name: 'setprefix',
  aliases: ['prefix'],
  description: 'Change the bot command prefix for this server',
  usage: '!setprefix <new prefix>',
  category: 'Config',
  async run(client, message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: 'You need `Manage Server` permission to change the prefix.' })]
      });
    }

    if (!args[0]) {
      const current = client.guildSettings.get(message.guild.id)?.prefix || client.prefix;
      return message.reply({
        embeds: [client.embed({ description: `Current prefix for this server is \`${current}\`` })]
      });
    }

    const newPrefix = args[0].trim();
    if (newPrefix.length > 5) {
      return message.reply({
        embeds: [client.embed({ color: '#ef4444', description: 'Prefix cannot be longer than 5 characters.' })]
      });
    }

    const settings = client.guildSettings.get(message.guild.id) || {};
    settings.prefix = newPrefix;
    client.guildSettings.set(message.guild.id, settings);

    message.reply({
      embeds: [client.embed({ description: `Server prefix has been changed to \`${newPrefix}\`` })]
    });
  }
};
