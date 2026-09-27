export default async function playerDestroy(client, player) {
  if (player.nowPlayingMessage) {
    try {
      await player.nowPlayingMessage.edit({ components: [] });
    } catch {}
  }
}
