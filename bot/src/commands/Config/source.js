export default {
  name: 'source',
  description: 'View the audio backend architecture (yt-dlp + FFmpeg)',
  category: 'Config',
  async run(client, message) {
    message.reply({
      embeds: [
        client.embed({
          title: '⚡ Groove Music Engine Information',
          description: 'This bot runs on a native **yt-dlp** and **FFmpeg** audio processing pipeline with zero Lavalink dependencies.',
          fields: [
            { name: 'Extractor', value: '`yt-dlp (Latest Standalone)`', inline: true },
            { name: 'DSP & Transcoding', value: '`FFmpeg (48kHz 16-bit Stereo PCM)`', inline: true },
            { name: 'Voice Driver', value: '`@discordjs/voice (Direct UDP Opus)`', inline: true },
            { name: 'Audio Latency', value: '< 20ms direct pipe', inline: true },
            { name: 'Supported Sources', value: 'YouTube, SoundCloud, Bandcamp, Twitch, Direct MP3/M4A/FLAC/OGG', inline: true }
          ]
        })
      ]
    });
  }
};
