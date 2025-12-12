// Trip Planner Page - Direct trip planning with AI recommendations
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Map,
  Sparkles,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  Wallet,
  Clock,
  ChevronRight,
  RotateCcw,
  Shield,
} from 'lucide-react';
import Button from '../components/ui/Button';
import {
  RegionInput,
  DateRangePicker,
  BudgetSlider,
  InterestSelector,
  PlaceSearchBox,
  SelectedPlacesList,
  AISuggestionChips,
  RecommendationPanel,
} from '../components/trip-planner';
import { useTripPlannerStore } from '../stores/trip-planner.store';
import { TRAVEL_MODE_CONFIG } from '../services/itinerary/direct-input.types';

export default function TripPlanner() {
  const navigate = useNavigate();
  const store = useTripPlannerStore();

  // Get specific values for dependency tracking
  const region = useTripPlannerStore((state) => state.region);
  const interests = useTripPlannerStore((state) => state.interests);
  const loadPopularPlaces = useTripPlannerStore((state) => state.loadPopularPlaces);

  // Load popular places when region changes
  useEffect(() => {
    if (region && region.length >= 3) {
      loadPopularPlaces();
    }
  }, [region, interests, loadPopularPlaces]);

  // Calculate if can generate
  const canGenerate =
    store.region &&
    store.startDate &&
    store.endDate &&
    store.selectedPlaces.length > 0;

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation */}
      <nav className="border-b border-dark-800 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-display font-bold text-white">Trip Planner</h1>
                  <p className="text-dark-400 text-sm">AI-powered itinerary generator</p>
                </div>
              </div>
            </div>

            {store.stage !== 'planning' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={store.goToPlanning}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Edit Trip
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* ==================== PLANNING STAGE ==================== */}
          {store.stage === 'planning' && (
            <motion.div
              key="planning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Hero Section */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20
                             border border-primary-500/30 rounded-full text-primary-400 mb-4"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">AI-Powered Planning</span>
                </motion.div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">
                  Plan Your Perfect Trip
                </h2>
                <p className="text-dark-400 max-w-lg mx-auto">
                  Tell us where you want to go and what you're interested in.
                  Our AI will suggest amazing places and create the perfect itinerary.
                </p>
              </div>

              {/* Main Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary-400" />
                      Destination & Dates
                    </h3>

                    <div className="space-y-5">
                      {/* Region Input */}
                      <RegionInput
                        value={store.region}
                        suggestions={store.regionSuggestions}
                        isLoading={store.isLoadingRegionSuggestions}
                        onChange={store.setRegion}
                        onSelectSuggestion={store.selectRegionSuggestion}
                      />

                      {/* Date Range */}
                      <DateRangePicker
                        startDate={store.startDate}
                        endDate={store.endDate}
                        onChange={store.setDates}
                      />
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary-400" />
                      Budget & Pace
                    </h3>

                    <div className="space-y-5">
                      {/* Budget */}
                      <BudgetSlider
                        budget={store.budget}
                        onChange={store.setBudget}
                      />

                      {/* Travel Mode */}
                      <div>
                        <label className="block text-dark-300 text-sm font-medium mb-2">
                          Trip Pace
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['relaxed', 'moderate', 'packed'] as const).map((mode) => {
                            const config = TRAVEL_MODE_CONFIG[mode];
                            return (
                              <button
                                key={mode}
                                onClick={() => store.setTravelMode(mode)}
                                className={`p-3 rounded-xl text-center transition-all ${
                                  store.travelMode === mode
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                                }`}
                              >
                                <span className="block font-medium">{config.label}</span>
                                <span className="block text-xs opacity-70 mt-1">
                                  {config.activitiesPerDay} activities/day
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Interests & Places */}
                <div className="space-y-6">
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary-400" />
                      Interests
                    </h3>

                    <InterestSelector
                      selected={store.interests}
                      customInterests={store.customInterests}
                      onToggle={store.toggleInterest}
                      onAddCustom={store.addCustomInterest}
                      onRemoveCustom={store.removeCustomInterest}
                    />
                  </div>

                  <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary-400" />
                      Places to Visit
                    </h3>

                    {/* Place Search */}
                    <PlaceSearchBox
                      query={store.searchQuery}
                      results={store.searchResults}
                      isSearching={store.isSearching}
                      disabled={!store.region}
                      onSearch={store.searchPlaces}
                      onSelectPlace={store.addPlaceFromSuggestion}
                    />

                    {/* AI Suggestions */}
                    <AISuggestionChips
                      suggestions={store.aiSuggestedPlaces}
                      isLoading={store.isLoadingAISuggestions}
                      onAccept={store.acceptAISuggestion}
                      onDismiss={store.dismissAISuggestion}
                    />

                    {/* Selected Places */}
                    <div className="mt-6">
                      <SelectedPlacesList
                        places={store.selectedPlaces}
                        onRemove={store.removePlace}
                        onToggleMustVisit={store.toggleMustVisit}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {store.generationError && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400">{store.generationError}</p>
                </motion.div>
              )}

              {/* Generate Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center pt-4"
              >
                <Button
                  variant="primary"
                  size="lg"
                  onClick={store.generateItinerary}
                  disabled={!canGenerate}
                  className="px-8"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate My Itinerary
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>

              {!canGenerate && (
                <p className="text-center text-dark-500 text-sm">
                  {!store.region
                    ? 'Enter a destination to continue'
                    : !store.startDate || !store.endDate
                    ? 'Select your travel dates'
                    : 'Add at least one place to visit'}
                </p>
              )}
            </motion.div>
          )}

          {/* ==================== GENERATING STAGE ==================== */}
          {store.stage === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="text-center max-w-md">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary-500/20 flex items-center justify-center"
                >
                  <Loader2 className="w-8 h-8 text-primary-400" />
                </motion.div>

                <h2 className="text-2xl font-display font-bold text-white mb-2">
                  Creating Your Itinerary
                </h2>
                <p className="text-dark-400 mb-6">
                  Our AI is researching places and optimizing your route...
                </p>

                {/* Progress */}
                {store.generationProgress && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-dark-400">
                        Researching {store.generationProgress.currentPlace || 'places'}...
                      </span>
                      <span className="text-primary-400">
                        {store.generationProgress.completed}/{store.generationProgress.total}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary-500"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${
                            (store.generationProgress.completed / store.generationProgress.total) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== RESULT STAGE ==================== */}
          {store.stage === 'result' && store.generatedItinerary && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Trip Summary Header */}
              {store.tripSummary && (
                <div className="text-center mb-8">
                  <motion.h2
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-display font-bold text-white mb-2"
                  >
                    {store.tripSummary.title}
                  </motion.h2>
                  <p className="text-primary-400 font-medium mb-2">
                    {store.tripSummary.tagline}
                  </p>
                  <p className="text-dark-400 max-w-2xl mx-auto">
                    {store.tripSummary.summary}
                  </p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  {
                    icon: Calendar,
                    label: 'Duration',
                    value: `${store.generatedItinerary.summary.totalDays} days`,
                  },
                  {
                    icon: MapPin,
                    label: 'Places',
                    value: `${store.generatedItinerary.summary.placesVisited} places`,
                  },
                  {
                    icon: Wallet,
                    label: 'Est. Cost',
                    value: `₹${store.generatedItinerary.summary.totalCost.toLocaleString()}`,
                  },
                  {
                    icon: Map,
                    label: 'Distance',
                    value: `${store.generatedItinerary.summary.distanceTraveled.toFixed(1)} km`,
                  },
                ].map(({ icon: Icon, label, value }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass-card p-4 text-center"
                  >
                    <Icon className="w-6 h-6 text-primary-400 mx-auto mb-2" />
                    <p className="text-dark-400 text-sm">{label}</p>
                    <p className="text-white font-semibold">{value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Itinerary Days */}
              <div className="space-y-6">
                {store.generatedItinerary.days.map((day, dayIndex) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dayIndex * 0.1 }}
                    className="glass-card overflow-hidden"
                  >
                    {/* Day Header */}
                    <div className="p-4 bg-dark-800/50 border-b border-dark-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-semibold text-white">
                            Day {day.day}
                          </h3>
                          <p className="text-dark-400 text-sm">
                            {new Date(day.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-dark-400">
                          <span>{day.activities.filter((a) => a.type === 'visit').length} activities</span>
                          <span>₹{day.totalCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Activities */}
                    <div className="p-4 space-y-3">
                      {day.activities
                        .filter((a) => a.type === 'visit')
                        .map((activity, actIndex) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-4 p-3 bg-dark-800/50 rounded-xl"
                          >
                            {/* Time */}
                            <div className="text-center min-w-[60px]">
                              <p className="text-primary-400 font-medium">
                                {activity.startTime}
                              </p>
                              <p className="text-dark-500 text-xs">
                                {activity.duration} min
                              </p>
                            </div>

                            {/* Activity Info */}
                            <div className="flex-1">
                              <h4 className="font-medium text-white">
                                {activity.place.name}
                              </h4>
                              {activity.bestTimeReason && (
                                <p className="text-dark-400 text-sm mt-0.5">
                                  {activity.bestTimeReason}
                                </p>
                              )}
                            </div>

                            {/* Travel from prev */}
                            {activity.travelFromPrev && (
                              <div className="text-xs text-dark-500 text-right">
                                <p>{activity.travelFromPrev.distance.toFixed(1)} km</p>
                                <p>{activity.travelFromPrev.duration} min</p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Missed Recommendations */}
              <RecommendationPanel
                recommendations={store.missedRecommendations}
                isLoading={store.isLoadingMissedRecommendations}
                onAccept={store.acceptMissedRecommendation}
                onReject={store.rejectMissedRecommendation}
                onRegenerate={store.regenerateWithAccepted}
              />

              {/* View Full Itinerary Button */}
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/itinerary')}
                >
                  <Map className="w-4 h-4 mr-2" />
                  View Full Map & Details
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate('/safety')}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Activate Safety
                </Button>
                <Button variant="ghost" onClick={store.goToPlanning}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Plan Another Trip
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
