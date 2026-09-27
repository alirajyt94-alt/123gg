export default {
  name: 'ping',
  description: 'Check the bot WebSocket and voice latency',
  category: 'Information',
  async run(client, message) {
    const sent = await message.reply({ content: 'Pinging...' });
    const roundtrip = sent.createdTimestamp - message.createdTimestamp;

    sent.edit({
      content: null,
      embeds: [
        client.embed({
          title: '🏓 Pong!',
          fields: [
            { name: 'WebSocket Latency', value: `\`${Math.round(client.ws.ping)}ms\``, inline: true },
            { name: 'Roundtrip Latency', value: `\`${roundtrip}ms\``, inline: true },
            { name: 'Audio Engine', value: '`yt-dlp` + `FFmpeg`', inline: true }
          ]
        })
      ]
    });
  }
};
