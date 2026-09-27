export default async function interactionCreate(client, interaction) {
  if (interaction.isChatInputCommand()) {
    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.run(client, interaction);
    } catch (err) {
      console.error('[Slash Command Error]', err);
      const reply = {
        embeds: [
          client.embed({
            color: '#ef4444',
            description: `Error executing command: ${err.message}`
          })
        ],
        ephemeral: true
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  } else if (interaction.isButton()) {
    // Handle music player controller buttons
    const [action, guildId] = interaction.customId.split('_');
    const player = client.playerManager.get(interaction.guildId);

    if (!player) {
      return interaction.reply({
        content: 'No active music player in this server.',
        ephemeral: true
      });
    }

    // Check voice channel match
    if (interaction.member.voice?.channelId !== player.voiceChannelId) {
      return interaction.reply({
        content: 'You must be in the same voice channel to use music controls.',
        ephemeral: true
      });
    }

    switch (action) {
      case 'pause':
        if (player.paused) {
          player.resume();
          await interaction.reply({ content: 'Resumed playback.', ephemeral: true });
        } else {
          player.pause();
          await interaction.reply({ content: 'Paused playback.', ephemeral: true });
        }
        break;
      case 'skip':
        player.skip();
        await interaction.reply({ content: 'Skipped current track.', ephemeral: true });
        break;
      case 'stop':
        player.stop();
        await interaction.reply({ content: 'Stopped playback and cleared queue.', ephemeral: true });
        break;
      case 'loop':
        const modes = ['off', 'track', 'queue'];
        const nextIdx = (modes.indexOf(player.loop) + 1) % modes.length;
        player.loop = modes[nextIdx];
        await interaction.reply({ content: `Loop mode set to **${player.loop}**.`, ephemeral: true });
        break;
      case 'shuffle':
        player.shuffle();
        await interaction.reply({ content: 'Shuffled the queue.', ephemeral: true });
        break;
      default:
        break;
    }
  }
}
