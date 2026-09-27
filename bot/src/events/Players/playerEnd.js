export default async function playerEnd(client, player, track) {
  if (player.nowPlayingMessage) {
    try {
      await player.nowPlayingMessage.edit({ components: [] });
    } catch {}
    player.nowPlayingMessage = null;
  }
}
