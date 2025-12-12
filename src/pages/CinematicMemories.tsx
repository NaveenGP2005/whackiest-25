import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Film,
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Upload,
  Sparkles,
  Download,
  Share2,
  Clock,
  MapPin,
  Heart,
  Smile,
  Meh,
  Camera,
} from 'lucide-react';
import Button from '../components/ui/Button';

interface MemoryPhoto {
  id: string;
  url: string;
  timestamp: string;
  location: string;
  emotion: 'joy' | 'awe' | 'peace' | 'excitement' | 'tired';
  caption?: string;
}

interface Scene {
  id: string;
  photos: string[];
  narration: string;
  duration: number;
  title: string;
}

// Sample photos (using placeholder colors since we can't use actual images)
const samplePhotos: MemoryPhoto[] = [
  { id: '1', url: '#6366f1', timestamp: '06:15 AM', location: 'Hemakuta Hill', emotion: 'awe', caption: 'Sunrise over the ruins' },
  { id: '2', url: '#f59e0b', timestamp: '06:45 AM', location: 'Hemakuta Hill', emotion: 'joy', caption: 'Golden hour magic' },
  { id: '3', url: '#10b981', timestamp: '07:30 AM', location: 'Mango Tree', emotion: 'joy', caption: 'Best breakfast in Hampi' },
  { id: '4', url: '#8b5cf6', timestamp: '08:30 AM', location: 'Virupaksha Temple', emotion: 'awe', caption: 'Ancient architecture' },
  { id: '5', url: '#ec4899', timestamp: '09:15 AM', location: 'Temple Complex', emotion: 'excitement', caption: 'Group photo!' },
  { id: '6', url: '#14b8a6', timestamp: '10:30 AM', location: 'Royal Enclosure', emotion: 'awe', caption: 'Walking through history' },
  { id: '7', url: '#f97316', timestamp: '11:45 AM', location: 'Queens Bath', emotion: 'peace', caption: 'Peaceful moments' },
  { id: '8', url: '#64748b', timestamp: '12:30 PM', location: 'Shade spot', emotion: 'tired', caption: 'Much needed break' },
  { id: '9', url: '#ef4444', timestamp: '14:00 PM', location: 'Lotus Mahal', emotion: 'awe', caption: 'Architectural marvel' },
  { id: '10', url: '#3b82f6', timestamp: '15:30 PM', location: 'Tungabhadra River', emotion: 'excitement', caption: 'Coracle adventure!' },
  { id: '11', url: '#f472b6', timestamp: '17:30 PM', location: 'Matanga Hill', emotion: 'peace', caption: 'The climb begins' },
  { id: '12', url: '#fbbf24', timestamp: '18:15 PM', location: 'Matanga Summit', emotion: 'awe', caption: 'Sunset paradise' },
];

const sampleScenes: Scene[] = [
  {
    id: '1',
    photos: ['1', '2'],
    title: 'Dawn Awakening',
    narration: 'The morning began before the sun itself. Four friends, still drowsy from the overnight train, made their way up Hemakuta Hill. As the first rays of light painted the ancient boulders gold, something shifted. This wasn\'t just a trip anymore - it was the beginning of a story.',
    duration: 8,
  },
  {
    id: '2',
    photos: ['3'],
    title: 'Hidden Flavors',
    narration: 'At a restaurant that exists only in locals\' whispers, they discovered that the best meals aren\'t found on Google Maps. The Mango Tree served more than breakfast - it served belonging.',
    duration: 6,
  },
  {
    id: '3',
    photos: ['4', '5', '6'],
    title: 'Echoes of Empire',
    narration: 'Walking through the Virupaksha Temple, time collapsed. Every carved pillar held a story, every stone step worn smooth by millions of feet before them. They weren\'t tourists anymore - they were pilgrims in the cathedral of history.',
    duration: 10,
  },
  {
    id: '4',
    photos: ['7', '8'],
    title: 'The Quiet Hours',
    narration: 'Not every moment needs to be extraordinary. Sometimes, the most memorable parts of a journey are the quiet ones - the shade under a banyan tree, cold water shared between friends, laughter at nothing in particular.',
    duration: 7,
  },
  {
    id: '5',
    photos: ['9', '10'],
    title: 'Adventures Unplanned',
    narration: 'The Lotus Mahal took their breath away, but it was the spontaneous coracle ride that took their fears. Spinning on the Tungabhadra, screaming and laughing, they remembered why they became friends in the first place.',
    duration: 8,
  },
  {
    id: '6',
    photos: ['11', '12'],
    title: 'The Golden Goodbye',
    narration: 'As the sun descended behind the boulder-strewn landscape, painting everything in shades of amber and rose, four friends sat in silence. Some moments are too perfect for words. This was one of them. Hampi hadn\'t just given them memories - it had forged them into something more.',
    duration: 10,
  },
];

const emotionIcons = {
  joy: { icon: Smile, color: 'text-yellow-400' },
  awe: { icon: Sparkles, color: 'text-purple-400' },
  peace: { icon: Heart, color: 'text-blue-400' },
  excitement: { icon: Sparkles, color: 'text-pink-400' },
  tired: { icon: Meh, color: 'text-gray-400' },
};

