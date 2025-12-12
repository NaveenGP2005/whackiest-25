// ============================================================
// CINEMATIC MEMORIES PAGE
// AI-powered travel documentary generator
// ============================================================

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Film,
  ArrowLeft,
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useCinematicMemoriesStore } from '../stores/cinematic-memories.store';
import {
  PhotoUploadZone,
  PhotoPreviewGrid,
  AnalysisProgress,
  CinematicPlayer,
  EmotionJourney,
} from '../components/memories';
import { analyzePhotos, groupPhotosIntoScenes, generateStory } from '../services/memories';

export default function CinematicMemories() {
  const navigate = useNavigate();
  const {
    uploadedPhotos,
    processedPhotos,
    analysisStage,
    generatedStory,
    scenes,
    setAnalysisStage,
    setAnalysisProgress,
    setAnalysisMessage,
    setCurrentDetections,
    setProcessedPhotos,
    setScenes,
    setGeneratedStory,
    play,
    reset,
    currentSceneIndex,
    setCurrentScene,
  } = useCinematicMemoriesStore();

  const hasPhotos = uploadedPhotos.length > 0;
  const canGenerate = hasPhotos && analysisStage === 'idle';
  const isAnalyzing = analysisStage === 'analyzing' || analysisStage === 'generating';
  const hasStory = generatedStory !== null && scenes.length > 0;

  // Start the analysis pipeline
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;

    try {
      setAnalysisStage('uploading');
      setAnalysisMessage('Preparing your photos...');
      await new Promise((r) => setTimeout(r, 500));

      setAnalysisStage('analyzing');
      setAnalysisMessage('AI is examining your photos...');

      // Analyze all photos
      const processed = await analyzePhotos(
        uploadedPhotos,
        (current, total, photo, detections) => {
          setAnalysisProgress({ current, total });
          if (detections && detections.length > 0) {
            setCurrentDetections(detections);
          }
          if (photo) {
            setAnalysisMessage(`Analyzed: ${photo.analysis.caption}`);
          }
        }
      );

      setProcessedPhotos(processed);

      // Group into scenes (now async - generates AI titles)
      setAnalysisStage('generating');
      setAnalysisMessage('Creating your documentary...');
      const groupedScenes = await groupPhotosIntoScenes(processed);
      setScenes(groupedScenes);

      // Generate story
      const story = await generateStory(groupedScenes, (stage) => {
        setAnalysisMessage(stage);
      });

      setGeneratedStory(story);
      setAnalysisStage('complete');
      setAnalysisMessage('Your documentary is ready!');
      setCurrentDetections([]);

      // Auto-play after short delay
      setTimeout(() => {
        play();
      }, 1000);
    } catch (error) {
      console.error('Generation error:', error);
      setAnalysisStage('idle');
      setAnalysisMessage('Something went wrong. Please try again.');
    }
  }, [
    canGenerate,
    uploadedPhotos,
    setAnalysisStage,
    setAnalysisMessage,
    setAnalysisProgress,
    setCurrentDetections,
    setProcessedPhotos,
    setScenes,
    setGeneratedStory,
    play,
  ]);

  // Reset and start over
  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

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
                  <p className="text-dark-400 text-sm">
                    {generatedStory ? generatedStory.title : 'AI Documentary Generator'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasStory && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    New Story
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="secondary" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Story Generated - Show Player */}
          {hasStory && analysisStage === 'complete' ? (
            <motion.div
              key="player"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Main Player */}
              <div className="lg:col-span-2 space-y-6">
                <CinematicPlayer />

                {/* Story Info */}
                {generatedStory && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-display font-bold text-white">
                          {generatedStory.title}
                        </h3>
                        <p className="text-gray-400 italic">{generatedStory.tagline}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                            {scenes.length} scenes
                          </span>
                          <span className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs rounded-full">
                            {processedPhotos.length} photos
                          </span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                            {Math.round(generatedStory.totalDuration / 60)}+ mins
                          </span>
                          {generatedStory.locations.length > 0 && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                              {generatedStory.locations.length} locations
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Emotion Journey */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-4"
                >
                  <EmotionJourney
                    scenes={scenes}
                    currentSceneIndex={currentSceneIndex}
                    onSceneClick={setCurrentScene}
                  />
                </motion.div>

                {/* Scene List */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card p-4"
                >
                  <h3 className="font-display font-semibold text-white mb-4">Scenes</h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    {scenes.map((scene, index) => (
                      <button
                        key={scene.id}
                        onClick={() => setCurrentScene(index)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          index === currentSceneIndex
                            ? 'bg-purple-500/20 ring-1 ring-purple-500/50'
                            : 'bg-dark-800/50 hover:bg-dark-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{scene.title}</span>
                          <span className="text-xs text-gray-500">
                            {scene.photos.length} photos
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {scene.narration}
                        </p>
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Locations */}
                {generatedStory && generatedStory.locations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card p-4"
                  >
                    <h3 className="font-display font-semibold text-white mb-3">Locations</h3>
                    <div className="flex flex-wrap gap-2">
                      {generatedStory.locations.map((location) => (
                        <span
                          key={location}
                          className="px-3 py-1 bg-dark-800 text-gray-300 text-sm rounded-full"
                        >
                          {location}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Upload & Generate Section */
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {/* Header */}
              {!isAnalyzing && (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6"
                  >
                    <Film className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-display font-bold text-white mb-3">
                    Create Your Documentary
                  </h2>
                  <p className="text-gray-400 max-w-lg mx-auto">
                    Upload your travel photos and watch AI craft a Netflix-style documentary
                    complete with narration, smart doodles, and cinematic effects.
                  </p>
                </div>
              )}

              {/* Upload Zone */}
              {!isAnalyzing && <PhotoUploadZone />}

              {/* Photo Preview */}
              {!isAnalyzing && hasPhotos && <PhotoPreviewGrid />}

              {/* Analysis Progress */}
              {isAnalyzing && <AnalysisProgress />}

              {/* Generate Button */}
              {canGenerate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleGenerate}
                    className="px-8 py-4 text-lg"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Generate Documentary ({uploadedPhotos.length} photos)
                  </Button>
                </motion.div>
              )}

              {/* Features List */}
              {!hasPhotos && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
                >
                  <FeatureCard
                    icon="🤖"
                    title="AI Photo Analysis"
                    description="Gemini Vision detects objects, emotions, landmarks, and scene types in every photo"
                  />
                  <FeatureCard
                    icon="✨"
                    title="Smart Doodles"
                    description="Fun annotations automatically placed on detected objects like food, faces, and landmarks"
                  />
                  <FeatureCard
                    icon="🎬"
                    title="Cinematic Playback"
                    description="Ken Burns pan/zoom effects with typewriter narration like a Netflix documentary"
                  />
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Feature card component
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card p-6 text-center"
    >
      <span className="text-4xl mb-4 block">{icon}</span>
      <h3 className="text-lg font-display font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </motion.div>
  );
}
