import { spawn } from 'child_process';
import config from '../config.js';

export class LyricsService {
  constructor(options = {}) {
    this.ytdlpPath = options.ytdlpPath || config.engine?.ytdlpPath || 'yt-dlp';
  }

  /**
   * Cleans track titles by stripping common suffixes like [Official Video], (Lyrics), etc.
   */
  cleanTrackInfo(rawTitle = '', rawArtist = '') {
    let title = rawTitle;
    let artist = rawArtist;

    // Check if title is in "Artist - Title" format
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      if (parts.length >= 2) {
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }
    }

    // Strip common YouTube fluff
    title = title
      .replace(/\s*[\(\[](official\s*video|official\s*music\s*video|official\s*audio|music\s*video|lyrics|lyric\s*video|audio|visualizer|hd|4k|remastered|explicit|clean)[\)\]]/gi, '')
      .replace(/\s*ft\.?.*$/i, '')
      .replace(/\s*feat\.?.*$/i, '')
      .replace(/\|.*$/g, '')
      .trim();

    artist = artist
      .replace(/ - Topic$/i, '')
      .replace(/VEVO$/i, '')
      .trim();

    return { title, artist };
  }

  /**
   * Main method to fetch lyrics using LRCLIB API or yt-dlp metadata
   */
  async fetchLyrics(rawTitle, rawArtist = '', trackUrl = '') {
    const { title, artist } = this.cleanTrackInfo(rawTitle, rawArtist);

    // 1. Try LRCLIB exact get
    if (title && artist) {
      try {
        const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'GrooveMusicBot/2.0' } });
        if (res.ok) {
          const data = await res.json();
          if (data && data.plainLyrics) {
            return {
              title: data.trackName || title,
              artist: data.artistName || artist,
              album: data.albumName || '',
              lyrics: data.plainLyrics,
              syncedLyrics: data.syncedLyrics || null,
              source: 'LRCLIB Music Database',
              isSynced: Boolean(data.syncedLyrics)
            };
          }
        }
      } catch (err) {
        console.warn('[LyricsService] LRCLIB exact get error:', err.message);
      }
    }

    // 2. Try LRCLIB search query
    try {
      const query = `${title} ${artist}`.trim();
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(searchUrl, { headers: { 'User-Agent': 'GrooveMusicBot/2.0' } });
      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          const match = results.find(r => r.plainLyrics) || results[0];
          if (match && match.plainLyrics) {
            return {
              title: match.trackName || title,
              artist: match.artistName || artist,
              album: match.albumName || '',
              lyrics: match.plainLyrics,
              syncedLyrics: match.syncedLyrics || null,
              source: 'LRCLIB Music Database',
              isSynced: Boolean(match.syncedLyrics)
            };
          }
        }
      }
    } catch (err) {
      console.warn('[LyricsService] LRCLIB search error:', err.message);
    }

    // 3. Try yt-dlp metadata extraction (Description lyrics or captions)
    if (trackUrl && /^https?:\/\//i.test(trackUrl)) {
      try {
        const ytdlpLyrics = await this.extractLyricsFromYtdlp(trackUrl);
        if (ytdlpLyrics) {
          return {
            title,
            artist,
            lyrics: ytdlpLyrics.lyrics,
            source: ytdlpLyrics.source,
            isSynced: false
          };
        }
      } catch (err) {
        console.warn('[LyricsService] yt-dlp extraction error:', err.message);
      }
    }

    return null;
  }

  /**
   * Extract lyrics from yt-dlp metadata description or automated captions
   */
  async extractLyricsFromYtdlp(url) {
    return new Promise((resolve) => {
      const args = [
        '--dump-json',
        '--skip-download',
        '--no-warnings',
        '--no-check-certificates',
        url
      ];

      const proc = spawn(this.ytdlpPath, args);
      let stdout = '';

      proc.stdout.on('data', chunk => {
        stdout += chunk.toString();
      });

      proc.on('close', code => {
        if (code !== 0 || !stdout.trim()) return resolve(null);

        try {
          const data = JSON.parse(stdout.trim());
          const description = data.description || '';

          // Look for lyrics pattern in description
          const lyricsMatch = description.match(/(?:lyrics|paroles|letra|songtext):\s*[\r\n]+([\s\S]+?)(?:[\r\n]{2,}(?:connect|follow|subscribe|spotify|apple|socials|instagram|twitter|tiktok|credits|produced by)|$)/i);

          if (lyricsMatch && lyricsMatch[1] && lyricsMatch[1].trim().length > 80) {
            return resolve({
              lyrics: lyricsMatch[1].trim(),
              source: 'yt-dlp Video Metadata (Description)'
            });
          }

          // If no explicit lyrics section, check if description looks like verse/chorus lyrics
          if (description.includes('[Chorus]') || description.includes('[Verse 1]') || description.includes('(Chorus)')) {
            const verseMatch = description.match(/(\[(?:Verse|Chorus|Intro|Outro|Bridge)[\s\S]+)/i);
            if (verseMatch && verseMatch[1].trim().length > 80) {
              return resolve({
                lyrics: verseMatch[1].trim(),
                source: 'yt-dlp Video Metadata (Description Verses)'
              });
            }
          }

          resolve(null);
        } catch {
          resolve(null);
        }
      });

      proc.on('error', () => {
        resolve(null);
      });
    });
  }
}

export const lyricsService = new LyricsService();
export default lyricsService;
