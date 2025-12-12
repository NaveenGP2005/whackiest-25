import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Map, Film, MessageSquare } from 'lucide-react';
import Globe from '../components/canvas/Globe';
import Button from '../components/ui/Button';
import { FeatureCard } from '../components/ui/Card';

const features = [
  {
    icon: <MessageSquare className="w-7 h-7 text-white" />,
    title: 'Signal-Cleanse',
    description: '847 chaotic messages → 12 clear decisions. AI extracts what matters from your group chaos.',
    color: 'primary',
    path: '/signal-cleanse',
  },
  {
    icon: <Shield className="w-7 h-7 text-white" />,
    title: 'Safety Sentinel',
    description: 'Your silent guardian. Detects unusual patterns before crisis happens.',
    color: 'green',
    path: '/safety',
  },
  {
    icon: <Map className="w-7 h-7 text-white" />,
    title: 'Elastic Itinerary',
    description: 'A living schedule that breathes with you. Adapts to crowds, weather, and your energy.',
    color: 'secondary',
    path: '/itinerary',
  },
  {
    icon: <Film className="w-7 h-7 text-white" />,
    title: 'Cinematic Memories',
    description: 'Your trip becomes a Netflix documentary. AI-narrated story of your journey.',
    color: 'purple',
    path: '/memories',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-dark-900">
      {/* 3D Globe Background */}
      <Globe />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900/80 via-transparent to-dark-900 z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark-900/60 via-transparent to-dark-900/60 z-10 pointer-events-none" />

      {/* Content */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-8 py-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-white">
              Wander<span className="text-primary-400">Forge</span>
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </motion.div>
        </nav>

        {/* Hero Section */}
        <motion.main
          className="flex-1 flex flex-col items-center justify-center px-8 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              AI-Powered Travel Companion
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-display font-bold text-white max-w-4xl leading-tight mb-6"
          >
            Forge Your{' '}
            <span className="gradient-text">Perfect Journey</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl text-dark-300 max-w-2xl mb-8 leading-relaxed"
          >
            From chaotic group chats to cinematic memories. WanderForge transforms
            every trip into an intelligent, safe, and unforgettable adventure.
          </motion.p>

          <motion.div variants={itemVariants} className="flex gap-4 mb-16">
            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-5 h-5" />}
              onClick={() => navigate('/dashboard')}
              glow
            >
              Start Your Trail
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigate('/signal-cleanse')}>
              Try Signal-Cleanse
            </Button>
          </motion.div>

          {/* Story Hook */}
          <motion.div
            variants={itemVariants}
            className="glass-card px-8 py-6 max-w-3xl mb-16"
          >
            <p className="text-dark-300 italic text-lg leading-relaxed">
              "4 friends. 847 WhatsApp messages. 35 browser tabs. One trip to Hampi.
              When Priya got separated at the ruins, no one noticed for 2 hours.
              The 2000 photos? Still in a forgotten Google Drive folder."
            </p>
            <p className="text-primary-400 font-semibold mt-4">
              What if AI could turn that chaos into magic?
            </p>
          </motion.div>
        </motion.main>

        {/* Features Section */}
        <motion.section
          className="px-8 pb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-display font-bold text-center text-white mb-4">
            Four Engines, One Mission
          </h2>
          <p className="text-dark-400 text-center mb-12 max-w-xl mx-auto">
            Every feature designed to solve a real travel pain point
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  color={feature.color}
                  onClick={() => navigate(feature.path)}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="border-t border-dark-800 px-8 py-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <p className="text-dark-500 text-sm">
              Built by <span className="text-primary-400 font-semibold">Team ForgeX</span> | Whackiest'25
            </p>
            <div className="flex items-center gap-6 text-dark-500 text-sm">
              <span>Yashas N</span>
              <span>Naveen G P</span>
              <span>Jeeth K</span>
              <span>Shrajan Prabhu</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
