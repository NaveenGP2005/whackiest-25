import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  MapPin,
  Battery,
  Wifi,
  AlertTriangle,
  CheckCircle,
  Phone,
  MessageSquare,
  Bell,
  Navigation,
  Zap,
} from 'lucide-react';
import Button from '../components/ui/Button';

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  status: 'safe' | 'warning' | 'danger';
  battery: number;
  lastSeen: string;
  location: string;
  isMoving: boolean;
  signal: number;
  angle: number; // Position on radar
  distance: number; // Distance from center
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  member?: string;
  time: string;
  isNew: boolean;
}

const initialMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Yashas',
    avatar: 'YN',
    status: 'safe',
    battery: 85,
    lastSeen: 'Now',
    location: 'Virupaksha Temple',
    isMoving: false,
    signal: 4,
    angle: 45,
    distance: 0.3,
  },
  {
    id: '2',
    name: 'Naveen',
    avatar: 'NP',
    status: 'safe',
    battery: 67,
    lastSeen: '2 min ago',
    location: 'Virupaksha Temple',
    isMoving: true,
    signal: 3,
    angle: 120,
    distance: 0.35,
  },
  {
    id: '3',
    name: 'Jeeth',
    avatar: 'JK',
    status: 'safe',
    battery: 45,
    lastSeen: '5 min ago',
    location: 'Near Temple',
    isMoving: false,
    signal: 4,
    angle: 200,
    distance: 0.4,
  },
  {
    id: '4',
    name: 'Shrajan',
    avatar: 'SP',
    status: 'safe',
    battery: 92,
    lastSeen: 'Now',
    location: 'Virupaksha Temple',
    isMoving: true,
    signal: 4,
    angle: 300,
    distance: 0.25,
  },
];

const initialAlerts: Alert[] = [
  {
    id: '1',
    type: 'info',
    title: 'Group Check',
    message: 'All 4 members are within 200m radius',
    time: 'Just now',
    isNew: true,
  },
];

