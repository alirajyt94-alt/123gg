export default {
  name: 'uptime',
  description: 'Check how long the bot has been running',
  category: 'Information',
  async run(client, message) {
    const totalSeconds = Math.floor(process.uptime());
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    message.reply({
      embeds: [
        client.embed({
          title: '⏱️ Bot Uptime',
          description: `Groove Music has been running continuously for **${uptimeStr}**.`
        })
      ]
    });
  }
};
