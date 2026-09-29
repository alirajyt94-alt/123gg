import { joinVoiceChannel, entersState, VoiceConnectionStatus } from '@discordjs/voice';
import EventEmitter from 'events';
import { Player } from './Player.js';
import { YtdlpFFmpegEngine } from './YtdlpFFmpegEngine.js';

export class PlayerManager extends EventEmitter {
  constructor(client, options = {}) {
    super();
    this.client = client;
    this.players = new Map();
    this.engine = new YtdlpFFmpegEngine(options.engine || {});
  }

  /**
   * Get existing player for guild
   */
  get(guildId) {
    return this.players.get(guildId);
  }

  /**
   * Create or retrieve a player for a guild
   */
  async create(options = {}) {
    const {
      guildId,
      voiceChannelId,
      textChannelId,
      deaf = true,
      mute = false
    } = options;

    if (this.players.has(guildId)) {
      const existing = this.players.get(guildId);
      if (textChannelId) existing.textChannelId = textChannelId;
      return existing;
    }

    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      throw new Error(`Guild ${guildId} not found in client cache.`);
    }

    // Connect to Discord Voice Channel
    const voiceConnection = joinVoiceChannel({
      channelId: voiceChannelId,
      guildId: guildId,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: deaf,
      selfMute: mute
    });

    try {
      await entersState(voiceConnection, VoiceConnectionStatus.Ready, 15_000);
    } catch (err) {
      voiceConnection.destroy();
      throw new Error(`Failed to join voice channel within 15 seconds: ${err.message}`);
    }

    // Auto-cleanup on disconnect or channel kicked
    voiceConnection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(voiceConnection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(voiceConnection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        if (this.players.has(guildId)) {
          this.destroy(guildId);
        }
      }
    });

    voiceConnection.on(VoiceConnectionStatus.Destroyed, () => {
      if (this.players.has(guildId)) {
        this.destroy(guildId);
      }
    });

    const player = new Player(this, {
      guildId,
      voiceChannelId,
      textChannelId,
      voiceConnection
    });

    this.players.set(guildId, player);
    this.emit('playerCreate', player);

    return player;
  }

  /**
   * Destroy player for guild
   */
  destroy(guildId) {
    const player = this.players.get(guildId);
    if (player) {
      player.destroy();
      return true;
    }
    return false;
  }

  /**
   * Search tracks with engine
   */
  async search(query, limit = 5) {
    return this.engine.search(query, limit);
  }
}

export default PlayerManager;