export default function SafetySentinel() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [isScanning] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [simulationStep, setSimulationStep] = useState(0);

  // Simulate Priya (Jeeth) getting separated
  const runSimulation = () => {
    setSimulationStep(1);

    // Step 1: Jeeth starts moving away
    setTimeout(() => {
      setMembers(prev => prev.map(m =>
        m.id === '3' ? { ...m, distance: 0.6, status: 'safe', location: 'Moving away from group' } : m
      ));
    }, 2000);

    // Step 2: Jeeth is getting further
    setTimeout(() => {
      setMembers(prev => prev.map(m =>
        m.id === '3' ? { ...m, distance: 0.75, status: 'warning', location: 'Hemakuta Hill', lastSeen: '10 min ago' } : m
      ));
      setAlerts(prev => [{
        id: '2',
        type: 'warning',
        title: 'Distance Alert',
        message: 'Jeeth is 800m away from the group',
        member: 'Jeeth',
        time: 'Just now',
        isNew: true,
      }, ...prev]);
    }, 4000);

    // Step 3: Jeeth is stationary in remote area
    setTimeout(() => {
      setMembers(prev => prev.map(m =>
        m.id === '3' ? {
          ...m,
          distance: 0.9,
          status: 'warning',
          location: 'Remote area - Hemakuta',
          lastSeen: '25 min ago',
          battery: 23,
          isMoving: false,
          signal: 1
        } : m
      ));
      setAlerts(prev => [{
        id: '3',
        type: 'warning',
        title: 'Stationary Alert',
        message: 'Jeeth has been stationary for 15 minutes in a remote area',
        member: 'Jeeth',
        time: 'Just now',
        isNew: true,
      }, ...prev]);
    }, 6000);

    // Step 4: Critical alert
    setTimeout(() => {
      setMembers(prev => prev.map(m =>
        m.id === '3' ? {
          ...m,
          status: 'danger',
          lastSeen: '45 min ago',
          battery: 12,
          signal: 0
        } : m
      ));
      setAlerts(prev => [{
        id: '4',
        type: 'danger',
        title: 'CRITICAL: Member Unreachable',
        message: 'Jeeth has been stationary for 45 minutes with no signal. Last known location: Hemakuta Hill ruins. Immediate check recommended.',
        member: 'Jeeth',
        time: 'Just now',
        isNew: true,
      }, ...prev]);
      setSimulationStep(2);
    }, 8000);
  };

  // Reset simulation
  const resetSimulation = () => {
    setMembers(initialMembers);
    setAlerts(initialAlerts);
    setSimulationStep(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusRing = (status: string) => {
    switch (status) {
      case 'safe': return 'ring-emerald-500/50';
      case 'warning': return 'ring-amber-500/50 animate-pulse';
      case 'danger': return 'ring-red-500/50 animate-pulse';
      default: return 'ring-gray-500/50';
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Safety Sentinel</h1>
                  <p className="text-dark-400 text-sm">Guardian Mode Active</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {simulationStep === 0 && (
                <Button variant="secondary" size="sm" onClick={runSimulation}>
                  <Zap className="w-4 h-4 mr-2" />
                  Run Demo Scenario
                </Button>
              )}
              {simulationStep > 0 && (
                <Button variant="ghost" size="sm" onClick={resetSimulation}>
                  Reset Demo
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Radar Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 aspect-square relative overflow-hidden"
            >
              {/* Radar Background */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Concentric circles */}
                {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full border border-primary-500/20"
                    style={{
                      width: `${scale * 90}%`,
                      height: `${scale * 90}%`,
                    }}
                  />
                ))}

                {/* Cross lines */}
                <div className="absolute w-full h-[1px] bg-primary-500/10" />
                <div className="absolute h-full w-[1px] bg-primary-500/10" />

                {/* Scanning line */}
                {isScanning && (
                  <motion.div
                    className="absolute w-1/2 h-[2px] origin-left"
                    style={{
                      background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.8) 0%, transparent 100%)',
                      left: '50%',
                      top: '50%',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                  />
                )}

                {/* Pulse rings */}
                <AnimatePresence>
                  {isScanning && (
                    <>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute rounded-full border-2 border-emerald-500/30"
                          initial={{ width: '10%', height: '10%', opacity: 0.8 }}
                          animate={{ width: '100%', height: '100%', opacity: 0 }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 1,
                            ease: 'easeOut',
                          }}
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>

                {/* Center point */}
                <div className="absolute w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />

                {/* Team Members */}
                {members.map((member) => {
                  const x = Math.cos((member.angle * Math.PI) / 180) * member.distance * 45;
                  const y = Math.sin((member.angle * Math.PI) / 180) * member.distance * 45;

                  return (
                    <motion.div
                      key={member.id}
                      className={`absolute cursor-pointer`}
                      style={{
                        left: `calc(50% + ${x}%)`,
                        top: `calc(50% + ${y}%)`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      animate={{
                        left: `calc(50% + ${x}%)`,
                        top: `calc(50% + ${y}%)`,
                      }}
                      transition={{ duration: 1 }}
                      onClick={() => setSelectedMember(member)}
                    >
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        ${getStatusColor(member.status)} ring-4 ${getStatusRing(member.status)}
                        text-white font-bold text-sm shadow-lg
                        hover:scale-110 transition-transform
                      `}>
                        {member.avatar}
                      </div>
                      <p className="text-center text-xs text-dark-300 mt-1">{member.name}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-dark-400 text-xs">Safe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-dark-400 text-xs">Warning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-dark-400 text-xs">Danger</span>
                </div>
              </div>

              {/* Status badge */}
              <div className="absolute top-4 right-4">
                <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${
                  members.some(m => m.status === 'danger')
                    ? 'bg-red-500/20 text-red-400'
                    : members.some(m => m.status === 'warning')
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    members.some(m => m.status === 'danger')
                      ? 'bg-red-500 animate-pulse'
                      : members.some(m => m.status === 'warning')
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-emerald-500'
                  }`} />
                  <span className="text-sm font-medium">
                    {members.some(m => m.status === 'danger')
                      ? 'ALERT'
                      : members.some(m => m.status === 'warning')
                      ? 'WARNING'
                      : 'ALL CLEAR'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4"
            >
              <h3 className="font-display font-semibold text-white mb-4">Team Status</h3>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedMember?.id === member.id
                        ? 'bg-dark-700'
                        : 'bg-dark-800/50 hover:bg-dark-700/50'
                    } ${member.status === 'danger' ? 'ring-1 ring-red-500/50' : ''}`}
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${getStatusColor(member.status)} text-white font-bold text-xs
                      `}>
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-dark-100">{member.name}</p>
                          <span className="text-dark-500 text-xs">{member.lastSeen}</span>
                        </div>
                        <p className="text-dark-400 text-sm truncate">{member.location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <div className="flex items-center gap-1 text-dark-400">
                        <Battery className={`w-3 h-3 ${member.battery < 20 ? 'text-red-400' : ''}`} />
                        <span className={member.battery < 20 ? 'text-red-400' : ''}>{member.battery}%</span>
                      </div>
                      <div className="flex items-center gap-1 text-dark-400">
                        <Wifi className={`w-3 h-3 ${member.signal === 0 ? 'text-red-400' : ''}`} />
                        <span>{member.signal}/4</span>
                      </div>
                      {member.isMoving && (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <Navigation className="w-3 h-3" />
                          <span>Moving</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Alerts */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-white">Alerts</h3>
                <Bell className="w-5 h-5 text-dark-400" />
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                <AnimatePresence>
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg ${
                        alert.type === 'danger'
                          ? 'bg-red-500/10 border border-red-500/30'
                          : alert.type === 'warning'
                          ? 'bg-amber-500/10 border border-amber-500/30'
                          : 'bg-dark-800/50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {alert.type === 'danger' ? (
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        ) : alert.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`font-medium text-sm ${
                            alert.type === 'danger' ? 'text-red-400' :
                            alert.type === 'warning' ? 'text-amber-400' : 'text-dark-200'
                          }`}>
                            {alert.title}
                          </p>
                          <p className="text-dark-400 text-xs mt-1">{alert.message}</p>
                          <p className="text-dark-500 text-xs mt-1">{alert.time}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Quick Actions */}
            {members.some(m => m.status === 'danger') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-4 border border-red-500/30"
              >
                <h3 className="font-display font-semibold text-red-400 mb-3">Emergency Actions</h3>
                <div className="space-y-2">
                  <Button variant="danger" className="w-full" size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Jeeth
                  </Button>
                  <Button variant="ghost" className="w-full" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Group Alert
                  </Button>
                  <Button variant="ghost" className="w-full" size="sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    Share Last Location
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass-card p-6 bg-gradient-to-r from-emerald-500/10 to-primary-500/10"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-white mb-2">How Safety Sentinel Works</h3>
              <p className="text-dark-300 text-sm leading-relaxed">
                The AI continuously monitors your group's location, movement patterns, battery levels, and signal strength.
                It detects anomalies like: <span className="text-amber-400">prolonged inactivity in remote areas</span>,
                <span className="text-amber-400"> unusual route deviations</span>,
                <span className="text-amber-400"> group separation beyond safe distances</span>, and
                <span className="text-amber-400"> low battery in isolated zones</span>.
                Alerts trigger automatically so no one gets lost like Priya did.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
