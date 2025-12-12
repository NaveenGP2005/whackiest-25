import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Sparkles,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  Loader2,
  Zap,
  Cpu,
  AlertCircle,
  Upload,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { useSignalCleanse } from '../hooks/useSignalCleanse';

// Sample chaotic chat for demo
const sampleChat = `Yashas: Guys hampi trip pakka na? 🎉
Naveen: Yesss been waiting!!!
Jeeth: Same 😍😍
Shrajan: Dates fix madi
Yashas: December 15-18?
Naveen: 14th night I reach actually
Jeeth: works for me
*Naveen sent a meme*
*Shrajan sent a meme*
Yashas: 😂😂😂
Naveen: Budget discuss madi
Yashas: 15k per head max?
Jeeth: Can do 12-15k
Shrajan: 15k is fine
*Jeeth sent a GIF*
Naveen: Found this hostel - Gowri Resort ₹2k/night
Yashas: Looks good! 4 beds?
Naveen: Ya 4 bed dorm
Shrajan: Book it
Yashas: I'll book train tickets tomorrow
*Naveen sent a meme*
Jeeth: 😂😂😂😂
Yashas: Focus guys 😅
Jeeth: What all places?
Shrajan: Hampi ruins obviously
Yashas: Virupaksha temple
Naveen: Lotus mahal
Jeeth: Hippie island!!
Shrajan: Tungabhadra dam?
Naveen: Maybe if time
*Yashas sent a meme*
Jeeth: 🤣🤣
Shrajan: Train or bus?
Yashas: Train - overnight = saves hotel
Naveen: Smart 👍
Jeeth: I'll make packing list
Shrajan: I'll research guides
Yashas: Rent bikes there for local travel
Naveen: Ya that's cheapest
*12 memes exchanged*
Jeeth: Morning temple visits better - less hot
Yashas: True, afternoon = 40 degrees
Naveen: Guide needed for ruins?
Shrajan: Researching...
Jeeth: Veg or non-veg restaurants?
Yashas: Both options keep
*GIF*
Shrajan: Coracle ride costs ₹500 - worth it?
Naveen: Looks fun but expensive
*More memes*`;

interface FloatingMessage {
  id: number;
  text: string;
  x: number;
  y: number;
  isMeme: boolean;
}

