import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  EmbedBuilder
} from 'discord.js';
import config from '../config.js';
import { PlayerManager } from './PlayerManager.js';
import { loadCommands } from '../loaders/loadCommands.js';
import { loadClients } from '../loaders/loadClients.js';
import { loadPlayerManager } from '../loaders/loadPlayerManager.js';

export class MusicClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember
      ]
    });

    this.config = config;
    this.prefix = config.prefix || '!';
    this.commands = new Collection();
    this.aliases = new Collection();
    this.cooldowns = new Collection();
    this.categories = new Set();
    this.slashCommands = new Collection();

    // Native Ytdlp-FFmpeg Player Manager (Zero Lavalink)
    this.playerManager = new PlayerManager(this);

    // Simple in-memory / JSON store for guild settings & favorites
    this.guildSettings = new Map();
    this.likedTracks = new Map(); // userId -> Array of tracks
  }

  embed(options = {}) {
    const embed = new EmbedBuilder()
      .setColor(options.color || this.config.embedColor || '#6366f1')
      .setTimestamp();

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.footer) embed.setFooter(options.footer);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.author) embed.setAuthor(options.author);
    if (options.fields) embed.addFields(options.fields);

    return embed;
  }

  async build() {
    console.log('[Groove-Music] Initializing bot with yt-dlp & FFmpeg engine...');

    // Load Commands
    await loadCommands(this);

    // Load Client Event Handlers
    await loadClients(this);

    // Load Player Event Handlers
    await loadPlayerManager(this);

    // Start login if token is provided
    if (this.config.token && this.config.token !== 'YOUR_DISCORD_BOT_TOKEN_HERE') {
      try {
        await this.login(this.config.token);
      } catch (err) {
        console.error('[Groove-Music] Failed to log in with provided token:', err.message);
      }
    } else {
      console.log('[Groove-Music] Bot created in standby mode (waiting for Discord Bot Token).');
    }

    return this;
  }
}

export default MusicClient;
