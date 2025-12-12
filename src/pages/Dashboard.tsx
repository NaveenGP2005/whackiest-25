import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Shield,
  Map,
  Film,
  Users,
  Calendar,
  Bell,
  Sparkles,
  ChevronRight,
  Compass,
} from 'lucide-react';
import Button from '../components/ui/Button';
import { StatsCard } from '../components/ui/Card';

const quickActions = [
  {
    icon: Compass,
    title: 'Trip Planner',
    subtitle: 'AI-powered planning',
    color: 'from-amber-500 to-orange-600',
    path: '/trip-planner',
    isNew: true,
  },
  {
    icon: MessageSquare,
    title: 'Signal-Cleanse',
    subtitle: 'Parse group chat',
    color: 'from-primary-500 to-primary-600',
    path: '/signal-cleanse',
  },
  {
    icon: Shield,
    title: 'Safety Sentinel',
    subtitle: 'Monitor group',
    color: 'from-emerald-500 to-emerald-600',
    path: '/safety',
  },
  {
    icon: Map,
    title: 'Elastic Itinerary',
    subtitle: 'Plan your day',
    color: 'from-secondary-500 to-secondary-600',
    path: '/itinerary',
  },
  {
    icon: Film,
    title: 'Cinematic Memories',
    subtitle: 'Create story',
    color: 'from-purple-500 to-purple-600',
    path: '/memories',
  },
];

const recentTrips = [
  {
    name: 'Hampi Adventure',
    date: 'Dec 15-18, 2024',
    members: 4,
    status: 'Planning',
    color: 'primary',
  },
  {
    name: 'Goa Weekend',
    date: 'Dec 22-24, 2024',
    members: 6,
    status: 'Confirmed',
    color: 'green',
  },
  {
    name: 'Kerala Backwaters',
    date: 'Jan 5-10, 2025',
    members: 5,
    status: 'Draft',
    color: 'secondary',
  },
];

const alerts = [
  {
    type: 'info',
    message: 'Hampi trip: Weather forecast updated - clear skies expected',
    time: '2 hours ago',
  },
  {
    type: 'warning',
    message: 'Goa trip: High crowd expected at Baga Beach on Saturday',
    time: '5 hours ago',
  },
  {
    type: 'success',
    message: 'All team members confirmed for Hampi trip!',
    time: '1 day ago',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation */}
      <nav className="border-b border-dark-800 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-white">
                Wander<span className="text-primary-400">Forge</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                YN
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Welcome back, Yashas
          </h1>
          <p className="text-dark-400">
            Ready to forge your next adventure?
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <StatsCard
            value="3"
            label="Active Trips"
            icon={<Map className="w-6 h-6" />}
            trend="up"
            trendValue="+1 this week"
          />
          <StatsCard
            value="12"
            label="Team Members"
            icon={<Users className="w-6 h-6" />}
          />
          <StatsCard
            value="847"
            label="Messages Parsed"
            icon={<MessageSquare className="w-6 h-6" />}
            trend="up"
            trendValue="Signal-Cleanse"
          />
          <StatsCard
            value="100%"
            label="Safety Score"
            icon={<Shield className="w-6 h-6" />}
            trend="up"
            trendValue="All clear"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <h2 className="text-xl font-display font-semibold text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <motion.div
                  key={action.title}
                  className={`glass-card p-5 cursor-pointer group relative ${
                    'isNew' in action && action.isNew ? 'ring-2 ring-amber-500/50' : ''
                  }`}
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.path)}
                >
                  {'isNew' in action && action.isNew && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-500 text-xs font-bold text-dark-900 rounded-full">
                      NEW
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-white mb-1">
                    {action.title}
                  </h3>
                  <p className="text-dark-400 text-sm">{action.subtitle}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-display font-semibold text-white mb-4">
              Recent Alerts
            </h2>
            <div className="glass-card p-4 space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-dark-800/50 hover:bg-dark-700/50 transition-colors cursor-pointer"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'warning' ? 'bg-amber-500' :
                    alert.type === 'success' ? 'bg-emerald-500' :
                    'bg-primary-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-dark-200 text-sm">{alert.message}</p>
                    <p className="text-dark-500 text-xs mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Trips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold text-white">
              Your Trips
            </h2>
            <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />}>
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentTrips.map((trip) => (
              <motion.div
                key={trip.name}
                className="glass-card p-5 cursor-pointer group"
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    trip.status === 'Planning' ? 'bg-primary-500/20 text-primary-400' :
                    trip.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-dark-700 text-dark-400'
                  }`}>
                    {trip.status}
                  </div>
                  <ChevronRight className="w-5 h-5 text-dark-500 group-hover:text-primary-400 transition-colors" />
                </div>

                <h3 className="font-display font-semibold text-white text-lg mb-3">
                  {trip.name}
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-dark-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    {trip.date}
                  </div>
                  <div className="flex items-center gap-2 text-dark-400 text-sm">
                    <Users className="w-4 h-4" />
                    {trip.members} members
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 glass-card p-8 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/20"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">
                Try Signal-Cleanse Now
              </h3>
              <p className="text-dark-300">
                Paste your chaotic group chat and watch AI extract the signal from the noise.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              icon={<MessageSquare className="w-5 h-5" />}
              iconPosition="left"
              onClick={() => navigate('/signal-cleanse')}
            >
              Parse Chat
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
