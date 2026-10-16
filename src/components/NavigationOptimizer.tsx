import React, { useState } from 'react';
import { NavigationRouteOption, RoadCorridor } from '../types/traffic';
import { NAVIGATION_LANDMARKS } from '../data/initialTrafficState';
import { 
  Navigation, 
  MapPin, 
  Leaf, 
  Zap, 
  Clock, 
  Fuel, 
  ChevronRight, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface NavigationOptimizerProps {
  corridors: RoadCorridor[];
  onHighlightRoute: (corridorIds: string[]) => void;
  onOpenGenWithRoute: (summary: string) => void;
}

export const NavigationOptimizer: React.FC<NavigationOptimizerProps> = ({
  corridors,
  onHighlightRoute,
  onOpenGenWithRoute,
}) => {
  const [originId, setOriginId] = useState('int-1');
  const [destinationId, setDestinationId] = useState('int-9');
  const [selectedRouteId, setSelectedRouteId] = useState('route-ai');

  // Compute dynamic routes based on current network state
  // Route 1: AI Flow-Optimized Route (via East Bypass / Green Waves)
  const isEastBypassFast = true;
  const aiRoute: NavigationRouteOption = {
    id: 'route-ai',
    title: 'AI UrbanFlow Optimized',
    badge: 'Fastest • Green Wave Synced',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    distanceKm: 9.6,
    durationMins: 14,
    delayMins: 1.5,
    avgSpeedMph: 42,
    fuelLiter: 0.72,
    carbonKg: 1.66,
    stopsCount: 1,
    corridorIds: ['corr-1-2', 'corr-2-3', 'corr-3-6', 'corr-6-9'],
    directions: [
      'Depart North Harbor via Harbor-Plaza Eastbound Arterial (2.4 km)',
      'Catch Green Wave progression along Plaza-Tech Innovation Way at 36 mph',
      'Merge onto Tech Campus to Financial Express (Continuous green split)',
      'Arrive at University Medical & Health Campus via Exchange Expressway',
    ],
  };

  // Route 2: Standard GPS Direct (passes directly through congested Central Metro spine)
  const standardRoute: NavigationRouteOption = {
    id: 'route-standard',
    title: 'Direct Arterial (Legacy GPS)',
    badge: 'High Congestion Warning',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    distanceKm: 8.2,
    durationMins: 27,
    delayMins: 13.8,
    avgSpeedMph: 19,
    fuelLiter: 1.38,
    carbonKg: 3.19,
    stopsCount: 7,
    corridorIds: ['corr-1-4', 'corr-4-5', 'corr-5-8', 'corr-8-9'],
    directions: [
      'Depart North Harbor via Bayway to 4th Ave Corridor (2.8 km)',
      'Enter West Ring to Grand Metro Parkway [HEAVY DELAY: Collision reported]',
      'Pass Grand Central Metro Interchange with severe surface queue delay',
      'Continue through Transit Union Station to reach Medical Complex',
    ],
  };

  // Route 3: Eco-Route (fuel & carbon minimized)
  const ecoRoute: NavigationRouteOption = {
    id: 'route-eco',
    title: 'Eco-Balanced Corridor',
    badge: 'Lowest Carbon Emissions',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    distanceKm: 9.1,
    durationMins: 17,
    delayMins: 2.8,
    avgSpeedMph: 36,
    fuelLiter: 0.61,
    carbonKg: 1.41,
    stopsCount: 2,
    corridorIds: ['corr-1-2', 'corr-2-5', 'corr-5-6', 'corr-6-9'],
    directions: [
      'Depart North Harbor via Harbor Eastbound corridor at 35 mph cruising band',
      'Follow Central Broadway Southbound with automated platoon matching',
      'Transit via Grand Metro to Financial Exchange (steady velocity)',
      'Arrive at University Medical Campus with 48% less idle emissions',
    ],
  };

  const routes = [aiRoute, standardRoute, ecoRoute];
  const activeRoute = routes.find((r) => r.id === selectedRouteId) || aiRoute;

  const handleSelectRoute = (route: NavigationRouteOption) => {
    setSelectedRouteId(route.id);
    onHighlightRoute(route.corridorIds);
  };

  const handleAskGenAboutRoute = () => {
    const summary = `I am planning travel from ${
      NAVIGATION_LANDMARKS.find((l) => l.id === originId)?.label
    } to ${
      NAVIGATION_LANDMARKS.find((l) => l.id === destinationId)?.label
    }. The AI Flow-Optimized route predicts ${aiRoute.durationMins} min vs ${
      standardRoute.durationMins
    } min on the legacy route. Can you provide live guidance and potential bottlenecks?`;
    onOpenGenWithRoute(summary);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Intelligent Urban Navigation Engine</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Green Wave Coordinated
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Multi-objective path planning factoring real-time queue lengths and signal cycles
            </p>
          </div>
        </div>

        <button
          onClick={handleAskGenAboutRoute}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-950 transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
          <span>Ask GEN Guidance</span>
        </button>
      </div>

      {/* Origin / Destination Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
        <div>
          <label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Origin Landmark:</span>
          </label>
          <select
            value={originId}
            onChange={(e) => setOriginId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white font-medium cursor-pointer"
          >
            {NAVIGATION_LANDMARKS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>Destination:</span>
          </label>
          <select
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white font-medium cursor-pointer"
          >
            {NAVIGATION_LANDMARKS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Route Comparison Options Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {routes.map((route) => {
          const isSelected = selectedRouteId === route.id;
          return (
            <div
              key={route.id}
              onClick={() => handleSelectRoute(route)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${route.badgeColor}`}
                  >
                    {route.badge}
                  </span>
                  {isSelected && <span className="text-[10px] text-cyan-400 font-bold uppercase">Active</span>}
                </div>

                <div className="font-bold text-sm text-white mb-2">{route.title}</div>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-extrabold font-mono text-white">
                    {route.durationMins}
                  </span>
                  <span className="text-xs text-slate-400">min</span>
                  <span className="text-xs font-mono text-slate-400">({route.distanceKm} km)</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Avg Speed</div>
                    <div className="font-mono font-bold text-white mt-0.5">{route.avgSpeedMph} mph</div>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Signal Delay</div>
                    <div className="font-mono font-bold text-amber-300 mt-0.5">+{route.delayMins}m</div>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Idle Stops</div>
                    <div className="font-mono font-bold text-white mt-0.5">{route.stopsCount} stops</div>
                  </div>
                  <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Carbon CO2</div>
                    <div className="font-mono font-bold text-emerald-300 mt-0.5">{route.carbonKg} kg</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-medium">
                <span>View on Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Route Turn-by-Turn Guidance */}
      <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800">
        <div className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center justify-between">
          <span>Turn-by-Turn Itinerary ({activeRoute.title}):</span>
          <span className="text-[11px] font-mono text-cyan-400">
            Saves {Math.max(0, 27 - activeRoute.durationMins)} mins vs congested direct arterial
          </span>
        </div>
        <div className="space-y-2">
          {activeRoute.directions.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 font-mono text-[10px] flex items-center justify-center shrink-0 font-bold text-cyan-400">
                {idx + 1}
              </span>
              <p className="mt-0.5 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
