import {
  createAudioPlayer,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  entersState,
  VoiceConnectionStatus
} from '@discordjs/voice';
import EventEmitter from 'events';
import config from '../config.js';

export class Player extends EventEmitter {
  constructor(manager, options = {}) {
    super();
    this.manager = manager;
    this.client = manager.client;
    this.guildId = options.guildId;
    this.voiceChannelId = options.voiceChannelId;
    this.textChannelId = options.textChannelId;
    this.voiceConnection = options.voiceConnection;

    this.queue = [];
    this.history = [];
    this.current = null;
    this.previous = null;

    this.volume = config.engine?.defaultVolume || 80;
    this.paused = false;
    this.loop = 'off'; // 'off' | 'track' | 'queue'
    this.autoplay = config.defaultSettings?.autoplay || false;
    this.twentyFourSeven = config.defaultSettings?.twentyFourSeven || false;
    this.filter = 'clear';
    this.speed = 1.0;
    this.currentResource = null;
    this.currentProcess = null;

    this.trackStartTime = 0;
    this.pausedDuration = 0;

    this.audioPlayer = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
        maxMissedFrames: 250
      }
    });

    this.setupAudioPlayerEvents();

    if (this.voiceConnection) {
      this.voiceConnection.subscribe(this.audioPlayer);
    }
  }

  setupAudioPlayerEvents() {
    this.audioPlayer.on(AudioPlayerStatus.Playing, () => {
      this.paused = false;
      this.trackStartTime = Date.now();
      if (this.current) {
        this.emit('trackStart', this, this.current);
        this.manager.emit('playerStart', this, this.current);
      }
    });

    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      this.cleanupCurrentProcess();
      const finishedTrack = this.current;
      this.previous = finishedTrack;
      if (finishedTrack) {
        this.history.unshift(finishedTrack);
        if (this.history.length > 50) this.history.pop();
        this.emit('trackEnd', this, finishedTrack);
        this.manager.emit('playerEnd', this, finishedTrack);
      }

      // Handle Repeat modes
      if (this.loop === 'track' && finishedTrack) {
        this.queue.unshift(finishedTrack);
      } else if (this.loop === 'queue' && finishedTrack) {
        this.queue.push(finishedTrack);
      }

      if (this.queue.length > 0) {
        this.play();
      } else if (this.autoplay && finishedTrack) {
        this.handleAutoplay(finishedTrack);
      } else {
        this.current = null;
        this.emit('queueEnd', this);
        this.manager.emit('playerEmpty', this);
        if (!this.twentyFourSeven) {
          this.scheduleLeaveTimeout();
        }
      }
    });

    this.audioPlayer.on('error', (error) => {
      console.error('[Player Audio Error]:', error.message);
      this.emit('playerError', this, error);
      this.manager.emit('playerError', this, error);
      this.skip();
    });
  }

  async play(options = {}) {
    if (this.leaveTimeout) {
      clearTimeout(this.leaveTimeout);
      this.leaveTimeout = null;
    }

    if (!this.queue.length && !options.track) {
      return false;
    }

    const track = options.track || this.queue.shift();
    this.current = track;

    try {
      this.cleanupCurrentProcess();

      const seekSeconds = options.seekSeconds || 0;
      const { resource, process } = await this.manager.engine.createAudioStream(track.url, {
        seekSeconds,
        filter: this.filter,
        speed: this.speed,
        volume: this.volume / 100
      });

      this.currentResource = resource;
      this.currentProcess = process;

      if (resource.volume) {
        resource.volume.setVolume(this.volume / 100);
      }

      this.audioPlayer.play(resource);
      return true;
    } catch (err) {
      console.error('[Player Play Error]:', err);
      this.emit('playerError', this, err);
      this.manager.emit('playerError', this, err);

      // Disable track loop on broken track to prevent infinite retry loop
      if (this.loop === 'track') {
        this.loop = 'off';
      }

      this.current = null;
      if (this.queue.length > 0) {
        this.play();
      } else {
        this.audioPlayer.stop(true);
      }
      return false;
    }
  }

  pause() {
    if (this.paused) return false;
    this.audioPlayer.pause();
    this.paused = true;
    return true;
  }

  resume() {
    if (!this.paused) return false;
    this.audioPlayer.unpause();
    this.paused = false;
    return true;
  }

  skip() {
    this.manager.emit('playerSkip', this, this.current);
    this.audioPlayer.stop(true);
    return true;
  }

  skipto(index) {
    if (index < 1 || index > this.queue.length) return false;
    this.queue.splice(0, index - 1);
    this.skip();
    return true;
  }

  stop() {
    this.queue = [];
    this.current = null;
    this.audioPlayer.stop(true);
    this.cleanupCurrentProcess();
    return true;
  }

  setVolume(vol) {
    const volume = Math.max(0, Math.min(config.engine?.maxVolume || 200, vol));
    this.volume = volume;
    if (this.currentResource && this.currentResource.volume) {
      this.currentResource.volume.setVolume(volume / 100);
    }
    return volume;
  }

  async setFilter(filterName) {
    this.filter = filterName;
    if (this.current) {
      const position = this.getPosition() / 1000;
      await this.play({ track: this.current, seekSeconds: position });
    }
    return true;
  }

  async setSpeed(speedVal) {
    this.speed = Math.max(0.5, Math.min(2.0, speedVal));
    if (this.current) {
      const position = this.getPosition() / 1000;
      await this.play({ track: this.current, seekSeconds: position });
    }
    return true;
  }

  async seek(seconds) {
    if (!this.current) return false;
    const seekTime = Math.max(0, Math.min(this.current.duration || 3600, seconds));
    await this.play({ track: this.current, seekSeconds: seekTime });
    return true;
  }

  shuffle() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    return this.queue;
  }

  clearQueue() {
    const count = this.queue.length;
    this.queue = [];
    return count;
  }

  getPosition() {
    if (!this.trackStartTime) return 0;
    if (this.paused) return this.pausedDuration;
    return Date.now() - this.trackStartTime;
  }

  scheduleLeaveTimeout() {
    const delay = config.defaultSettings?.voiceStayTime || 180000;
    this.leaveTimeout = setTimeout(() => {
      if (!this.queue.length && !this.current && !this.twentyFourSeven) {
        this.destroy();
      }
    }, delay);
  }

  async handleAutoplay(previousTrack) {
    try {
      const query = `${previousTrack.author} ${previousTrack.title} related`;
      const results = await this.manager.engine.search(query, 5);
      const nextTrack = results.find(t => t.url !== previousTrack.url);
      if (nextTrack) {
        this.queue.push(nextTrack);
        this.play();
      }
    } catch {
      this.destroy();
    }
  }

  cleanupCurrentProcess() {
    if (this.currentProcess) {
      try {
        if (this.currentProcess.stdout) {
          this.currentProcess.stdout.destroy();
        }
        this.currentProcess.kill('SIGKILL');
      } catch {}
      this.currentProcess = null;
    }
  }

  destroy() {
    if (this.leaveTimeout) clearTimeout(this.leaveTimeout);
    this.cleanupCurrentProcess();
    this.stop();
    if (this.voiceConnection) {
      try {
        this.voiceConnection.destroy();
      } catch {}
      this.voiceConnection = null;
    }
    this.manager.players.delete(this.guildId);
    this.emit('playerDestroy', this);
    this.manager.emit('playerDestroy', this);
  }
}

export default Player;