export default function CinematicMemories() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(true); // Start with pre-generated for demo

  const currentScene = sampleScenes[currentSceneIndex];
  const currentPhotos = samplePhotos.filter(p => currentScene.photos.includes(p.id));

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + (100 / (currentScene.duration * 10));
          if (newProgress >= 100) {
            if (currentSceneIndex < sampleScenes.length - 1) {
              setCurrentSceneIndex(i => i + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return 100;
            }
          }
          return newProgress;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentScene.duration, currentSceneIndex]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handleNext = () => {
    if (currentSceneIndex < sampleScenes.length - 1) {
      setCurrentSceneIndex(i => i + 1);
      setProgress(0);
    }
  };

  const handlePrev = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(i => i - 1);
      setProgress(0);
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setHasGenerated(true);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation */}
      <nav className="border-b border-dark-800 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Film className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Cinematic Memories</h1>
                  <p className="text-dark-400 text-sm">Hampi Adventure - Dec 2024</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {hasGenerated ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Player */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Player Area */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden aspect-video relative"
              >
                {/* Photo Display with Ken Burns effect */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentScene.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: isPlaying ? 1.05 : 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                  >
                    {/* Gradient background representing photo */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${currentPhotos[0]?.url || '#1e293b'} 0%, ${currentPhotos[1]?.url || '#0f172a'} 100%)`,
                      }}
                    />

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />

                    {/* Scene Title */}
                    <motion.div
                      className="absolute top-6 left-6"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="text-primary-400 text-sm font-medium uppercase tracking-wider">
                        Scene {currentSceneIndex + 1} of {sampleScenes.length}
                      </span>
                      <h2 className="text-3xl font-display font-bold text-white mt-1">
                        {currentScene.title}
                      </h2>
                    </motion.div>

                    {/* Photo indicator */}
                    <div className="absolute top-6 right-6 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-white/60" />
                      <span className="text-white/60 text-sm">
                        {currentPhotos.length} photos
                      </span>
                    </div>

                    {/* Narration Text */}
                    <motion.div
                      className="absolute bottom-20 left-6 right-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <p className="text-white text-lg leading-relaxed font-light">
                        "{currentScene.narration}"
                      </p>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-700">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </motion.div>

              {/* Controls */}
              <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrev}
                      disabled={currentSceneIndex === 0}
                    >
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    <Button variant="primary" onClick={handlePlayPause}>
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleNext}
                      disabled={currentSceneIndex === sampleScenes.length - 1}
                    >
                      <SkipForward className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-dark-400 text-sm font-mono">
                      {Math.floor(progress / 100 * currentScene.duration)}s / {currentScene.duration}s
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Scene selector */}
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                  {sampleScenes.map((scene, index) => (
                    <button
                      key={scene.id}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-all ${
                        index === currentSceneIndex
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-800 text-dark-400 hover:bg-dark-700'
                      }`}
                      onClick={() => {
                        setCurrentSceneIndex(index);
                        setProgress(0);
                      }}
                    >
                      {scene.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Photo Timeline */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-4"
              >
                <h3 className="font-display font-semibold text-white mb-4">Photo Timeline</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                  {samplePhotos.map((photo) => {
                    const EmotionIcon = emotionIcons[photo.emotion].icon;
                    const isInCurrentScene = currentScene.photos.includes(photo.id);

                    return (
                      <motion.div
                        key={photo.id}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer ${
                          isInCurrentScene
                            ? 'bg-primary-500/20 ring-1 ring-primary-500/50'
                            : 'bg-dark-800/50 hover:bg-dark-700/50'
                        }`}
                        whileHover={{ scale: 1.02 }}
                      >
                        {/* Photo thumbnail */}
                        <div
                          className="w-12 h-12 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: photo.url }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium truncate">
                              {photo.caption}
                            </span>
                            <EmotionIcon className={`w-4 h-4 flex-shrink-0 ${emotionIcons[photo.emotion].color}`} />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-dark-400">
                            <Clock className="w-3 h-3" />
                            {photo.timestamp}
                            <MapPin className="w-3 h-3 ml-1" />
                            {photo.location}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Emotion Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-4"
              >
                <h3 className="font-display font-semibold text-white mb-4">Emotion Journey</h3>
                <div className="space-y-2">
                  {Object.entries(emotionIcons).map(([emotion, { icon: Icon, color }]) => {
                    const count = samplePhotos.filter(p => p.emotion === emotion).length;
                    const percentage = (count / samplePhotos.length) * 100;

                    return (
                      <div key={emotion} className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-dark-400 text-sm capitalize w-20">{emotion}</span>
                        <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-dark-500 text-xs w-8">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* AI Narration Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-display font-semibold text-white mb-1">AI-Generated Story</h4>
                    <p className="text-dark-400 text-sm">
                      This documentary was automatically created by analyzing your photos,
                      timestamps, locations, and detected emotions to craft a cinematic narrative.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Upload / Generate Section */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="glass-card p-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6">
                <Film className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-2">
                Create Your Documentary
              </h2>
              <p className="text-dark-400 mb-8">
                Upload your trip photos and let AI craft a cinematic story of your journey
              </p>

              <div className="glass-card p-6 border-dashed border-2 border-dark-700 hover:border-primary-500/50 transition-colors cursor-pointer mb-6">
                <Upload className="w-12 h-12 text-dark-500 mx-auto mb-4" />
                <p className="text-dark-300 mb-2">Drop your photos here</p>
                <p className="text-dark-500 text-sm">or click to browse</p>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Generating your story...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Documentary
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
