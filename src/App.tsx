import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Search,
  Sliders,
  Server,
  Terminal,
  Download,
  Code,
  BookOpen,
  Cpu,
  Activity,
  Check,
  Copy,
  ExternalLink,
  Layers,
  Radio,
  Sparkles,
  Headphones,
  Disc,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileCode,
  ChevronRight,
  Zap,
  FileText,
  Mic,
  AlignLeft,
  Settings,
  Gauge,
  Clock,
  ShieldCheck,
  Palette,
  Wifi,
  Package,
  Plus,
  Folder,
  Save,
  ListMusic,
  Bookmark,
  FolderHeart,
  PlayCircle,
  Battery,
  Signal,
  Smartphone,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Music2
} from 'lucide-react';

interface BotConfig {
  prefix: string;
  defaultVolume: number;
  defaultFilter: string;
  defaultSpeed: number;
  stay247: boolean;
  autoplay: boolean;
  emptyChannelTimeout: number;
  announceNowPlaying: boolean;
  voteSkipPercentage: number;
  maxQueueSize: number;
  embedColor: string;
  djOnlyMode: boolean;
}

interface ActiveSession {
  guildId: string;
  guildName: string;
  voiceChannelId: string;
  textChannelId: string;
  isPlaying: boolean;
  currentTrack?: {
    title: string;
    author: string;
    durationFormatted: string;
  } | null;
  queueCount: number;
  volume: number;
  filter: string;
  speed: number;
  stay247: boolean;
  autoplay: boolean;
}

interface DiagnosticsData {
  timestamp: string;
  totalDurationMs: number;
  ytdlp: {
    status: string;
    version: string;
    latencyMs: number;
  };
  ffmpeg: {
    status: string;
    version: string;
    latencyMs: number;
    transcodePipeline: string;
  };
}

interface LyricsData {
  title: string;
  artist: string;
  album?: string;
  lyrics: string;
  syncedLyrics?: string | null;
  source: string;
  isSynced?: boolean;
}

interface EngineStatus {
  engine: {
    type: string;
    ytdlpVersion: string;
    ffmpegVersion: string;
    lavalinkRemoved: boolean;
    audioFormats: string[];
    filtersAvailable: string[];
  };
  system: {
    platform: string;
    uptimeSeconds: number;
    memory: {
      totalMb: number;
      usedMb: number;
      freeMb: number;
      usagePercent: number;
    };
    cpuCount: number;
  };
  bot: {
    online: boolean;
    user: { id: string; tag: string; avatar: string | null } | null;
    guildCount: number;
    activeVoicePlayers: number;
    ping: number;
  };
}

interface Track {
  id: string;
  title: string;
  author: string;
  duration: number;
  durationFormatted: string;
  url: string;
  thumbnail: string;
  views?: number;
}

interface SavedPlaylist {
  id: string;
  name: string;
  createdAt: number;
  tracks: Track[];
}

interface BotLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

interface FileItem {
  path: string;
  name: string;
  isDir: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'studio' | 'queue' | 'commands' | 'code' | 'guide'>('dashboard');
  const [studioSubTab, setStudioSubTab] = useState<'player' | 'queue' | 'dsp'>('player');
  const [viewMode, setViewMode] = useState<'responsive' | 'mobile'>('responsive');
  const [showCodeDrawer, setShowCodeDrawer] = useState(false);
  const [botFeedback, setBotFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [configSaveError, setConfigSaveError] = useState<string | null>(null);

  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [botToken, setBotToken] = useState('');
  const [botPrefix, setBotPrefix] = useState('/');
  const [isBotStarting, setIsBotStarting] = useState(false);

  // Studio / Player State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('clear');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [loopMode, setLoopMode] = useState<'off' | 'track' | 'queue'>('off');

  // Saved Playlists State (localStorage)
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>(() => {
    try {
      const stored = localStorage.getItem('groove_saved_playlists');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return [
      {
        id: 'starter-1',
        name: 'Chill Vibes & Synthwave',
        createdAt: Date.now() - 86400000,
        tracks: [
          {
            id: 'demo-1',
            title: 'Blinding Lights',
            author: 'The Weeknd',
            duration: 200,
            durationFormatted: '03:20',
            url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
            thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'
          },
          {
            id: 'demo-2',
            title: 'Midnight City',
            author: 'M83',
            duration: 244,
            durationFormatted: '04:04',
            url: 'https://www.youtube.com/watch?v=dX3k_QDnzHE',
            thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&auto=format&fit=crop&q=80'
          }
        ]
      },
      {
        id: 'starter-2',
        name: 'Late Night Coding',
        createdAt: Date.now() - 43200000,
        tracks: [
          {
            id: 'demo-3',
            title: 'Resonance',
            author: 'HOME',
            duration: 212,
            durationFormatted: '03:32',
            url: 'https://www.youtube.com/watch?v=8GW6sLrK40k',
            thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80'
          }
        ]
      }
    ];
  });
  const [playlistNameInput, setPlaylistNameInput] = useState('');
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false);
  const [playlistTabMode, setPlaylistTabMode] = useState<'queue' | 'saved'>('queue');
  const [playlistFeedback, setPlaylistFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewPlaylistId, setPreviewPlaylistId] = useState<string | null>(null);

  // Lyrics State
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [showLyricsPanel, setShowLyricsPanel] = useState(false);
  const [lyricsViewType, setLyricsViewType] = useState<'plain' | 'synced'>('plain');
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  // Code Explorer State
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('src/structures/YtdlpFFmpegEngine.js');
  const [fileContent, setFileContent] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Command Simulator State
  const [simCommand, setSimCommand] = useState('/play blinding lights');
  const [simOutput, setSimOutput] = useState<any>(null);
  const [commandsTabMode, setCommandsTabMode] = useState<'terminal' | 'packages' | 'simulator'>('terminal');

  // Bot & Guild Config State
  const [botConfig, setBotConfig] = useState<BotConfig>({
    prefix: '/',
    defaultVolume: 80,
    defaultFilter: 'clear',
    defaultSpeed: 1.0,
    stay247: false,
    autoplay: true,
    emptyChannelTimeout: 3,
    announceNowPlaying: true,
    voteSkipPercentage: 50,
    maxQueueSize: 250,
    embedColor: '#6366f1',
    djOnlyMode: false
  });
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [configSection, setConfigSection] = useState<'audio' | 'voice' | 'rules'>('audio');

  // Interactive Console & Terminal State
  const [dashboardConsoleTab, setDashboardConsoleTab] = useState<'terminal' | 'packages' | 'logs'>('terminal');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalEntries, setTerminalEntries] = useState<Array<{ id: string; type: 'cmd' | 'output' | 'error' | 'info'; text: string; timestamp: string }>>([
    {
      id: 'welcome-1',
      type: 'info',
      text: 'Groove Music Terminal & Package Manager initialized.\nType "help" for a list of commands, run any bash/bot command, or install packages directly.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isExecutingCmd, setIsExecutingCmd] = useState(false);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [consoleCwd, setConsoleCwd] = useState<'bot' | 'root'>('bot');

  // Package Management ("Install My Things") State
  const [packagesData, setPackagesData] = useState<{
    botDependencies: Record<string, string>;
    rootDependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  } | null>(null);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);
  const [customPkgName, setCustomPkgName] = useState('');
  const [pkgTarget, setPkgTarget] = useState<'bot' | 'root'>('bot');
  const [isInstallingPkg, setIsInstallingPkg] = useState(false);
  const [pkgActionFeedback, setPkgActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Fetch status periodically
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/engine/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {}
  };

  const fetchBotConfig = async () => {
    try {
      const res = await fetch('/api/bot/config');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setBotConfig(data.config);
          if (data.config.prefix) setBotPrefix(data.config.prefix);
        }
        if (data.activeSessions) {
          setActiveSessions(data.activeSessions);
        }
      }
    } catch {}
  };

