export default {
  name: 'stats',
  aliases: ['botinfo', 'bi'],
  description: 'View bot statistics and runtime information',
  category: 'Information',
  async run(client, message) {
    const totalGuilds = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
    const activePlayers = client.playerManager.players.size;

    message.reply({
      embeds: [
        client.embed({
          title: '📊 Groove Music Statistics',
          fields: [
            { name: 'Servers', value: `\`${totalGuilds}\``, inline: true },
            { name: 'Users', value: `\`${totalUsers.toLocaleString()}\``, inline: true },
            { name: 'Voice Sessions', value: `\`${activePlayers}\``, inline: true },
            { name: 'Node.js', value: `\`${process.version}\``, inline: true },
            { name: 'Discord.js', value: '`v14.18.0`', inline: true },
            { name: 'Audio Backend', value: '`yt-dlp` & `FFmpeg`', inline: true }
          ]
        })
      ]
    });
  }
};