export default function SignalCleanse() {
  const navigate = useNavigate();
  const {
    chatInput,
    setChatInput,
    isProcessing,
    processingStage,
    processingProgress,
    extractionResult,
    activeProvider,
    fallbacksUsed,
    processChat,
    reset,
  } = useSignalCleanse();

  const [floatingMessages, setFloatingMessages] = useState<FloatingMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showResults = extractionResult !== null && !isProcessing;

  // Create floating messages for chaos visualization
  useEffect(() => {
    if (chatInput && !isProcessing && !showResults) {
      const messages = chatInput.split('\n').filter(m => m.trim()).slice(0, 30);
      const floating = messages.map((text, i) => ({
        id: i,
        text: text.substring(0, 50),
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        isMeme: text.includes('meme') || text.includes('GIF') || text.includes('😂'),
      }));
      setFloatingMessages(floating);
    }
  }, [chatInput, isProcessing, showResults]);

  const handleProcess = async () => {
    setError(null);
    const result = await processChat(chatInput);
    if (!result) {
      setError('Failed to process chat. Please check your API key or try again.');
    }
  };

  const handleLoadSample = () => {
    setChatInput(sampleChat);
    setError(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.chat')) {
      setError('Please upload a .txt or .chat file');
      return;
    }

    // Check file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setError('File too large. Maximum size is 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setChatInput(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);

    // Reset input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    reset();
    setFloatingMessages([]);
    setError(null);
  };

  // Provider display name
  const getProviderDisplayName = (provider: string | null) => {
    switch (provider) {
      case 'openrouter': return 'Grok AI';
      case 'groq': return 'Groq Llama';
      case 'huggingface': return 'HuggingFace';
      case 'offline': return 'Offline Heuristics';
      default: return 'AI';
    }
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Signal-Cleanse</h1>
                  <p className="text-dark-400 text-sm">Extract decisions from chaos</p>
                </div>
              </div>
            </div>
            {activeProvider && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700">
                <Cpu className="w-4 h-4 text-primary-400" />
                <span className="text-dark-300 text-sm">
                  Powered by <span className="text-primary-400">{getProviderDisplayName(activeProvider)}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {!showResults ? (
          <>
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Chat Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-semibold text-white">
                    Paste Your Group Chat
                  </h2>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".txt,.chat"
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      icon={<Upload className="w-4 h-4" />}
                      iconPosition="left"
                    >
                      Upload File
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLoadSample}>
                      Load Sample
                    </Button>
                  </div>
                </div>

                <div className="glass-card p-1 relative">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Paste your WhatsApp/Telegram chat export here, or upload a .txt file..."
                    className="w-full h-96 bg-transparent text-dark-200 p-4 resize-none focus:outline-none font-mono text-sm"
                  />
                  {!chatInput && (
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-dark-800/30 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-12 h-12 text-dark-500 mb-3" />
                      <p className="text-dark-400 text-sm">Click to upload or drag & drop</p>
                      <p className="text-dark-500 text-xs mt-1">.txt or .chat files</p>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleProcess}
                    disabled={!chatInput.trim() || isProcessing}
                    icon={isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    iconPosition="left"
                    className="flex-1"
                  >
                    {isProcessing ? processingStage || 'Processing...' : 'Extract Signal'}
                  </Button>
                  <Button variant="ghost" size="lg" onClick={handleReset}>
                    Reset
                  </Button>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-dark-300 text-sm">{processingStage}</span>
                      <span className="text-primary-400 text-sm">{processingProgress}%</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${processingProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    {fallbacksUsed.length > 0 && (
                      <p className="text-dark-400 text-xs mt-2">
                        Fallbacks used: {fallbacksUsed.map(p => getProviderDisplayName(p)).join(' → ')}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Chaos Visualization */}
              <div className="relative glass-card min-h-[500px] overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-30" />

                <div className="absolute top-4 left-4 right-4 z-10">
                  <h3 className="text-lg font-display font-semibold text-white mb-2">
                    {isProcessing ? 'Processing Chaos...' : 'Chat Chaos Visualization'}
                  </h3>
                  <p className="text-dark-400 text-sm">
                    {floatingMessages.length > 0
                      ? `${floatingMessages.filter(m => m.isMeme).length} memes detected in ${floatingMessages.length} messages`
                      : 'Paste your chat to see the chaos'}
                  </p>
                </div>

                {/* Floating Messages */}
                <AnimatePresence>
                  {floatingMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      className={`absolute px-3 py-2 rounded-lg text-xs max-w-[200px] truncate ${
                        msg.isMeme
                          ? 'bg-secondary-500/20 text-secondary-300 border border-secondary-500/30'
                          : 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                      }`}
                      initial={{
                        x: `${msg.x}%`,
                        y: `${msg.y}%`,
                        opacity: 0,
                        scale: 0
                      }}
                      animate={{
                        x: isProcessing ? '50%' : `${msg.x}%`,
                        y: isProcessing ? '50%' : `${msg.y}%`,
                        opacity: isProcessing ? 0 : 0.8,
                        scale: isProcessing ? 0 : 1,
                      }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{
                        duration: isProcessing ? 0.8 : 0.3,
                        delay: msg.id * 0.02
                      }}
                    >
                      {msg.text}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Processing Animation */}
                {isProcessing && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="relative">
                      <motion.div
                        className="w-24 h-24 rounded-full border-4 border-primary-500/30"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.div
                        className="absolute inset-2 rounded-full border-4 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-primary-400" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        ) : (
          /* Results Section */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Stats Banner */}
            <div className="glass-card p-6 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/20">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">
                      Chaos Cleansed!
                    </h2>
                    <p className="text-dark-300">
                      {extractionResult.stats.totalMessages} messages → {extractionResult.stats.extractedItems || 0} actionable items
                    </p>
                    {activeProvider && (
                      <p className="text-dark-400 text-sm mt-1">
                        Processed with {getProviderDisplayName(activeProvider)} in {extractionResult.stats.processingTimeMs}ms
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-3xl font-display font-bold text-primary-400">{extractionResult.stats.totalMessages}</p>
                    <p className="text-dark-400 text-sm">Total Messages</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-display font-bold text-secondary-400">{extractionResult.stats.mediaFiltered}</p>
                    <p className="text-dark-400 text-sm">Memes Filtered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-display font-bold text-emerald-400">{extractionResult.stats.extractedItems || 0}</p>
                    <p className="text-dark-400 text-sm">Items Extracted</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dates */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white">Dates</h3>
                </div>
                <div className="space-y-3">
                  {extractionResult.dates.length > 0 ? (
                    extractionResult.dates.map((d, i) => (
                      <div key={i} className="p-3 rounded-lg bg-dark-800/50">
                        <p className="text-white font-medium">{d.date}</p>
                        <p className="text-dark-400 text-sm mt-1">{d.context}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-dark-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${d.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-dark-400">{d.confidence}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-dark-400 text-sm">No dates detected</p>
                  )}
                </div>
              </motion.div>

              {/* Budget */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white">Budget</h3>
                </div>
                {extractionResult.budget ? (
                  <>
                    <div className="text-3xl font-display font-bold text-white mb-4">
                      {extractionResult.budget.total}
                      {extractionResult.budget.perPerson && (
                        <span className="text-lg text-dark-400 font-normal"> per person</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {extractionResult.budget.breakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/50">
                          <div>
                            <p className="text-dark-200">{item.item}</p>
                            {item.notes && <p className="text-dark-500 text-xs">{item.notes}</p>}
                          </div>
                          <p className="text-emerald-400 font-mono">{item.amount}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-dark-400 text-sm">No budget information detected</p>
                )}
              </motion.div>

              {/* Places */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-secondary-400" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white">Places</h3>
                </div>
                <div className="space-y-2">
                  {extractionResult.places.length > 0 ? (
                    extractionResult.places.map((place, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-dark-800/50">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            place.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} />
                          <div>
                            <p className="text-dark-200">{place.name}</p>
                            {place.type && (
                              <p className="text-dark-500 text-xs capitalize">{place.type}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {place.votes > 0 && (
                            <div className="flex items-center gap-1 text-dark-400 text-sm">
                              <Users className="w-3 h-3" />
                              {place.votes}
                            </div>
                          )}
                          {place.enrichedData?.coordinates && (
                            <MapPin className="w-3 h-3 text-primary-400" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-dark-400 text-sm">No places detected</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Tasks & Decisions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tasks */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-white">Tasks Extracted</h3>
                </div>
                <div className="space-y-3">
                  {extractionResult.tasks.length > 0 ? (
                    extractionResult.tasks.map((task, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-dark-800/50">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                            task.status === 'in-progress' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-dark-600 text-dark-300'
                          }`}>
                            {task.assignee?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-dark-200">{task.task}</p>
                            <p className="text-dark-500 text-xs">
                              {task.assignee || 'Unassigned'}
                              {task.deadline && ` • Due: ${task.deadline}`}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                          task.status === 'in-progress' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-dark-600 text-dark-300'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-dark-400 text-sm">No tasks detected</p>
                  )}
                </div>
              </motion.div>

              {/* Decisions & Open Questions */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-display font-semibold text-white">Decisions Made</h3>
                  </div>
                  <div className="space-y-2">
                    {extractionResult.decisions.length > 0 ? (
                      extractionResult.decisions.map((d, i) => (
                        <div key={i} className="flex items-start gap-3 p-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-dark-200">{d.decision}</p>
                            {d.madeBy && (
                              <p className="text-dark-500 text-xs">by {d.madeBy}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-dark-400 text-sm">No decisions detected</p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="glass-card p-6 border-amber-500/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-display font-semibold text-white">Still Undecided</h3>
                  </div>
                  <div className="space-y-2">
                    {extractionResult.openQuestions.length > 0 ? (
                      extractionResult.openQuestions.map((q, i) => (
                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-amber-500/5">
                          <span className="text-amber-400">?</span>
                          <p className="text-dark-300">{q.question}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-dark-400 text-sm">All questions resolved!</p>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button variant="ghost" size="lg" onClick={handleReset}>
                Process Another Chat
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/itinerary')}
              >
                Generate Itinerary from This
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
