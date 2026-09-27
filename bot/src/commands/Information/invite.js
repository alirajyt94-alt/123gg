export default {
  name: 'invite',
  description: 'Get the bot invite link to add it to your server',
  category: 'Information',
  async run(client, message) {
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

    message.reply({
      embeds: [
        client.embed({
          title: '💌 Invite Groove Music',
          description: `Click the link below to invite Groove Music to your Discord server:\n\n[**Click Here to Invite**](${inviteUrl})\n\nEnjoy high-fidelity music streaming powered by yt-dlp & FFmpeg!`
        })
      ]
    });
  }
};