  const handleSaveConfig = async (overrideUpdates?: Partial<BotConfig>) => {
    setIsSavingConfig(true);
    try {
      const payload = overrideUpdates ? { ...botConfig, ...overrideUpdates } : botConfig;
      const res = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.config) {
        setBotConfig(data.config);
        setConfigSaveSuccess(true);
        setTimeout(() => setConfigSaveSuccess(false), 2500);
        fetchLogs();
      } else {
        setConfigSaveError(data.error || 'Failed to save configuration');
        setTimeout(() => setConfigSaveError(null), 4000);
      }
    } catch (err: any) {
      setConfigSaveError(`Failed to save config: ${err.message}`);
      setTimeout(() => setConfigSaveError(null), 4000);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleRunBenchmark = async () => {
    setIsRunningBenchmark(true);
    try {
      const res = await fetch('/api/engine/benchmark', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.diagnostics) {
        setDiagnostics(data.diagnostics);
        fetchLogs();
      }
    } catch (err: any) {
      console.error('Benchmark failed:', err);
    } finally {
      setIsRunningBenchmark(false);
    }
  };

  const [isInstallingBinaries, setIsInstallingBinaries] = useState(false);
  const [binaryInstallFeedback, setBinaryInstallFeedback] = useState<string | null>(null);

  const handleAutoInstallBinaries = async (force: boolean = false) => {
    setIsInstallingBinaries(true);
    setBinaryInstallFeedback(null);
    try {
      const res = await fetch('/api/system/install-binaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBinaryInstallFeedback('✓ Audio binaries (yt-dlp & FFmpeg) successfully verified and ready!');
        fetchStatus();
        fetchLogs();
      } else {
        setBinaryInstallFeedback(`⚠️ Installation alert: ${data.error || 'Check logs for details'}`);
      }
    } catch (err: any) {
      setBinaryInstallFeedback(`Error: ${err.message}`);
    } finally {
      setIsInstallingBinaries(false);
      setTimeout(() => setBinaryInstallFeedback(null), 5000);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/bot/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {}
  };

  const fetchPackagesList = async () => {
    setIsLoadingPackages(true);
    try {
      const res = await fetch('/api/packages/list');
      if (res.ok) {
        const data = await res.json();
        setPackagesData(data);
      }
    } catch {} finally {
      setIsLoadingPackages(false);
    }
  };

  const handleExecuteConsole = async (overrideCmd?: string) => {
    const cmdToRun = overrideCmd !== undefined ? overrideCmd : terminalInput;
    if (!cmdToRun || !cmdToRun.trim()) return;

    const trimmed = cmdToRun.trim();
    if (trimmed !== 'clear' && trimmed !== 'cls') {
      setCmdHistory((prev) => [trimmed, ...prev.filter((c) => c !== trimmed)].slice(0, 50));
      setHistoryIdx(-1);
    }

    const cmdEntryId = 'cmd-' + Date.now();
    setTerminalEntries((prev) => [
      ...prev,
      {
        id: cmdEntryId,
        type: 'cmd',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    setTerminalInput('');
    setIsExecutingCmd(true);

    try {
      const res = await fetch('/api/console/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed, cwd: consoleCwd })
      });
      const data = await res.json();

      if (data.isClear) {
        setTerminalEntries([]);
      } else {
        setTerminalEntries((prev) => [
          ...prev,
          {
            id: 'res-' + Date.now(),
            type: data.success ? 'output' : 'error',
            text: data.output || '(No output produced)',
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }

      if (/^npm\s+(install|i|uninstall|rm)\b/i.test(trimmed)) {
        fetchPackagesList();
      }
      if (/^bot\s+/i.test(trimmed)) {
        fetchStatus();
      }
      fetchLogs();
    } catch (err: any) {
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          type: 'error',
          text: `Command execution failed: ${err.message}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setIsExecutingCmd(false);
      setTimeout(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const handleInstallPackage = async (packageName?: string) => {
    const pkg = packageName || customPkgName;
    if (!pkg || !pkg.trim()) return;

    const trimmed = pkg.trim();
    setIsInstallingPkg(true);
    setPkgActionFeedback(null);

    setTerminalEntries((prev) => [
      ...prev,
      {
        id: 'pkg-start-' + Date.now(),
        type: 'cmd',
        text: `npm install in /${pkgTarget}: ${trimmed}`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    try {
      const res = await fetch('/api/packages/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName: trimmed, target: pkgTarget })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPkgActionFeedback({ type: 'success', message: data.message });
        setCustomPkgName('');
        setTerminalEntries((prev) => [
          ...prev,
          {
            id: 'pkg-ok-' + Date.now(),
            type: 'output',
            text: `✓ ${data.message}\n${data.output || ''}`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        fetchPackagesList();
      } else {
        setPkgActionFeedback({ type: 'error', message: data.error || 'Installation failed.' });
        setTerminalEntries((prev) => [
          ...prev,
          {
            id: 'pkg-fail-' + Date.now(),
            type: 'error',
            text: `❌ Installation failed: ${data.error || 'Unknown error'}\n${data.output || ''}`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }
      fetchLogs();
    } catch (err: any) {
      setPkgActionFeedback({ type: 'error', message: err.message });
    } finally {
      setIsInstallingPkg(false);
      setTimeout(() => setPkgActionFeedback(null), 4000);
      setTimeout(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const handleUninstallPackage = async (pkgName: string) => {
    try {
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: 'pkg-uninst-start-' + Date.now(),
          type: 'cmd',
          text: `Uninstalling ${pkgName}...`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      const res = await fetch('/api/packages/uninstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageName: pkgName, target: 'bot' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTerminalEntries((prev) => [
          ...prev,
          {
            id: 'pkg-uninst-' + Date.now(),
            type: 'output',
            text: `✓ Successfully uninstalled ${pkgName}`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
        fetchPackagesList();
      } else {
        setTerminalEntries((prev) => [
          ...prev,
          {
            id: 'pkg-uninst-err-' + Date.now(),
            type: 'error',
            text: `❌ Failed to uninstall ${pkgName}: ${data.error || 'Unknown error'}`,
            timestamp: new Date().toLocaleTimeString()
          }
        ]);
      }
    } catch (err: any) {
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: 'pkg-uninst-err-' + Date.now(),
          type: 'error',
          text: `❌ Error uninstalling ${pkgName}: ${err.message}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/bot/files');
      if (res.ok) {
        const data = await res.json();
        setFileList(data.files || []);
      }
    } catch {}
  };

  const fetchFileContent = async (filePath: string) => {
    try {
      const res = await fetch(`/api/bot/file-content?path=${encodeURIComponent(filePath)}`);
      if (res.ok) {
        const data = await res.json();
        setFileContent(data.content);
        setSelectedFile(filePath);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    fetchBotConfig();
    fetchLogs();
    fetchPackagesList();
    fetchFiles();
    fetchFileContent('src/structures/YtdlpFFmpegEngine.js');

    const interval = setInterval(() => {
      fetchStatus();
      fetchBotConfig();
      fetchLogs();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Handle Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch Lyrics for Track
  const fetchLyricsForTrack = async (title: string, artist: string = '', url: string = '') => {
    setIsLoadingLyrics(true);
    setShowLyricsPanel(true);
    try {
      const res = await fetch(`/api/music/lyrics?track=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}&url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (res.ok && data.lyrics) {
        setLyricsData(data.lyrics);
      } else {
        setLyricsData({
          title,
          artist,
          lyrics: data.error || 'No lyrics found for this track. Try searching with a specific title and artist.',
          source: 'Not Found',
          isSynced: false
        });
      }
    } catch (err: any) {
      setLyricsData({
        title,
        artist,
        lyrics: `Error fetching lyrics: ${err.message}`,
        source: 'Error',
        isSynced: false
      });
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  // Play Track in Studio
  const playTrackInStudio = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    fetchLyricsForTrack(track.title, track.author, track.url);

    if (audioRef.current) {
      const streamUrl = `/api/music/stream?url=${encodeURIComponent(track.url)}&filter=${encodeURIComponent(selectedFilter)}&speed=${playbackSpeed}`;
      audioRef.current.src = streamUrl;
      audioRef.current.volume = isMuted ? 0 : volume / 100;
      audioRef.current.play().catch(() => {});
    }
  };

  // Toggle Filter in Studio
  const handleFilterChange = (filterKey: string) => {
    setSelectedFilter(filterKey);
    if (currentTrack && audioRef.current) {
      const streamUrl = `/api/music/stream?url=${encodeURIComponent(currentTrack.url)}&filter=${encodeURIComponent(filterKey)}&speed=${playbackSpeed}`;
      audioRef.current.src = streamUrl;
      audioRef.current.play().catch(() => {});
    }
  };

  // Toggle Speed
  const handleSpeedChange = (speedVal: number) => {
    setPlaybackSpeed(speedVal);
    if (currentTrack && audioRef.current) {
      const streamUrl = `/api/music/stream?url=${encodeURIComponent(currentTrack.url)}&filter=${encodeURIComponent(selectedFilter)}&speed=${speedVal}`;
      audioRef.current.src = streamUrl;
      audioRef.current.play().catch(() => {});
    }
  };

  // Skip Track Handler
  const handleSkip = () => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue(q => q.slice(1));
      playTrackInStudio(next);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    }
  };

  // Code Explorer File Select
  const handleFileSelect = (filePath: string) => {
    fetchFileContent(filePath);
  };

  // Playlist Management Handlers (localStorage)
  const handleSaveCurrentQueue = (nameToSave?: string) => {
    const finalName = (nameToSave || playlistNameInput).trim();
    if (!finalName) {
      setPlaylistFeedback({ type: 'error', message: 'Please enter a name for your playlist.' });
      setTimeout(() => setPlaylistFeedback(null), 3000);
      return;
    }

    const tracksToSave = queue.length > 0 ? [...queue] : (currentTrack ? [currentTrack] : []);
    if (tracksToSave.length === 0) {
      setPlaylistFeedback({ type: 'error', message: 'Queue is empty! Search and queue tracks first.' });
      setTimeout(() => setPlaylistFeedback(null), 3000);
      return;
    }

    const newPlaylist: SavedPlaylist = {
      id: 'pl-' + Date.now(),
      name: finalName,
      createdAt: Date.now(),
      tracks: tracksToSave
    };

    const updated = [newPlaylist, ...savedPlaylists];
    setSavedPlaylists(updated);
    try {
      localStorage.setItem('groove_saved_playlists', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }

    setPlaylistNameInput('');
    setIsSavingPlaylist(false);
    setPlaylistFeedback({
      type: 'success',
      message: `Saved "${finalName}" with ${tracksToSave.length} track${tracksToSave.length > 1 ? 's' : ''}!`
    });
    setTimeout(() => setPlaylistFeedback(null), 3500);
  };

  const handleLoadPlaylist = (playlist: SavedPlaylist, mode: 'replace' | 'append') => {
    if (!playlist.tracks || playlist.tracks.length === 0) return;

    if (mode === 'replace') {
      setQueue([...playlist.tracks]);
      setPlaylistFeedback({
        type: 'success',
        message: `Loaded "${playlist.name}" (${playlist.tracks.length} tracks into queue).`
      });
    } else {
      setQueue((prev) => [...prev, ...playlist.tracks]);
      setPlaylistFeedback({
        type: 'success',
        message: `Appended ${playlist.tracks.length} tracks from "${playlist.name}" to queue.`
      });
    }
    setPlaylistTabMode('queue');
    setTimeout(() => setPlaylistFeedback(null), 3500);
  };

  const handlePlayPlaylistNow = (playlist: SavedPlaylist) => {
    if (!playlist.tracks || playlist.tracks.length === 0) return;

    const firstTrack = playlist.tracks[0];
    const remaining = playlist.tracks.slice(1);

    setQueue(remaining);
    playTrackInStudio(firstTrack);
    setPlaylistTabMode('queue');
    setPlaylistFeedback({
      type: 'success',
      message: `Now playing "${playlist.name}" starting with "${firstTrack.title}"!`
    });
    setTimeout(() => setPlaylistFeedback(null), 3500);
  };

  const handleDeletePlaylist = (id: string, name: string) => {
    const updated = savedPlaylists.filter((p) => p.id !== id);
    setSavedPlaylists(updated);
    try {
      localStorage.setItem('groove_saved_playlists', JSON.stringify(updated));
    } catch {}
    setPlaylistFeedback({
      type: 'success',
      message: `Deleted playlist "${name}".`
    });
    setTimeout(() => setPlaylistFeedback(null), 3000);
  };

  // Start / Stop Bot
  const handleStartBot = async () => {
    if (!botToken.trim()) {
      setBotFeedback({
        type: 'error',
        message: 'Please enter your Discord Bot Token before launching the bot.'
      });
      setTimeout(() => setBotFeedback(null), 5000);
      return;
    }

    setIsBotStarting(true);
    setBotFeedback(null);
    try {
      const res = await fetch('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken, prefix: botPrefix })
      });
      const data = await res.json();
      if (!res.ok) {
        setBotFeedback({
          type: 'error',
          message: data.error || 'Failed to start bot'
        });
      } else {
        setBotFeedback({
          type: 'success',
          message: '✓ Groove Music Bot connected and active!'
        });
        fetchStatus();
        fetchLogs();
      }
    } catch (err: any) {
      setBotFeedback({
        type: 'error',
        message: `Error starting bot: ${err.message}`
      });
    } finally {
      setIsBotStarting(false);
      setTimeout(() => setBotFeedback(null), 5000);
    }
  };

  const handleStopBot = async () => {
    try {
      const res = await fetch('/api/bot/stop', { method: 'POST' });
      const data = await res.json();
      setBotFeedback({
        type: 'info',
        message: data.message || 'Bot instance stopped.'
      });
      fetchStatus();
      fetchLogs();
    } catch (err: any) {
      setBotFeedback({
        type: 'error',
        message: `Error stopping bot: ${err.message}`
      });
    } finally {
      setTimeout(() => setBotFeedback(null), 4000);
    }
  };

  // Audio Visualizer Canvas Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bars = 40;
    let values = new Array(bars).fill(10);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bars) - 2;

      for (let i = 0; i < bars; i++) {
        if (isPlaying) {
          const target = Math.random() * (canvas.height * 0.75) + 6;
          values[i] += (target - values[i]) * 0.2;
        } else {
          values[i] += (4 - values[i]) * 0.1;
        }

        const h = values[i];
        const x = i * (barWidth + 2);
        const y = canvas.height - h;

        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, '#818cf8');
        grad.addColorStop(1, '#4f46e5');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying]);

  // Command Simulator Handler
  const handleSimulate = () => {
    const input = simCommand.trim();
    const clean = input.replace(/^[/!]/, '').trim();
    if (clean.startsWith('play')) {
      const q = clean.replace(/^play/, '').trim() || 'Starboy';
      setSimOutput({
        type: 'embed',
        title: '🎵 Now Playing (/play)',
        color: '#6366f1',
        fields: [
          { name: 'Track', value: `**${q.toUpperCase()}**` },
          { name: 'Author', value: 'The Weeknd' },
          { name: 'Duration', value: '03:50' },
          { name: 'Audio Engine', value: '`yt-dlp` -> `FFmpeg` (PCM 48kHz Stereo)' },
          { name: 'Active Filter', value: `\`${selectedFilter}\`` }
        ]
      });
    } else if (clean.startsWith('filter')) {
      const f = clean.replace(/^filter/, '').trim() || 'bassboost';
      setSimOutput({
        type: 'embed',
        title: '🎛️ Audio Filter Applied (/filter)',
        color: '#10b981',
        description: `Applied **${f.toUpperCase()}** directly to audio stream via FFmpeg \`-af\` pipeline with 0ms interruption.`
      });
    } else if (clean.startsWith('queue')) {
      setSimOutput({
        type: 'embed',
        title: '📜 Server Queue (/queue)',
        color: '#6366f1',
        description: '1. Blinding Lights - `03:20`\n2. Save Your Tears - `03:35`\n3. After Hours - `06:01`\n\n*Total duration: 12m 56s*'
      });
    } else if (clean.startsWith('system') || clean.startsWith('node')) {
      setSimOutput({
        type: 'embed',
        title: '🚀 Groove Music Audio Engine (/system)',
        color: '#8b5cf6',
        description: '**Native Engine Active**\n- Extractor: yt-dlp v2026.08.19\n- DSP: FFmpeg v7.0.2-static\n- Transport: @discordjs/voice (Direct UDP Opus)\n- Latency: 18ms\n- Default Prefix: `/` (Slash & text command support)'
      });
    } else if (clean.startsWith('lyrics') || clean.startsWith('ly')) {
      const q = clean.replace(/^(lyrics|ly)/, '').trim() || (currentTrack ? currentTrack.title : 'Blinding Lights');
      setSimOutput({
        type: 'embed',
        title: `📝 Lyrics: ${q} - The Weeknd (/lyrics)`,
        color: '#6366f1',
        description: `Yeah\n\nI've been tryna call\nI've been on my own for long enough\nMaybe you can show me how to love, maybe\n\nI'm going through withdrawals\nYou don't even have to do too much\nYou can turn me on with just a touch, baby\n\nI look around and Sin City's cold and empty\nNo one's around to judge me\nI can't see clearly when you're gone...`,
        fields: [
          { name: 'Source', value: '`LRCLIB Music Database`' },
          { name: 'Synced Support', value: '`Yes (LRC Available)`' },
          { name: 'Album', value: '`After Hours`' }
        ]
      });
    } else {
      setSimOutput({
        type: 'embed',
        title: 'Command Executed',
        color: '#6366f1',
        description: `Command \`${input}\` executed successfully on Groove Music Bot!`
      });
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white flex flex-col items-center justify-start overscroll-none">
      {/* Hidden audio element for browser preview */}
      <audio
        ref={audioRef}
        onEnded={() => {
          if (queue.length > 0) {
            const next = queue[0];
            setQueue(q => q.slice(1));
            playTrackInStudio(next);
          } else {
            setIsPlaying(false);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Responsive & Mobile-Optimized Application Shell */}
      <div className={`w-full ${viewMode === 'mobile' ? 'max-w-md mx-auto sm:border-x sm:border-slate-800/60 sm:shadow-2xl sm:shadow-black' : 'max-w-7xl mx-auto px-2 sm:px-4 lg:px-6'} min-h-[100dvh] bg-slate-950 flex flex-col relative`}>

        {/* Clean Responsive / Mobile Top App Bar */}
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/60 px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              <Disc className={`w-4 h-4 text-white ${isPlaying ? 'animate-spin-slow' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-tight">Groove Music</span>
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${status?.bot.online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {status?.bot.online ? 'Online' : 'Standby'}
                </span>
                <span className="text-slate-600 text-xs">·</span>
                <span className="text-xs text-indigo-300/90 font-mono">prefix: <strong className="text-indigo-400 font-bold">/</strong></span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">yt-dlp & FFmpeg Native Audio · Direct Voice Stream</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Active in responsive mode on larger displays) */}
          <div className={`${viewMode === 'mobile' ? 'hidden' : 'hidden md:flex'} items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs`}>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="w-3.5 h-3.5" /> Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab('studio');
                setStudioSubTab('player');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'studio' && studioSubTab !== 'queue' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Disc className="w-3.5 h-3.5" /> Studio
            </button>
            <button
              onClick={() => {
                setActiveTab('studio');
                setStudioSubTab('queue');
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'studio' && studioSubTab === 'queue' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" /> Queue
              {queue.length > 0 && <span className="px-1 text-[9px] bg-indigo-500 rounded-full">{queue.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('commands')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'commands' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> Console
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'guide' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Guide
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View Mode Switcher */}
            <button
              onClick={() => setViewMode(viewMode === 'responsive' ? 'mobile' : 'responsive')}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                viewMode === 'mobile'
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={viewMode === 'responsive' ? 'Switch to Compact Mobile View' : 'Switch to Full Dashboard View'}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{viewMode === 'responsive' ? 'Mobile View' : 'Full View'}</span>
            </button>

            {/* Quick Action: Auto-Verify & Download VPS Binaries */}
            <button
              onClick={() => handleAutoInstallBinaries(false)}
              disabled={isInstallingBinaries}
              className={`p-2 rounded-xl border text-xs transition-all ${
                isInstallingBinaries
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-indigo-400 active:scale-95'
              }`}
              title="Verify & Auto-Download VPS Binaries"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isInstallingBinaries ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Quick Action: Code Explorer Drawer */}
            <button
              onClick={() => setShowCodeDrawer(!showCodeDrawer)}
              className={`p-2 rounded-xl border text-xs transition-all ${
                showCodeDrawer
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-indigo-400 active:scale-95'
              }`}
              title="View Codebase Explorer"
            >
              <Code className="w-3.5 h-3.5" />
            </button>

            {/* Quick Action: Export ZIP */}
            <a
              href="/api/download-bot"
              download="Groove-Music-Ytdlp-FFmpeg.zip"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 active:scale-95 transition-all"
              title="Export Bot (.ZIP)"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-3 pt-3 pb-32 space-y-4 ${viewMode === 'mobile' ? '' : 'w-full'}`}>
        {/* TAB 1: DASHBOARD & BOT CONTROLLER */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Stat Cards (2x2 Mobile Grid or 4 across on Desktop) */}
            <div className={`grid grid-cols-2 ${viewMode === 'mobile' ? '' : 'md:grid-cols-4'} gap-2.5`}>
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400 font-medium">Discord Bot</span>
                  <span className={`w-2 h-2 rounded-full ${status?.bot.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  {status?.bot.online ? 'ONLINE' : 'STANDBY'}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{status?.bot.user?.tag || 'Not Connected'}</div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400 font-medium">yt-dlp Engine</span>
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="text-sm font-bold text-indigo-300">Ready</div>
                <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">v{status?.engine.ytdlpVersion || '2026.08.19'}</div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400 font-medium">FFmpeg Core</span>
                  <Sliders className="w-3.5 h-3.5 text-violet-400" />
                </div>
                <div className="text-sm font-bold text-violet-300">Active DSP</div>
                <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">v{status?.engine.ffmpegVersion || '4.4.2'}</div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-slate-400 font-medium">Server RAM</span>
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-sm font-bold text-amber-300">
                  {status?.system.memory.usedMb || 0} MB
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-amber-500 h-1 rounded-full"
                    style={{ width: `${status?.system.memory.usagePercent || 15}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Auto-Installer Binary Status & VPS Hook Banner */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-3.5 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-200 font-semibold">VPS Auto-Dependency Engine:</span>
                <span className="text-slate-400">
                  {status?.engine.ytdlpVersion !== 'Not Installed' && status?.engine.ffmpegVersion !== 'Not Installed'
                    ? 'yt-dlp & FFmpeg verified and ready for streaming.'
                    : 'Auto-downloading missing audio binaries in background...'}
                </span>
                {binaryInstallFeedback && (
                  <span className="font-mono text-emerald-400 font-semibold">{binaryInstallFeedback}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAutoInstallBinaries(false)}
                  disabled={isInstallingBinaries}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all font-medium flex items-center gap-1.5 disabled:opacity-50 text-xs"
                  title="Verify and auto-download missing binaries"
                >
                  {isInstallingBinaries ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Verify / Auto-Download Binaries
                </button>
                <button
                  onClick={() => handleAutoInstallBinaries(true)}
                  disabled={isInstallingBinaries}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all text-xs disabled:opacity-50"
                  title="Force re-download newest yt-dlp & FFmpeg releases"
                >
                  Force Update
                </button>
              </div>
            </div>

            {/* Main Controller & Comparison Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bot Controller Panel */}
              <div className="lg:col-span-1 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <Radio className="w-4 h-4 text-indigo-400" /> Bot Instance Controller
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${status?.bot.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {status?.bot.online ? 'Active' : 'Offline'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Discord Bot Token</label>
                    <input
                      type="password"
                      placeholder="MTAyND..."
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Token is kept in-memory and never sent to external servers. You can also define it in <code className="text-slate-400">.env</code> as <code className="text-slate-400">DISCORD_TOKEN</code>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">Prefix</label>
                        <span className="text-[10px] text-indigo-400 font-mono">Slash + Text</span>
                      </div>
                      <input
                        type="text"
                        value={botPrefix}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBotPrefix(val);
                          setBotConfig(prev => ({ ...prev, prefix: val }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="/"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">Active Guilds</label>
                      <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400">
                        {status?.bot.guildCount || 0} servers
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    {!status?.bot.online ? (
                      <button
                        onClick={handleStartBot}
                        disabled={isBotStarting}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {isBotStarting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        Launch Bot
                      </button>
                    ) : (
                      <button
                        onClick={handleStopBot}
                        className="flex-1 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        <Square className="w-4 h-4" /> Stop Bot
                      </button>
                    )}
                  </div>

                  {botFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-start gap-2 border animate-fade-in ${
                        botFeedback.type === 'error'
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          : botFeedback.type === 'success'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                      }`}
                    >
                      {botFeedback.type === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      ) : botFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Activity className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      )}
                      <span className="leading-snug">{botFeedback.message}</span>
                    </div>
                  )}
                </div>

                {/* Quick Architecture Spec */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="text-slate-400 font-medium mb-1">Native Audio Pipeline:</div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Voice Protocol</span>
                    <span className="font-mono text-indigo-400">@discordjs/voice (Opus)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Media Engine</span>
                    <span className="font-mono text-indigo-400">yt-dlp standalone</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>DSP Filter Processing</span>
                    <span className="font-mono text-indigo-400">FFmpeg 48kHz Stereo</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Lavalink Dependencies</span>
                    <span className="font-mono text-emerald-400 font-bold">0% (Completely Removed)</span>
                  </div>
                </div>
              </div>

              {/* Main Content Column: Config Configurations, Diagnostics, and Logs */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Bot & Guild Configuration Manager (Config Configurations) */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <Settings className="w-4 h-4 text-indigo-400" />
                      Bot & Guild Configuration Manager
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                        Config Configurations
                      </span>
                      {configSaveSuccess && (
                        <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-fade-in font-medium">
                          <Check className="w-3.5 h-3.5" /> Saved & Applied!
                        </span>
                      )}
                      {configSaveError && (
                        <span className="text-xs px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-fade-in font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> {configSaveError}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Config Sub-Tabs */}
                  <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 gap-1 text-xs">
                    <button
                      onClick={() => setConfigSection('audio')}
                      className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                        configSection === 'audio'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Audio Defaults
                    </button>
                    <button
                      onClick={() => setConfigSection('voice')}
                      className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                        configSection === 'voice'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Wifi className="w-3.5 h-3.5" /> Voice Behavior
                    </button>
                    <button
                      onClick={() => setConfigSection('rules')}
                      className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                        configSection === 'rules'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Queue & Governance
                    </button>
                  </div>

                  {/* Section 1: Audio Defaults */}
                  {configSection === 'audio' && (
                    <div className="space-y-4 pt-1 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-850">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-300">Default Server Volume</span>
                            <span className="font-mono text-indigo-400 font-bold">{botConfig.defaultVolume}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="200"
                            step="5"
                            value={botConfig.defaultVolume}
                            onChange={(e) => setBotConfig({ ...botConfig, defaultVolume: parseInt(e.target.value) })}
                            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                          />
                          <p className="text-[11px] text-slate-500">Initial stream loudness applied when a track begins playback.</p>
                        </div>

                        <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/60 border border-slate-850">
                          <label className="font-medium text-slate-300 block">Default Audio DSP Filter</label>
                          <select
                            value={botConfig.defaultFilter}
                            onChange={(e) => setBotConfig({ ...botConfig, defaultFilter: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="clear">✨ Normal / Clear (Studio Audio)</option>
                            <option value="bassboost">🔊 Bassboost (+12dB Low-end)</option>
                            <option value="bassboost_soft">🔉 Bassboost Soft</option>
                            <option value="bassboost_hard">📢 Bassboost Hard</option>
                            <option value="nightcore">⚡ Nightcore (1.25x Tempo + Pitch)</option>
                            <option value="vaporwave">🌊 Vaporwave (0.8x Slow + Reverb)</option>
                            <option value="8d">🎧 8D Surround Sound</option>
                            <option value="karaoke">🎤 Karaoke (Vocal Suppression)</option>
                            <option value="echo">🌌 Atmospheric Echo / Delay</option>
                          </select>
                          <p className="text-[11px] text-slate-500">Applied automatically to every track queued by members.</p>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-300">Default Playback Tempo Speed</span>
                          <span className="font-mono text-indigo-400 font-bold">{botConfig.defaultSpeed}x</span>
                        </div>
                        <div className="flex gap-2">
                          {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                            <button
                              key={s}
                              onClick={() => setBotConfig({ ...botConfig, defaultSpeed: s })}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                                botConfig.defaultSpeed === s
                                  ? 'bg-indigo-600 text-white shadow'
                                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 2: Voice Channel Behavior */}
                  {configSection === 'voice' && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-850">
                          <div>
                            <div className="font-medium text-slate-200">24/7 Channel Stay Mode</div>
                            <div className="text-[11px] text-slate-500">Keep bot in voice channel even when queue finishes.</div>
                          </div>
                          <button
                            onClick={() => setBotConfig({ ...botConfig, stay247: !botConfig.stay247 })}
                            className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                              botConfig.stay247 ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-850">
                          <div>
                            <div className="font-medium text-slate-200">yt-dlp Autoplay Recommendations</div>
                            <div className="text-[11px] text-slate-500">Automatically queue similar songs when the queue ends.</div>
                          </div>
                          <button
                            onClick={() => setBotConfig({ ...botConfig, autoplay: !botConfig.autoplay })}
                            className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                              botConfig.autoplay ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-850">
                          <div>
                            <div className="font-medium text-slate-200">Announce "Now Playing"</div>
                            <div className="text-[11px] text-slate-500">Send rich embed into text channel when a new song starts.</div>
                          </div>
                          <button
                            onClick={() => setBotConfig({ ...botConfig, announceNowPlaying: !botConfig.announceNowPlaying })}
                            className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                              botConfig.announceNowPlaying ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                          </button>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1.5">
                          <label className="font-medium text-slate-200 block">Empty Voice Channel Timeout</label>
                          <select
                            value={botConfig.emptyChannelTimeout}
                            onChange={(e) => setBotConfig({ ...botConfig, emptyChannelTimeout: parseInt(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value={1}>1 Minute</option>
                            <option value={3}>3 Minutes (Default)</option>
                            <option value={5}>5 Minutes</option>
                            <option value={10}>10 Minutes</option>
                            <option value={0}>Disabled (Never disconnect)</option>
                          </select>
                          <div className="text-[11px] text-slate-500">Auto-leaves when all members leave voice channel.</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 3: Queue & Governance */}
                  {configSection === 'rules' && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1.5">
                          <label className="font-medium text-slate-200 block">Maximum Queue Size Limit</label>
                          <select
                            value={botConfig.maxQueueSize}
                            onChange={(e) => setBotConfig({ ...botConfig, maxQueueSize: parseInt(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value={50}>50 Tracks</option>
                            <option value={100}>100 Tracks</option>
                            <option value={250}>250 Tracks (Default)</option>
                            <option value={500}>500 Tracks</option>
                            <option value={1000}>1,000 Tracks (Unlimited)</option>
                          </select>
                          <div className="text-[11px] text-slate-500">Prevents spam queue floods on busy servers.</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-200">Vote-Skip Threshold</span>
                            <span className="font-mono text-indigo-400 font-bold">{botConfig.voteSkipPercentage}%</span>
                          </div>
                          <select
                            value={botConfig.voteSkipPercentage}
                            onChange={(e) => setBotConfig({ ...botConfig, voteSkipPercentage: parseInt(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value={25}>25% of Voice Members</option>
                            <option value={33}>33% of Voice Members</option>
                            <option value={50}>50% of Voice Members (Default)</option>
                            <option value={66}>66% of Voice Members</option>
                            <option value={75}>75% of Voice Members</option>
                          </select>
                          <div className="text-[11px] text-slate-500">Percentage required to pass /skip command.</div>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-850">
                          <div>
                            <div className="font-medium text-slate-200">DJ-Only Restricted Mode</div>
                            <div className="text-[11px] text-slate-500">Only members with "DJ" role can stop, seek, or change filters.</div>
                          </div>
                          <button
                            onClick={() => setBotConfig({ ...botConfig, djOnlyMode: !botConfig.djOnlyMode })}
                            className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                              botConfig.djOnlyMode ? 'bg-indigo-600 justify-end' : 'bg-slate-800 justify-start'
                            }`}
                          >
                            <span className="w-5 h-5 rounded-full bg-white shadow-md" />
                          </button>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-200">Discord Embed Accent Color</span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-300">{botConfig.embedColor}</span>
                          </div>
                          <div className="flex gap-2">
                            {[
                              { label: 'Indigo', color: '#6366f1' },
                              { label: 'Emerald', color: '#10b981' },
                              { label: 'Violet', color: '#8b5cf6' },
                              { label: 'Rose', color: '#f43f5e' },
                              { label: 'Amber', color: '#f59e0b' },
                              { label: 'Cyan', color: '#06b6d4' }
                            ].map((c) => (
                              <button
                                key={c.color}
                                onClick={() => setBotConfig({ ...botConfig, embedColor: c.color })}
                                className={`w-7 h-7 rounded-lg transition-transform ${c.color === botConfig.embedColor ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                                style={{ backgroundColor: c.color }}
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2 md:col-span-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-200">Server Command Prefix</span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                              {botConfig.prefix || '/'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={botConfig.prefix}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBotConfig({ ...botConfig, prefix: val });
                                setBotPrefix(val);
                              }}
                              placeholder="/"
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setBotConfig({ ...botConfig, prefix: '/' });
                                setBotPrefix('/');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-mono transition-all"
                            >
                              Reset to /
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Configured default is <strong className="text-indigo-300">/</strong> for Discord Slash Commands and text chat commands.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Changes Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleSaveConfig()}
                      disabled={isSavingConfig}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSavingConfig ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save & Apply Configurations
                    </button>
                  </div>
                </div>

                {/* 2. Audio Engine Health & Diagnostics Benchmark */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <Gauge className="w-4 h-4 text-emerald-400" />
                      Audio Engine Health & Transcode Diagnostics
                    </div>
                    <button
                      onClick={handleRunBenchmark}
                      disabled={isRunningBenchmark}
                      className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-medium text-xs rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isRunningBenchmark ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      Run Diagnostics Benchmark
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1">
                      <div className="text-slate-400 font-medium flex items-center justify-between">
                        <span>yt-dlp Extractor</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                          {diagnostics?.ytdlp.status || 'Active'}
                        </span>
                      </div>
                      <div className="text-base font-bold text-white font-mono">
                        {diagnostics ? `${diagnostics.ytdlp.latencyMs} ms` : '< 120 ms'}
                      </div>
                      <div className="text-[11px] text-slate-500">Fast format lookup & direct stream pipe</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1">
                      <div className="text-slate-400 font-medium flex items-center justify-between">
                        <span>FFmpeg DSP Transcoder</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                          {diagnostics?.ffmpeg.status || 'Active'}
                        </span>
                      </div>
                      <div className="text-base font-bold text-white font-mono">
                        {diagnostics ? `${diagnostics.ffmpeg.latencyMs} ms` : '< 25 ms'}
                      </div>
                      <div className="text-[11px] text-slate-500">48kHz 16-bit Stereo PCM audio filter processing</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 space-y-1">
                      <div className="text-slate-400 font-medium flex items-center justify-between">
                        <span>Voice Transport</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-mono">Direct UDP</span>
                      </div>
                      <div className="text-base font-bold text-indigo-300 font-mono">
                        {status?.bot.ping ? `${status.bot.ping} ms` : '< 20 ms'}
                      </div>
                      <div className="text-[11px] text-slate-500">Direct @discordjs/voice Opus packets</div>
                    </div>
                  </div>

                  {diagnostics && (
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-300 flex items-center justify-between">
                      <span>✓ Benchmark Passed: Both yt-dlp and FFmpeg operating within nominal latency thresholds.</span>
                      <span className="text-slate-400 text-[11px] font-mono">Tested at {diagnostics.timestamp}</span>
                    </div>
                  )}
                </div>

                {/* 3. Connected Discord Voice Channel Sessions Monitor */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Radio className="w-4 h-4 text-indigo-400" />
                      Active Voice Sessions ({activeSessions.length})
                    </div>
                    <span className="text-[11px] text-slate-500">Auto-synced</span>
                  </div>

                  {activeSessions.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-dashed border-slate-800 text-center text-xs text-slate-400 space-y-1">
                      <div className="font-semibold text-slate-300">No active Discord voice connections</div>
                      <div className="text-slate-500 text-[11px]">
                        When your bot is online, join any Discord voice channel and type <code className="text-indigo-400 font-mono">/play &lt;song&gt;</code> or <code className="text-indigo-400 font-mono">/join</code> to stream audio!
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeSessions.map((session) => (
                        <div
                          key={session.guildId}
                          className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              <span>{session.guildName}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {session.isPlaying ? 'Playing' : 'Idle'}
                              </span>
                            </div>
                            <div className="text-slate-400 mt-0.5">
                              {session.currentTrack ? (
                                <span>Track: <strong className="text-slate-200">{session.currentTrack.title}</strong> ({session.currentTrack.durationFormatted})</span>
                              ) : (
                                <span>Queue empty</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                            <span>Vol: {session.volume}%</span>
                            <span>Filter: {session.filter.toUpperCase()}</span>
                            <span>Queue: {session.queueCount}</span>
                            {session.stay247 && <span className="text-indigo-400">24/7 ON</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interactive Console & "Install My Things" Package Manager */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  {/* Console Header & Sub-Tabs */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-white flex items-center gap-2">
                          Interactive Developer Console & Package Manager
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Execute shell and bot commands directly from the dashboard or install custom packages.
                        </div>
                      </div>
                    </div>

                    {/* Console Tab Selector */}
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        onClick={() => setDashboardConsoleTab('terminal')}
                        className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                          dashboardConsoleTab === 'terminal'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        Live Terminal
                      </button>
                      <button
                        onClick={() => setDashboardConsoleTab('packages')}
                        className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                          dashboardConsoleTab === 'packages'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Package className="w-3.5 h-3.5" />
                        Install My Things
                      </button>
                      <button
                        onClick={() => setDashboardConsoleTab('logs')}
                        className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                          dashboardConsoleTab === 'logs'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        Logs ({logs.length})
                      </button>
                    </div>
                  </div>

                  {/* SUB-TAB 1: LIVE INTERACTIVE TERMINAL */}
                  {dashboardConsoleTab === 'terminal' && (
                    <div className="space-y-3">
                      {/* Terminal Toolbar: Working Directory, Quick Run Shortcuts, Clear */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">Directory:</span>
                          <button
                            onClick={() => setConsoleCwd(consoleCwd === 'bot' ? 'root' : 'bot')}
                            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-[11px] hover:border-indigo-500 transition-all flex items-center gap-1.5"
                            title="Click to toggle working directory"
                          >
                            <Folder className="w-3 h-3 text-indigo-400" />
                            {consoleCwd === 'bot' ? 'bot/ (Bot Codebase)' : '/ (Dashboard Root)'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setTerminalEntries([])}
                            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800"
                          >
                            <Trash2 className="w-3 h-3" /> Clear Screen
                          </button>
                          <button
                            onClick={fetchLogs}
                            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800"
                          >
                            <RefreshCw className="w-3 h-3" /> Refresh
                          </button>
                        </div>
                      </div>

                      {/* Quick Command Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-slate-500 mr-1">Quick Run:</span>
                        {[
                          'help',
                          'bot status',
                          'npm list --depth=0',
                          'yt-dlp --version',
                          'ffmpeg -version',
                          'node -v',
                          'npm -v',
                          'uptime',
                          'ls -la'
                        ].map((qcmd) => (
                          <button
                            key={qcmd}
                            onClick={() => handleExecuteConsole(qcmd)}
                            disabled={isExecutingCmd}
                            className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono transition-all hover:border-slate-700 disabled:opacity-50"
                          >
                            {qcmd}
                          </button>
                        ))}
                      </div>

                      {/* Terminal Output Window */}
                      <div className="bg-slate-950 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs space-y-2 border border-slate-850 shadow-inner">
                        {terminalEntries.map((entry) => (
                          <div key={entry.id} className="space-y-0.5">
                            {entry.type === 'cmd' ? (
                              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                                <span className="text-emerald-400 select-none">groove-bot@studio:{consoleCwd === 'bot' ? '~/bot' : '~'}$</span>
                                <span className="text-slate-100">{entry.text}</span>
                                <span className="text-[10px] text-slate-600 select-none ml-auto font-normal">[{entry.timestamp}]</span>
                              </div>
                            ) : entry.type === 'error' ? (
                              <div className="text-red-400 whitespace-pre-wrap pl-4 border-l border-red-500/30">
                                {entry.text}
                              </div>
                            ) : entry.type === 'info' ? (
                              <div className="text-emerald-400/90 whitespace-pre-wrap pl-4 border-l border-emerald-500/30">
                                {entry.text}
                              </div>
                            ) : (
                              <div className="text-slate-300 whitespace-pre-wrap pl-4 border-l border-slate-800 leading-relaxed">
                                {entry.text}
                              </div>
                            )}
                          </div>
                        ))}
                        {isExecutingCmd && (
                          <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-4">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                            <span>Executing command...</span>
                          </div>
                        )}
                        <div ref={terminalEndRef} />
                      </div>

                      {/* Terminal Command Input Prompt */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleExecuteConsole();
                        }}
                        className="flex gap-2"
                      >
                        <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                          <span className="text-emerald-400 font-mono text-xs select-none">groove-bot:~$</span>
                          <input
                            type="text"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                if (cmdHistory.length > 0) {
                                  const nextIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
                                  setHistoryIdx(nextIdx);
                                  setTerminalInput(cmdHistory[nextIdx]);
                                }
                              } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                if (historyIdx > 0) {
                                  const prevIdx = historyIdx - 1;
                                  setHistoryIdx(prevIdx);
                                  setTerminalInput(cmdHistory[prevIdx]);
                                } else if (historyIdx === 0) {
                                  setHistoryIdx(-1);
                                  setTerminalInput('');
                                }
                              }
                            }}
                            placeholder="Type any command (e.g. npm install axios, bot status, yt-dlp -U, node -v, help)..."
                            className="flex-1 bg-transparent text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none"
                            disabled={isExecutingCmd}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isExecutingCmd || !terminalInput.trim()}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          {isExecutingCmd ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          Run Command
                        </button>
                      </form>
                    </div>
                  )}

                  {/* SUB-TAB 2: "INSTALL MY THINGS" PACKAGE CENTER */}
                  {dashboardConsoleTab === 'packages' && (
                    <div className="space-y-4">
                      {/* Package Install Input & Target */}
                      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-850 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-indigo-400" />
                            Install Any NPM Package
                          </label>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-500 text-[11px]">Install to:</span>
                            <button
                              onClick={() => setPkgTarget('bot')}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                                pkgTarget === 'bot'
                                  ? 'bg-indigo-600 text-white font-medium'
                                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              bot/ (Recommended)
                            </button>
                            <button
                              onClick={() => setPkgTarget('root')}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                                pkgTarget === 'root'
                                  ? 'bg-indigo-600 text-white font-medium'
                                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              root (/)
                            </button>
                          </div>
                        </div>

                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleInstallPackage();
                          }}
                          className="flex gap-2"
                        >
                          <div className="relative flex-1">
                            <Package className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                              type="text"
                              value={customPkgName}
                              onChange={(e) => setCustomPkgName(e.target.value)}
                              placeholder="e.g. lyrics-finder, @discordjs/opus, axios, soundcloud-downloader, chalk..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isInstallingPkg || !customPkgName.trim()}
                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            {isInstallingPkg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Install Package
                          </button>
                        </form>

                        {pkgActionFeedback && (
                          <div
                            className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                              pkgActionFeedback.type === 'success'
                                ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                                : 'bg-red-950/40 border border-red-800 text-red-300'
                            }`}
                          >
                            {pkgActionFeedback.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            )}
                            <span>{pkgActionFeedback.message}</span>
                          </div>
                        )}
                      </div>

                      {/* 1-Click Popular Bot Audio & Utilities Packages */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          Popular Music Bot Packages (1-Click Install)
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {[
                            { name: '@discordjs/opus', desc: 'Fast native Opus audio encoder', category: 'Audio' },
                            { name: 'sodium-native', desc: 'Hardware-accelerated crypto encryption', category: 'Voice' },
                            { name: 'lyrics-finder', desc: 'Secondary track lyrics searcher', category: 'Lyrics' },
                            { name: 'axios', desc: 'Promise-based HTTP request client', category: 'Utility' },
                            { name: 'spotify-url-info', desc: 'Spotify track metadata resolver', category: 'Music' },
                            { name: 'soundcloud-downloader', desc: 'SoundCloud direct stream audio parser', category: 'Audio' },
                            { name: 'dotenv', desc: 'Zero-dependency env configuration', category: 'Config' },
                            { name: 'chalk', desc: 'Terminal string color styling', category: 'Console' }
                          ].map((pkg) => {
                            const isInstalled = Boolean(
                              packagesData?.botDependencies && packagesData.botDependencies[pkg.name]
                            );
                            return (
                              <div
                                key={pkg.name}
                                className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono text-xs font-semibold text-slate-200 truncate">{pkg.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{pkg.category}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{pkg.desc}</p>
                                </div>
                                <button
                                  onClick={() => handleInstallPackage(pkg.name)}
                                  disabled={isInstallingPkg}
                                  className={`w-full py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${
                                    isInstalled
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                  }`}
                                >
                                  {isInstalled ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                  {isInstalled ? 'Installed' : 'Install'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Currently Installed Packages List in Bot */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5 text-indigo-400" />
                            Installed in /bot (bot/package.json)
                          </span>
                          <button
                            onClick={fetchPackagesList}
                            disabled={isLoadingPackages}
                            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${isLoadingPackages ? 'animate-spin' : ''}`} /> Refresh
                          </button>
                        </div>

                        {packagesData?.botDependencies && Object.keys(packagesData.botDependencies).length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {Object.entries(packagesData.botDependencies).map(([name, version]) => (
                              <div
                                key={name}
                                className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between text-xs"
                              >
                                <div className="truncate mr-2">
                                  <div className="font-mono text-slate-200 truncate font-medium">{name}</div>
                                  <div className="font-mono text-[10px] text-slate-500">{version}</div>
                                </div>
                                <button
                                  onClick={() => handleUninstallPackage(name)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-all flex-shrink-0"
                                  title={`Uninstall ${name}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                            Loading package dependencies...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: ACTIVITY LOG STREAM */}
                  {dashboardConsoleTab === 'logs' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Real-time bot runtime and audio pipeline log events</span>
                        <button
                          onClick={fetchLogs}
                          className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Refresh
                        </button>
                      </div>

                      <div className="bg-slate-950 rounded-xl p-3 h-64 overflow-y-auto font-mono text-[11px] space-y-1 border border-slate-850">
                        {logs.length === 0 ? (
                          <div className="text-slate-600 italic">No logs recorded yet.</div>
                        ) : (
                          logs.map((log, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="text-slate-600 select-none">[{log.timestamp}]</span>
                              <span
                                className={
                                  log.level === 'error'
                                    ? 'text-red-400 font-semibold'
                                    : log.level === 'warn'
                                    ? 'text-amber-400'
                                    : 'text-slate-300'
                                }
                              >
                                {log.message}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIO STUDIO & INTERACTIVE PLAYER */}
        {activeTab === 'studio' && (
          <div className="space-y-3.5">
            {/* Mobile Studio Segmented Sub-Navigation */}
            <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-semibold gap-1">
              <button
                onClick={() => setStudioSubTab('player')}
                className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  studioSubTab === 'player'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Disc className={`w-3.5 h-3.5 ${isPlaying && studioSubTab === 'player' ? 'animate-spin-slow' : ''}`} />
                Player
              </button>
              <button
                onClick={() => setStudioSubTab('queue')}
                className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  studioSubTab === 'queue'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                Queue ({queue.length})
              </button>
              <button
                onClick={() => setStudioSubTab('dsp')}
                className={`flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  studioSubTab === 'dsp'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                DSP FX
              </button>
            </div>

            {/* Fast Search Input Bar (Visible in Player & Queue) */}
            {(studioSubTab === 'queue' || !currentTrack) && (
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search song, artist, YouTube URL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Search
                </button>
              </form>
            )}

            {/* Active Track Player & Filter Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Now Playing Card & Controls */}
              <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
                  <span>NOW PLAYING PREVIEW</span>
                  {isPlaying && (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Streaming
                    </span>
                  )}
                </div>

                {currentTrack ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
                      {currentTrack.thumbnail ? (
                        <img
                          src={currentTrack.thumbnail}
                          alt={currentTrack.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Disc className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex items-end p-3">
                        <div>
                          <div className="font-bold text-sm text-white line-clamp-1">{currentTrack.title}</div>
                          <div className="text-xs text-slate-400">{currentTrack.author} • {currentTrack.durationFormatted}</div>
                        </div>
                      </div>
                    </div>

                    {/* Audio Player Buttons */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          if (audioRef.current) {
                            if (isPlaying) {
                              audioRef.current.pause();
                              setIsPlaying(false);
                            } else {
                              audioRef.current.play();
                              setIsPlaying(true);
                            }
                          }
                        }}
                        className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>

                      <button
                        onClick={() => {
                          if (queue.length > 0) {
                            const next = queue[0];
                            setQueue(q => q.slice(1));
                            playTrackInStudio(next);
                          }
                        }}
                        disabled={queue.length === 0}
                        className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center disabled:opacity-40 transition-all"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                            setIsPlaying(false);
                          }
                        }}
                        className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-all"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Volume Slider */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => {
                          const nextMute = !isMuted;
                          setIsMuted(nextMute);
                          if (audioRef.current) audioRef.current.volume = nextMute ? 0 : volume / 100;
                        }}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          setVolume(v);
                          setIsMuted(false);
                          if (audioRef.current) audioRef.current.volume = v / 100;
                        }}
                        className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <span className="text-xs font-mono text-slate-400 w-8 text-right">{volume}%</span>
                    </div>

                    {/* View Lyrics Button */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          const nextState = !showLyricsPanel;
                          setShowLyricsPanel(nextState);
                          if (nextState && !lyricsData && currentTrack) {
                            fetchLyricsForTrack(currentTrack.title, currentTrack.author, currentTrack.url);
                          }
                        }}
                        className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                          showLyricsPanel
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {showLyricsPanel ? 'Hide Lyrics Panel' : 'View Lyrics & Synced Text'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 text-xs p-4 text-center">
                    <Music className="w-8 h-8 mb-2 opacity-50" />
                    Search or pick a track from below to start listening!
                  </div>
                )}
              </div>

              {/* FFmpeg Filter Studio Selector */}
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    FFmpeg DSP Filters (Direct Audio Effects)
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono">
                    Active: {selectedFilter.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'clear', name: 'Normal / Clear', desc: 'Default studio audio', emoji: '✨' },
                    { id: 'bassboost', name: 'Bassboost', desc: '+12dB low-end boost', emoji: '🔊' },
                    { id: 'nightcore', name: 'Nightcore', desc: '1.25x tempo + higher pitch', emoji: '⚡' },
                    { id: 'vaporwave', name: 'Vaporwave', desc: '0.8x slow + relaxed mood', emoji: '🌊' },
                    { id: '8d', name: '8D Surround', desc: 'Spatial pulsator rotation', emoji: '🎧' },
                    { id: 'karaoke', name: 'Karaoke', desc: 'Center-channel vocal drop', emoji: '🎤' },
                    { id: 'tremolo', name: 'Tremolo', desc: 'Dynamic volume oscillation', emoji: '〰️' },
                    { id: 'echo', name: 'Echo / Delay', desc: 'Atmospheric reverberation', emoji: '🌌' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => handleFilterChange(filter.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedFilter === filter.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-lg mb-1">{filter.emoji}</div>
                      <div className="font-semibold text-xs">{filter.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{filter.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Speed Multiplier (FFmpeg atempo) */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-slate-300">FFmpeg atempo Speed Multiplier:</span>
                    <span className="font-mono text-indigo-400 font-bold">{playbackSpeed}x</span>
                  </div>
                  <div className="flex gap-2">
                    {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSpeedChange(s)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                          playbackSpeed === s
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Search Results & Queue Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Search Results */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center justify-between">
                  <span>Search Results ({searchResults.length})</span>
                  <span className="text-xs font-normal text-slate-500">Extracted with yt-dlp</span>
                </h3>

                {searchResults.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    Search for a song title above to view yt-dlp extracted tracks.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {searchResults.map((track) => (
                      <div
                        key={track.id || track.url}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={track.thumbnail}
                            alt={track.title}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-900 flex-shrink-0"
                          />
                          <div className="overflow-hidden">
                            <div className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-400 transition-colors">
                              {track.title}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {track.author} • {track.durationFormatted}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => playTrackInStudio(track)}
                            className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all text-xs flex items-center gap-1"
                            title="Play Now"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setQueue((q) => [...q, track])}
                            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all text-xs"
                            title="Add to Queue"
                          >
                            + Queue
                          </button>
                          <button
                            onClick={() => fetchLyricsForTrack(track.title, track.author, track.url)}
                            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all text-xs"
                            title="View Lyrics"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Up Next Queue & Saved Playlists Hub */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
                {/* Header & Mode Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                    <button
                      onClick={() => setPlaylistTabMode('queue')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        playlistTabMode === 'queue'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Disc className="w-3.5 h-3.5" />
                      Queue ({queue.length})
                    </button>
                    <button
                      onClick={() => setPlaylistTabMode('saved')}
                      className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                        playlistTabMode === 'saved'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ListMusic className="w-3.5 h-3.5" />
                      Saved Playlists ({savedPlaylists.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsSavingPlaylist(!isSavingPlaylist)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1 ${
                        isSavingPlaylist
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                      title="Save current queue as a named playlist in localStorage"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                      Save Queue
                    </button>

                    {playlistTabMode === 'queue' && queue.length > 0 && (
                      <button
                        onClick={() => setQueue([])}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-950/20 flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Playlist Action Feedback Toast */}
                {playlistFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
                      playlistFeedback.type === 'success'
                        ? 'bg-emerald-950/40 border border-emerald-800/80 text-emerald-300'
                        : 'bg-red-950/40 border border-red-800/80 text-red-300'
                    }`}
                  >
                    {playlistFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )}
                    <span>{playlistFeedback.message}</span>
                  </div>
                )}

                {/* Inline Save Queue as Playlist Drawer */}
                {isSavingPlaylist && (
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5 text-indigo-400" />
                        Save Current Queue to LocalStorage
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {queue.length > 0 ? `${queue.length} track(s) in queue` : (currentTrack ? '1 active track' : 'Empty')}
                      </span>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveCurrentQueue();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={playlistNameInput}
                        onChange={(e) => setPlaylistNameInput(e.target.value)}
                        placeholder="e.g. Chill Synthwave, Gym Hype, Coding Session..."
                        autoFocus
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSavingPlaylist(false)}
                        className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs"
                      >
                        Cancel
                      </button>
                    </form>
                    <p className="text-[11px] text-slate-500">
                      Playlists are saved locally in your browser and will persist across reloads and sessions.
                    </p>
                  </div>
                )}

                {/* VIEW 1: ACTIVE QUEUE */}
                {playlistTabMode === 'queue' && (
                  <div>
                    {queue.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
                        <div>Queue is currently empty.</div>
                        <div className="text-[11px] text-slate-600">
                          Click "+ Queue" on search results or load one of your saved playlists below!
                        </div>
                        {savedPlaylists.length > 0 && (
                          <button
                            onClick={() => setPlaylistTabMode('saved')}
                            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-1"
                          >
                            <ListMusic className="w-3.5 h-3.5" /> View {savedPlaylists.length} Saved Playlists
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {queue.map((track, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all group"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <span className="text-xs font-mono text-slate-500 w-4">{idx + 1}.</span>
                              <div className="truncate">
                                <div className="text-xs font-medium text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                                  {track.title}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {track.author} • {track.durationFormatted}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  playTrackInStudio(track);
                                  setQueue((q) => q.filter((_, i) => i !== idx));
                                }}
                                className="text-slate-400 hover:text-indigo-400 p-1 rounded hover:bg-slate-800"
                                title="Play this now"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setQueue((q) => q.filter((_, i) => i !== idx))}
                                className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800"
                                title="Remove from queue"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW 2: SAVED PLAYLISTS (LOCALSTORAGE) */}
                {playlistTabMode === 'saved' && (
                  <div className="space-y-3">
                    {savedPlaylists.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
                        <div>No saved playlists in localStorage yet.</div>
                        <div className="text-[11px] text-slate-600">
                          Search for tracks, queue them up, and click "Save Queue" to create your first playlist!
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {savedPlaylists.map((pl) => {
                          const isPreviewOpen = previewPlaylistId === pl.id;
                          return (
                            <div
                              key={pl.id}
                              className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 space-y-2.5 transition-all"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="overflow-hidden">
                                  <div className="font-semibold text-xs text-white flex items-center gap-1.5 truncate">
                                    <ListMusic className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                    <span className="truncate">{pl.name}</span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                                    {pl.tracks.length} track{pl.tracks.length !== 1 ? 's' : ''} • Created {new Date(pl.createdAt).toLocaleDateString()}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <button
                                    onClick={() => handlePlayPlaylistNow(pl)}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm transition-all"
                                    title="Play playlist immediately"
                                  >
                                    <Play className="w-3 h-3" /> Play
                                  </button>
                                  <button
                                    onClick={() => handleLoadPlaylist(pl, 'replace')}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                                    title="Replace active queue with this playlist"
                                  >
                                    Load Queue
                                  </button>
                                  <button
                                    onClick={() => handleLoadPlaylist(pl, 'append')}
                                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-[11px] transition-all"
                                    title="Append tracks to existing queue"
                                  >
                                    + Append
                                  </button>
                                  <button
                                    onClick={() => setPreviewPlaylistId(isPreviewOpen ? null : pl.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                                    title="Toggle track list preview"
                                  >
                                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isPreviewOpen ? 'rotate-90 text-indigo-400' : ''}`} />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePlaylist(pl.id, pl.name)}
                                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-all"
                                    title="Delete playlist"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Expandable Track List Preview */}
                              {isPreviewOpen && (
                                <div className="pt-2 border-t border-slate-850 space-y-1.5">
                                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                                    Tracks in {pl.name}:
                                  </div>
                                  <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {pl.tracks.map((t, tIdx) => (
                                      <div
                                        key={tIdx}
                                        className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-900/60"
                                      >
                                        <div className="truncate mr-2">
                                          <span className="text-slate-500 mr-1.5 font-mono">{tIdx + 1}.</span>
                                          <span className="text-slate-300 font-medium">{t.title}</span>
                                          <span className="text-slate-500 ml-1.5 text-[10px]">({t.author})</span>
                                        </div>
                                        <span className="text-slate-500 font-mono text-[10px] flex-shrink-0">
                                          {t.durationFormatted}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lyrics Display Card */}
            {(showLyricsPanel || lyricsData) && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white flex items-center gap-2">
                        <span>{lyricsData ? lyricsData.title : 'Lyrics Viewer'}</span>
                        {lyricsData?.artist && (
                          <span className="text-xs text-slate-400 font-normal">by {lyricsData.artist}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {lyricsData?.source && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                            {lyricsData.source}
                          </span>
                        )}
                        {lyricsData?.album && (
                          <span className="text-[10px] text-slate-400">
                            Album: {lyricsData.album}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {lyricsData?.syncedLyrics && (
                      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                        <button
                          onClick={() => setLyricsViewType('plain')}
                          className={`px-2.5 py-1 rounded text-xs transition-all ${
                            lyricsViewType === 'plain'
                              ? 'bg-indigo-600 text-white font-medium'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Plain Text
                        </button>
                        <button
                          onClick={() => setLyricsViewType('synced')}
                          className={`px-2.5 py-1 rounded text-xs transition-all ${
                            lyricsViewType === 'synced'
                              ? 'bg-indigo-600 text-white font-medium'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Synced LRC
                        </button>
                      </div>
                    )}

                    {lyricsData?.lyrics && (
                      <button
                        onClick={() => {
                          const text = lyricsViewType === 'synced' && lyricsData.syncedLyrics ? lyricsData.syncedLyrics : lyricsData.lyrics;
                          navigator.clipboard.writeText(text);
                          setCopiedLyrics(true);
                          setTimeout(() => setCopiedLyrics(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-all"
                      >
                        {copiedLyrics ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLyrics ? 'Copied' : 'Copy'}
                      </button>
                    )}

                    <button
                      onClick={() => setShowLyricsPanel(false)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {isLoadingLyrics ? (
                  <div className="py-12 flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                    <span>Searching LRCLIB & yt-dlp video metadata for lyrics...</span>
                  </div>
                ) : lyricsData ? (
                  <div className="bg-slate-950 rounded-xl p-5 max-h-96 overflow-y-auto border border-slate-850">
                    {lyricsViewType === 'synced' && lyricsData.syncedLyrics ? (
                      <div className="space-y-1.5 font-mono text-xs">
                        {lyricsData.syncedLyrics.split('\n').map((line, idx) => {
                          const match = line.match(/^(\[\d+:\d+\.\d+\])(.*)/);
                          if (match) {
                            return (
                              <div key={idx} className="flex items-start gap-3 hover:bg-slate-900/60 p-1 rounded">
                                <span className="text-indigo-400 select-none text-[11px] font-semibold">{match[1]}</span>
                                <span className="text-slate-200">{match[2] || '♪'}</span>
                              </div>
                            );
                          }
                          return <div key={idx} className="text-slate-400">{line}</div>;
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                        {lyricsData.lyrics}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No lyrics loaded. Play a track or click "View Lyrics" on any search result to view lyrics.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CONSOLE, TERMINAL & COMMANDS */}
        {activeTab === 'commands' && (
          <div className="space-y-6">
            {/* Top Mode Selector */}
            <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 gap-1.5">
              <button
                onClick={() => setCommandsTabMode('terminal')}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  commandsTabMode === 'terminal'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Terminal className="w-4 h-4" />
                Live Shell & Bot Console
              </button>
              <button
                onClick={() => setCommandsTabMode('packages')}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  commandsTabMode === 'packages'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Package className="w-4 h-4" />
                Install My Things (Package Center)
              </button>
              <button
                onClick={() => setCommandsTabMode('simulator')}
                className={`flex-1 py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  commandsTabMode === 'simulator'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Zap className="w-4 h-4" />
                Discord Command Embed Simulator
              </button>
            </div>

            {/* MODE 1: LIVE SHELL & BOT CONSOLE */}
            {commandsTabMode === 'terminal' && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-200">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    Interactive Full-Screen Developer Terminal
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Target Dir:</span>
                    <button
                      onClick={() => setConsoleCwd(consoleCwd === 'bot' ? 'root' : 'bot')}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300 font-mono text-[11px] hover:border-indigo-500 transition-all flex items-center gap-1.5"
                    >
                      <Folder className="w-3 h-3 text-indigo-400" />
                      {consoleCwd === 'bot' ? 'bot/ (Bot Codebase)' : '/ (Dashboard Root)'}
                    </button>
                    <button
                      onClick={() => setTerminalEntries([])}
                      className="text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-950 border border-slate-800"
                    >
                      Clear Screen
                    </button>
                  </div>
                </div>

                {/* Quick Command Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-500 mr-1 text-[11px]">Quick Run:</span>
                  {[
                    'help',
                    'bot status',
                    'npm list --depth=0',
                    'yt-dlp --version',
                    'ffmpeg -version',
                    'node -v',
                    'uptime',
                    'ls -la'
                  ].map((qcmd) => (
                    <button
                      key={qcmd}
                      onClick={() => handleExecuteConsole(qcmd)}
                      disabled={isExecutingCmd}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-xs transition-all hover:border-slate-700 disabled:opacity-50"
                    >
                      {qcmd}
                    </button>
                  ))}
                </div>

                {/* Terminal Output */}
                <div className="bg-slate-950 rounded-xl p-5 h-96 overflow-y-auto font-mono text-xs space-y-2 border border-slate-850 shadow-inner">
                  {terminalEntries.map((entry) => (
                    <div key={entry.id} className="space-y-0.5">
                      {entry.type === 'cmd' ? (
                        <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                          <span className="text-emerald-400 select-none">groove-bot@studio:{consoleCwd === 'bot' ? '~/bot' : '~'}$</span>
                          <span className="text-slate-100">{entry.text}</span>
                          <span className="text-[10px] text-slate-600 select-none ml-auto font-normal">[{entry.timestamp}]</span>
                        </div>
                      ) : entry.type === 'error' ? (
                        <div className="text-red-400 whitespace-pre-wrap pl-4 border-l border-red-500/30">
                          {entry.text}
                        </div>
                      ) : entry.type === 'info' ? (
                        <div className="text-emerald-400/90 whitespace-pre-wrap pl-4 border-l border-emerald-500/30">
                          {entry.text}
                        </div>
                      ) : (
                        <div className="text-slate-300 whitespace-pre-wrap pl-4 border-l border-slate-800 leading-relaxed">
                          {entry.text}
                        </div>
                      )}
                    </div>
                  ))}
                  {isExecutingCmd && (
                    <div className="flex items-center gap-2 text-slate-400 text-xs italic pl-4">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      <span>Executing command...</span>
                    </div>
                  )}
                  <div ref={terminalEndRef} />
                </div>

                {/* Command Input Prompt */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleExecuteConsole();
                  }}
                  className="flex gap-2"
                >
                  <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                    <span className="text-emerald-400 font-mono text-xs select-none">groove-bot:~$</span>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          if (cmdHistory.length > 0) {
                            const nextIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
                            setHistoryIdx(nextIdx);
                            setTerminalInput(cmdHistory[nextIdx]);
                          }
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          if (historyIdx > 0) {
                            const prevIdx = historyIdx - 1;
                            setHistoryIdx(prevIdx);
                            setTerminalInput(cmdHistory[prevIdx]);
                          } else if (historyIdx === 0) {
                            setHistoryIdx(-1);
                            setTerminalInput('');
                          }
                        }
                      }}
                      placeholder="Type command (e.g. npm install axios, bot status, yt-dlp -U, node -v, help)..."
                      className="flex-1 bg-transparent text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none"
                      disabled={isExecutingCmd}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isExecutingCmd || !terminalInput.trim()}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isExecutingCmd ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Run Command
                  </button>
                </form>
              </div>
            )}

            {/* MODE 2: INSTALL MY THINGS PACKAGE CENTER */}
            {commandsTabMode === 'packages' && (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-400" />
                    Package & Tool Management Center ("Install My Things")
                  </h3>
                  <p className="text-xs text-slate-400">
                    Easily install additional npm packages, audio utilities, lyrics libraries, and crypto encoders directly into your bot.
                  </p>
                </div>

                {/* Custom Package Form */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-850 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      Install NPM Package By Name
                    </label>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 text-[11px]">Install to:</span>
                      <button
                        onClick={() => setPkgTarget('bot')}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                          pkgTarget === 'bot'
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        bot/ (Recommended)
                      </button>
                      <button
                        onClick={() => setPkgTarget('root')}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                          pkgTarget === 'root'
                            ? 'bg-indigo-600 text-white font-medium'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        root (/)
                      </button>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleInstallPackage();
                    }}
                    className="flex gap-2"
                  >
                    <div className="relative flex-1">
                      <Package className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={customPkgName}
                        onChange={(e) => setCustomPkgName(e.target.value)}
                        placeholder="e.g. lyrics-finder, @discordjs/opus, axios, soundcloud-downloader, chalk..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isInstallingPkg || !customPkgName.trim()}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isInstallingPkg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Install Package
                    </button>
                  </form>

                  {pkgActionFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        pkgActionFeedback.type === 'success'
                          ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                          : 'bg-red-950/40 border border-red-800 text-red-300'
                      }`}
                    >
                      {pkgActionFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                      <span>{pkgActionFeedback.message}</span>
                    </div>
                  )}
                </div>

                {/* Popular Packages Grid */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Essential Music Bot Packages (1-Click Install)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { name: '@discordjs/opus', desc: 'Fast native Opus audio encoder', category: 'Audio' },
                      { name: 'sodium-native', desc: 'Hardware crypto voice encryption', category: 'Voice' },
                      { name: 'lyrics-finder', desc: 'Secondary track lyrics searcher', category: 'Lyrics' },
                      { name: 'axios', desc: 'Promise-based HTTP request client', category: 'Utility' },
                      { name: 'spotify-url-info', desc: 'Spotify track metadata resolver', category: 'Music' },
                      { name: 'soundcloud-downloader', desc: 'SoundCloud direct stream audio parser', category: 'Audio' },
                      { name: 'dotenv', desc: 'Zero-dependency env configuration', category: 'Config' },
                      { name: 'chalk', desc: 'Terminal string color styling', category: 'Console' }
                    ].map((pkg) => {
                      const isInstalled = Boolean(
                        packagesData?.botDependencies && packagesData.botDependencies[pkg.name]
                      );
                      return (
                        <div
                          key={pkg.name}
                          className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-xs font-semibold text-slate-200 truncate">{pkg.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{pkg.category}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{pkg.desc}</p>
                          </div>
                          <button
                            onClick={() => handleInstallPackage(pkg.name)}
                            disabled={isInstallingPkg}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                              isInstalled
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                          >
                            {isInstalled ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            {isInstalled ? 'Installed' : 'Install'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Installed Packages List in Bot */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-indigo-400" />
                      Currently Installed Packages in Bot (bot/package.json)
                    </span>
                    <button
                      onClick={fetchPackagesList}
                      disabled={isLoadingPackages}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingPackages ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                  </div>

                  {packagesData?.botDependencies && Object.keys(packagesData.botDependencies).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {Object.entries(packagesData.botDependencies).map(([name, version]) => (
                        <div
                          key={name}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between text-xs"
                        >
                          <div className="truncate mr-2">
                            <div className="font-mono text-slate-200 truncate font-semibold">{name}</div>
                            <div className="font-mono text-[10px] text-slate-500">{version}</div>
                          </div>
                          <button
                            onClick={() => handleUninstallPackage(name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-all flex-shrink-0"
                            title={`Uninstall ${name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      Loading package dependencies...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* MODE 3: DISCORD MUSIC COMMAND SIMULATOR */}
            {commandsTabMode === 'simulator' && (
              <div className="space-y-6">
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        Discord Command Embed Simulator
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Test any Groove Music command and preview the bot's generated rich embeds in real time.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={simCommand}
                      onChange={(e) => setSimCommand(e.target.value)}
                      placeholder="e.g. /play blinding lights or /filter nightcore or /queue"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={handleSimulate}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" /> Execute
                    </button>
                  </div>

                  {/* Quick Command Buttons */}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="text-slate-500 self-center mr-1">Quick Run:</span>
                    {[
                      '/play starboy',
                      '/lyrics',
                      '/lyrics bohemian rhapsody',
                      '/filter nightcore',
                      '/filter bassboost',
                      '/queue',
                      '/nowplaying',
                      '/speed 1.5',
                      '/volume 100',
                      '/system',
                      '/help'
                    ].map((cmd) => (
                      <button
                        key={cmd}
                        onClick={() => {
                          setSimCommand(cmd);
                          setTimeout(handleSimulate, 50);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-indigo-500 font-mono text-[11px] transition-all"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Simulated Discord Embed Window */}
                {simOutput && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 max-w-xl mx-auto shadow-2xl">
                    <div className="text-[11px] text-slate-500 mb-2 font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" /> Groove Music (Bot Response)
                    </div>
                    <div
                      className="border-l-4 rounded-r-xl bg-slate-950 p-4 space-y-3"
                      style={{ borderLeftColor: simOutput.color || '#6366f1' }}
                    >
                      {simOutput.title && (
                        <div className="font-bold text-sm text-white">{simOutput.title}</div>
                      )}
                      {simOutput.description && (
                        <div className="text-xs text-slate-300 whitespace-pre-line">{simOutput.description}</div>
                      )}
                      {simOutput.fields && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850">
                          {simOutput.fields.map((f: any, idx: number) => (
                            <div key={idx} className="text-xs">
                              <div className="text-slate-500 text-[11px]">{f.name}</div>
                              <div className="text-slate-200 font-medium">{f.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Complete Converted Commands List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Music Category */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Music className="w-4 h-4" /> Music Commands (30)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-indigo-300 font-semibold">/play &lt;query&gt;</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Stream track or playlist using yt-dlp & FFmpeg</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-indigo-300 font-semibold">/pause / /resume</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Toggle playback state with 0 frame drops</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-indigo-300 font-semibold">/skip / /skipto &lt;#&gt;</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Skip to next song or jump in queue</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-indigo-300 font-semibold">/seek &lt;mm:ss&gt;</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Accurate timestamp seeking via FFmpeg -ss</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-indigo-300 font-semibold">/speed &lt;0.5-2.0&gt;</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Dynamic tempo adjustment via FFmpeg atempo</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-indigo-300 font-semibold">/autoplay</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Endless similar songs recommendation algorithm</p>
                  </div>
                </div>
              </div>

              {/* Filters Category */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" /> FFmpeg Filter Commands (9)
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-violet-300 font-semibold">/filter bassboost</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Heavy low-frequency gain enhancement</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-violet-300 font-semibold">/filter nightcore</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">High tempo + pitch shift aesthetic</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-violet-300 font-semibold">/filter vaporwave</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Slowed + reverb retro aesthetic</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-violet-300 font-semibold">/filter 8d</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Spatial binaural rotating surround audio</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-violet-300 font-semibold">/filter clear</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Resets all FFmpeg filters back to standard</p>
                  </div>
                </div>
              </div>

              {/* Config & Engine Commands */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-4 h-4" /> Config & Engine Commands
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-emerald-300 font-semibold">/247</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Keep bot in voice channel 24/7 without leaving</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-emerald-300 font-semibold">/system (or /node)</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Host CPU, RAM, yt-dlp version, and FFmpeg stats</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-emerald-300 font-semibold">/setprefix &lt;prefix&gt;</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Change bot prefix for your server (default: /)</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                    <span className="font-mono text-emerald-300 font-semibold">/source</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Displays yt-dlp & FFmpeg audio engine information</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CODEBASE BROWSER */}
        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-400" />
                  Bot Codebase Explorer (Zero Lavalink)
                </h3>
                <p className="text-xs text-slate-400">
                  Inspect the converted project structure. Notice that all Lavalink classes and node events were removed and replaced with <code className="text-indigo-300">YtdlpFFmpegEngine.js</code> and <code className="text-indigo-300">PlayerManager.js</code>.
                </p>
              </div>

              <a
                href="/api/download-bot"
                download="Groove-Music-Ytdlp-FFmpeg.zip"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Download className="w-3.5 h-3.5" /> Download Full Codebase (.ZIP)
              </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* File Tree */}
              <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 h-[600px] overflow-y-auto">
                <div className="text-xs font-semibold text-slate-400 mb-2 px-2 uppercase tracking-wider">
                  Files ({fileList.filter(f => !f.isDir).length})
                </div>
                <div className="space-y-0.5">
                  {fileList.map((file) => {
                    if (file.isDir) {
                      return (
                        <div key={file.path} className="px-2 py-1 text-[11px] font-semibold text-slate-400 flex items-center gap-1.5 mt-2">
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span>{file.name}</span>
                        </div>
                      );
                    }

                    const isSelected = selectedFile === file.path;
                    const isCore = file.name.includes('Ytdlp') || file.name.includes('Player') || file.name.includes('play.js') || file.name.includes('filter.js');

                    return (
                      <button
                        key={file.path}
                        onClick={() => fetchFileContent(file.path)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-semibold shadow'
                            : 'text-slate-300 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </span>
                        {isCore && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-400'}`}>
                            core
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Code Viewer */}
              <div className="lg:col-span-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col h-[600px] overflow-hidden">
                <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs text-indigo-300">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    <span>bot/{selectedFile}</span>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(fileContent);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 transition-all"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>

                <div className="flex-1 bg-slate-950/90 p-4 overflow-auto">
                  <pre className="text-xs font-mono text-slate-300 leading-relaxed">
                    <code>{fileContent || '// Select a file to view content'}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: HOSTING & DEPLOYMENT GUIDE */}
        {activeTab === 'guide' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Complete Deployment & Setup Guide
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Because all Lavalink requirements have been removed, hosting this music bot is now drastically easier and cheaper. You no longer need to run or pay for a separate Java server!
              </p>
            </div>

            {/* Step 1: System Packages & Auto-Installer */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm text-indigo-300">
                  <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">1</span>
                  Automatic VPS Dependencies & Audio Engine Setup
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                  Auto-Downloads Automatically
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                You never need to manually wrestle with installing yt-dlp or FFmpeg on your VPS again! The system has two built-in layers that automatically detect and download all required static binaries for your server architecture (Linux x64, ARM64, Raspberry Pi, macOS, or Windows):
              </p>

              {/* Automatic Web Online & Startup Hook */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-xs text-indigo-300 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Method 1: Automatic Download On Web / Bot Startup (Zero Configuration)
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  As soon as the web dashboard comes online or <code className="text-emerald-400">node index.js</code> executes, the app automatically checks if <code className="text-slate-200 font-mono">yt-dlp</code> and <code className="text-slate-200 font-mono">ffmpeg</code> exist. If missing, it immediately downloads high-performance static binaries to <code className="text-slate-200 font-mono">./bin</code> and configures PATH on the fly!
                </p>
              </div>

              {/* Shell Script Setup Hook */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-300 font-medium mb-1">Method 2: Run the All-In-One VPS Dependency Script:</div>
                  <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-emerald-400 overflow-x-auto">
{`# 1. Run the universal multi-distro dependency setup script
bash scripts/setup-dependencies.sh

# It automatically detects apt (Ubuntu/Debian), dnf/yum (CentOS/Fedora/Rocky),
# pacman (Arch), apk (Alpine), or brew (macOS) and installs FFmpeg & yt-dlp!`}
                  </pre>
                </div>

                <div>
                  <div className="text-slate-300 font-medium mb-1">How to Set as a Startup Hook on Your VPS:</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 space-y-1.5">
                      <div className="font-semibold text-indigo-300 text-xs">Option A: Systemd Startup Service</div>
                      <p className="text-[11px] text-slate-400">Create <code className="text-slate-300">/etc/systemd/system/groove-deps.service</code>:</p>
                      <pre className="text-[10px] bg-slate-900 p-2 rounded text-slate-300 font-mono overflow-x-auto">
{`[Unit]
Description=Groove Audio Deps
Before=groove-bot.service
After=network.target

[Service]
Type=oneshot
WorkingDirectory=/root/your-bot
ExecStart=/bin/bash scripts/setup-dependencies.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target`}
                      </pre>
                      <p className="text-[10px] text-slate-500">Run: <code className="text-emerald-400">sudo systemctl enable --now groove-deps</code></p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-850 space-y-1.5">
                      <div className="font-semibold text-indigo-300 text-xs">Option B: Crontab / PM2 Startup Hook</div>
                      <p className="text-[11px] text-slate-400">Automatically run on system reboot:</p>
                      <pre className="text-[10px] bg-slate-900 p-2 rounded text-slate-300 font-mono overflow-x-auto">
{`# In crontab (crontab -e):
@reboot /bin/bash /path/to/bot/scripts/setup-dependencies.sh

# Or with PM2:
pm2 start "bash scripts/setup-dependencies.sh && npm start" --name groove-music`}
                      </pre>
                      <p className="text-[10px] text-slate-500">Also included as <code className="text-emerald-400">npm run setup-deps</code> in package.json</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Environment Setup */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-sm text-indigo-300">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">2</span>
                Configure Bot Token (.env)
              </div>
              <p className="text-xs text-slate-400">
                Create a file named <code className="text-indigo-300">.env</code> in the bot directory:
              </p>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-emerald-400 text-xs overflow-x-auto">
{`DISCORD_TOKEN=MTAyNDM...YOUR_TOKEN_HERE
BOT_PREFIX=/
OWNER_IDS=123456789012345678
YTDLP_PATH=yt-dlp
FFMPEG_PATH=ffmpeg`}
              </pre>
            </div>

            {/* Step 3: Run the Bot */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 font-semibold text-sm text-indigo-300">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs">3</span>
                Install Node Dependencies & Start
              </div>
              <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-emerald-400 text-xs overflow-x-auto">
{`# Install dependencies
npm install

# Start bot in standard mode
npm start

# Or run with PM2 for 24/7 background uptime:
npm install -g pm2
pm2 start index.js --name "groove-music"`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* Floating Mini Player (Active during streaming on other tabs) */}
      {currentTrack && activeTab !== 'studio' && (
        <div className={`fixed sm:absolute bottom-[66px] left-2.5 right-2.5 ${viewMode === 'mobile' ? 'max-w-[428px]' : 'max-w-xl md:bottom-4'} mx-auto z-40 animate-slide-up`}>
          <div
            onClick={() => {
              setActiveTab('studio');
              setStudioSubTab('player');
            }}
            className="bg-slate-900/95 backdrop-blur-xl border border-indigo-500/40 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              {currentTrack.thumbnail ? (
                <img src={currentTrack.thumbnail} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-indigo-600/30 flex items-center justify-center shrink-0">
                  <Disc className="w-5 h-5 text-indigo-400 animate-spin-slow" />
                </div>
              )}
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">{currentTrack.title}</div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                  <span>{currentTrack.author}</span>
                  <span>•</span>
                  <span className="text-indigo-400 font-mono">{currentTrack.durationFormatted}</span>
                  {selectedFilter !== 'clear' && (
                    <span className="px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono text-[9px] border border-indigo-800">
                      {selectedFilter}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  if (isPlaying) {
                    audioRef.current?.pause();
                    setIsPlaying(false);
                  } else {
                    audioRef.current?.play();
                    setIsPlaying(true);
                  }
                }}
                className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 transition-all"
                title="Toggle Playback"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              {queue.length > 0 && (
                <button
                  onClick={() => handleSkip()}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all"
                  title="Skip"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Mobile Tab Navigation Bar (Dock) */}
      <nav className={`${viewMode === 'responsive' ? 'md:hidden' : ''} sticky bottom-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 pt-1 pb-safe shrink-0`}>
        <div className="grid grid-cols-5 gap-0.5">
          {/* Tab 1: Dashboard / Home */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
              activeTab === 'dashboard'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Server className={`w-4 h-4 mb-0.5 transition-transform ${activeTab === 'dashboard' ? 'scale-110 text-indigo-400' : ''}`} />
            <span className="text-[10px]">Home</span>
          </button>

          {/* Tab 2: Player */}
          <button
            onClick={() => {
              setActiveTab('studio');
              setStudioSubTab('player');
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
              activeTab === 'studio' && studioSubTab !== 'queue'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Disc className={`w-4 h-4 mb-0.5 transition-transform ${activeTab === 'studio' && studioSubTab !== 'queue' ? 'scale-110 text-indigo-400' : ''} ${isPlaying ? 'animate-spin-slow' : ''}`} />
            <span className="text-[10px]">Player</span>
          </button>

          {/* Tab 3: Queue */}
          <button
            onClick={() => {
              setActiveTab('studio');
              setStudioSubTab('queue');
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl relative transition-all ${
              activeTab === 'studio' && studioSubTab === 'queue'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className="relative">
              <ListMusic className={`w-4 h-4 mb-0.5 transition-transform ${activeTab === 'studio' && studioSubTab === 'queue' ? 'scale-110 text-indigo-400' : ''}`} />
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-2 px-1 text-[8px] font-bold bg-indigo-600 text-white rounded-full">
                  {queue.length}
                </span>
              )}
            </div>
            <span className="text-[10px]">Queue</span>
          </button>

          {/* Tab 4: Console */}
          <button
            onClick={() => setActiveTab('commands')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
              activeTab === 'commands'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Terminal className={`w-4 h-4 mb-0.5 transition-transform ${activeTab === 'commands' ? 'scale-110 text-indigo-400' : ''}`} />
            <span className="text-[10px]">Console</span>
          </button>

          {/* Tab 5: Guide */}
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
              activeTab === 'guide'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <BookOpen className={`w-4 h-4 mb-0.5 transition-transform ${activeTab === 'guide' ? 'scale-110 text-indigo-400' : ''}`} />
            <span className="text-[10px]">Guide</span>
          </button>
        </div>

        {/* iOS / Android Gesture Home Bar */}
        <div className="w-24 h-1 bg-slate-800/80 rounded-full mx-auto mt-1.5 mb-0.5" />
      </nav>

      {/* Mobile Codebase Explorer Drawer / Bottom Sheet */}
      {showCodeDrawer && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85%] flex flex-col p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Code className="w-4 h-4 text-indigo-400" />
                Bot Codebase Explorer
              </span>
              <button
                onClick={() => setShowCodeDrawer(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Mobile File Selector */}
            <div className="flex gap-2">
              <select
                value={selectedFile}
                onChange={(e) => handleFileSelect(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none"
              >
                {fileList.map((f) => (
                  <option key={f.path} value={f.path}>
                    {f.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(fileContent);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs flex items-center gap-1"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Code Viewer */}
            <div className="flex-1 bg-slate-950 rounded-xl p-3 overflow-auto max-h-80 border border-slate-800">
              <pre className="text-[11px] font-mono text-slate-300 leading-relaxed overflow-x-auto">
                <code>{fileContent || '// Select a file above to inspect'}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
