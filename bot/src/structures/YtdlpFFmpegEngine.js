import { spawn } from 'child_process';
import { createAudioResource, StreamType } from '@discordjs/voice';
import config from '../config.js';

export const AUDIO_FILTERS = {
  clear: '',
  bassboost: 'bass=g=12:f=110:w=0.6',
  bassboost_soft: 'bass=g=6:f=110:w=0.6',
  bassboost_hard: 'bass=g=18:f=110:w=0.6',
  nightcore: 'aresample=48000,asetrate=48000*1.25',
  vaporwave: 'aresample=48000,asetrate=48000*0.8',
  '8d': 'apulsator=hz=0.125',
  karaoke: 'stereotools=mlev=0.03',
  tremolo: 'tremolo=f=5:d=0.5',
  echo: 'aecho=0.8:0.88:60:0.4',
  pop: 'equalizer=f=1000:t=q:w=1:g=3,equalizer=f=3000:t=q:w=1:g=4',
  rock: 'equalizer=f=100:t=q:w=1:g=4,equalizer=f=8000:t=q:w=1:g=4',
  electronic: 'equalizer=f=60:t=q:w=1:g=6,equalizer=f=12000:t=q:w=1:g=3',
  classical: 'equalizer=f=300:t=q:w=1:g=-2,equalizer=f=2000:t=q:w=1:g=3'
};

export class YtdlpFFmpegEngine {
  constructor(options = {}) {
    this.ytdlpPath = options.ytdlpPath || config.engine?.ytdlpPath || 'yt-dlp';
    this.ffmpegPath = options.ffmpegPath || config.engine?.ffmpegPath || 'ffmpeg';
  }

  /**
   * Search tracks or resolve direct URL using yt-dlp
   */
  async search(query, limit = 5) {
    return new Promise((resolve, reject) => {
      const isUrl = /^https?:\/\//i.test(query.trim());
      const target = isUrl ? query.trim() : `ytsearch${limit}:${query.trim()}`;

      const args = [
        '--dump-json',
        '--flat-playlist',
        '--default-search', 'ytsearch',
        '--no-check-certificates',
        '--no-warnings',
        '--prefer-free-formats',
        target
      ];

      const proc = spawn(this.ytdlpPath, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      proc.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0 && !stdout.trim()) {
          return resolve([]);
        }

        try {
          const lines = stdout.trim().split('\n').filter(Boolean);
          const results = lines.map((line) => {
            const raw = JSON.parse(line);
            return {
              id: raw.id || '',
              title: raw.title || 'Unknown Title',
              author: raw.uploader || raw.channel || raw.artist || 'Unknown Artist',
              duration: Math.round(raw.duration || 0),
              durationFormatted: this.formatDuration(Math.round(raw.duration || 0)),
              url: raw.webpage_url || (raw.id ? `https://www.youtube.com/watch?v=${raw.id}` : query),
              thumbnail: raw.thumbnail || (raw.thumbnails && raw.thumbnails[0]?.url) || (raw.id ? `https://i.ytimg.com/vi/${raw.id}/hqdefault.jpg` : ''),
              views: raw.view_count || 0
            };
          });

          resolve(results);
        } catch (err) {
          resolve([]);
        }
      });

      proc.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Get direct streaming URL or stream track through FFmpeg
   */
  async createAudioStream(trackUrl, options = {}) {
    const {
      seekSeconds = 0,
      filter = '',
      speed = 1.0,
      volume = 1.0
    } = options;

    return new Promise(async (resolve, reject) => {
      try {
        // 1. Extract direct audio stream URL with yt-dlp
        const streamUrl = await this.getDirectStreamUrl(trackUrl);

        // 2. Build FFmpeg audio filter string
        const filterParts = [];

        if (speed && speed !== 1.0) {
          filterParts.push(`atempo=${Math.max(0.5, Math.min(2.0, speed))}`);
        }

        if (filter && AUDIO_FILTERS[filter]) {
          filterParts.push(AUDIO_FILTERS[filter]);
        } else if (filter && typeof filter === 'string' && filter.includes('=')) {
          filterParts.push(filter);
        }

        if (volume && volume !== 1.0) {
          filterParts.push(`volume=${volume}`);
        }

        const afString = filterParts.length > 0 ? filterParts.join(',') : null;

        // 3. Assemble FFmpeg arguments
        const ffmpegArgs = [
          '-reconnect', '1',
          '-reconnect_streamed', '1',
          '-reconnect_delay_max', '5'
        ];

        if (seekSeconds > 0) {
          ffmpegArgs.push('-ss', seekSeconds.toString());
        }

        ffmpegArgs.push(
          '-i', streamUrl || trackUrl,
          '-analyzeduration', '0',
          '-loglevel', '0'
        );

        if (afString) {
          ffmpegArgs.push('-af', afString);
        }

        ffmpegArgs.push(
          '-f', 's16le',
          '-ar', '48000',
          '-ac', '2',
          'pipe:1'
        );

        const ffmpegProc = spawn(this.ffmpegPath, ffmpegArgs, {
          stdio: ['ignore', 'pipe', 'ignore']
        });

        ffmpegProc.on('error', (err) => {
          console.error('[FFmpeg Process Error]', err);
        });

        // 4. Create Discord Audio Resource
        const resource = createAudioResource(ffmpegProc.stdout, {
          inputType: StreamType.Raw,
          inlineVolume: true
        });

        resource.ffmpegProcess = ffmpegProc;
        resolve({ resource, process: ffmpegProc });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Extract audio stream URL using yt-dlp
   */
  async getDirectStreamUrl(url) {
    return new Promise((resolve, reject) => {
      const args = [
        '-g',
        '-f', 'bestaudio/best',
        '--no-playlist',
        '--no-check-certificates',
        '--no-warnings',
        url
      ];

      const proc = spawn(this.ytdlpPath, args);
      let stdout = '';

      proc.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });

      proc.on('close', (code) => {
        const streamUrl = stdout.trim().split('\n')[0];
        if (code === 0 && streamUrl) {
          resolve(streamUrl);
        } else {
          // Fallback to passing the original URL directly to ffmpeg
          resolve(url);
        }
      });

      proc.on('error', () => {
        resolve(url);
      });
    });
  }

  /**
   * Helper to format seconds into mm:ss or hh:mm:ss
   */
  formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }
}

export default YtdlpFFmpegEngine;
