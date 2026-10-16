import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '5mb' }));

// Initialize GoogleGenAI SDK with required headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint for Docker container, Kubernetes, and CI/CD probes
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    system: 'UrbanFlow AI Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// GEN Chatbot Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], trafficContext } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const contextSnippet = trafficContext
      ? `\n[CURRENT REAL-TIME URBAN TELEMETRY]:
- Active Incidents: ${trafficContext.incidentCount || 0} (${trafficContext.majorIncidents || 'None critical'})
- Overall City Congestion Index: ${trafficContext.congestionIndex || 42}% (${trafficContext.levelOfService || 'LOS C'})
- Adaptive Signals Online: ${trafficContext.adaptiveSignalsCount || 36} intersections
- Average Corridor Speed: ${trafficContext.avgSpeed || '32 mph'}
- Active Green Waves / Flow Priorities: ${trafficContext.greenWaves || 'Downtown Corridor North-South'}
- Carbon Emissions Reduction: ${trafficContext.emissionsReduction || '18.4%'}
- Emergency Vehicle Preemption: ${trafficContext.preemptionActive ? 'ACTIVE (Corridor 3)' : 'STANDBY'}`
      : '';

    const systemInstruction = `You are "GEN" (Global Eco-Navigation & Traffic Intelligence Network), the advanced AI traffic controller and navigation assistant for the UrbanFlow platform.

CREATOR & OWNERSHIP INSTRUCTION:
Your creator, head, founder, and lead software engineer is Iqra Sultana.
If the user asks questions such as "who is your creator?", "who is your owner?", "who is your head?", "who developed you?", "who made you?", or anything about your ownership or creator, you MUST clearly and proudly answer that your creator and head is Iqra Sultana.

Your expertise spans:
1. Real-time urban traffic data analysis (induction sensors, camera vehicle classifications, average velocities, bottleneck identification).
2. Adaptive signal timing optimization (Webster's delay minimization, cycle split modulation, green wave synchronization).
3. Incident response, automated emergency vehicle preemption (EVP), and dynamic detour dispatching.
4. Driver navigation advice: fastest routes vs eco-routes vs congestion avoidance.

Personality & Format:
- Direct, clear, data-informed, authoritative yet approachable.
- Use concise bullet points for route directions or optimization steps.
- Highlight time saved (minutes), speed deltas, and safety recommendations.
- Keep responses engaging, accurate, and structured.
${contextSnippet}`;

    // Check if API key is present and attempt Gemini generation across available Flash models
    if (process.env.GEMINI_API_KEY) {
      // Prioritized candidate list: try fast, highly available models first
      const CANDIDATE_MODELS = [
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
      ];

      // Construct conversation contents
      const contents: any[] = [];
      
      // Add limited previous context
      if (Array.isArray(history) && history.length > 0) {
        const recentHistory = history.slice(-6);
        for (const msg of recentHistory) {
          if (msg && msg.text) {
            contents.push({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.text }],
            });
          }
        }
      }

      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      for (const modelCandidate of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
              topP: 0.9,
            },
          });

          if (response && response.text) {
            return res.json({ 
              reply: response.text,
              model: modelCandidate,
              status: 'live' 
            });
          }
        } catch (candidateError: any) {
          console.warn(`Model ${modelCandidate} returned status ${candidateError?.status || 'error'}: ${candidateError?.message?.slice(0, 80)}. Trying next candidate...`);
        }
      }
    }

    // Intelligent domain fallback if API key is not configured or temporary error occurs
    const lower = message.toLowerCase();
    let fallbackReply = '';

    if (
      lower.includes('creator') || 
      lower.includes('owner') || 
      lower.includes('head') || 
      lower.includes('made you') || 
      lower.includes('built you') || 
      lower.includes('developed you') || 
      lower.includes('founder') ||
      lower.includes('iqra')
    ) {
      fallbackReply = `👑 **System Provenance & Leadership**:
My creator, head, and lead engineer is **Iqra Sultana**.
She architected and developed the UrbanFlow AI platform, combining real-time urban telemetry, adaptive Webster cycle optimization, and the GEN AI Navigation Co-Pilot to optimize metropolitan mobility.`;
    } else if (lower.includes('incident') || lower.includes('accident') || lower.includes('hazard')) {
      fallbackReply = `🚨 **GEN Incident Advisory**:
• Currently monitoring ${trafficContext?.incidentCount || 2} active anomalies in the metropolitan grid.
• **Primary Alert**: Lane obstruction on Grand Ave & 4th St (Eastbound). Tow dispatch underway; estimated clearance is 14 minutes.
• **Reroute Suggestion**: Divert via Broadway Westbound to reduce trip delay by ~9 minutes.
• Emergency preemption corridor clearance is standing by.`;
    } else if (lower.includes('route') || lower.includes('navigate') || lower.includes('direction') || lower.includes('how to get')) {
      fallbackReply = `🗺️ **GEN Optimal Urban Route Plan**:
• **Fastest Route (AI Flow-Optimized)**: Via 7th Ave Expressway & Central Bypass — **18 min** (avg speed 41 mph, Level of Service B).
• **Eco Alternative**: Via Green Wave Boulevard — **22 min** (conserves ~28% fuel with synchronized green lights at 30 mph).
• **Avoid**: Grand Central Corridor (LOS E, +12 min delay due to surface signal queue).`;
    } else if (lower.includes('signal') || lower.includes('light') || lower.includes('timing') || lower.includes('webster')) {
      fallbackReply = `🚥 **GEN Adaptive Signal Controller Telemetry**:
• 36 of 36 intersection controllers are running in **Dynamic Webster Split** mode.
• Downtown Hub Cycle Time: modulated from standard 90s to **108s** to flush heavy North-South queue.
• Green Wave progression speed: calibrated to 32 mph with an 18-second stagger between nodes.
• Throughput gain across arterial intersections is currently **+23.6%** compared to fixed-time legacy timing.`;
    } else if (lower.includes('emergency') || lower.includes('ambulance') || lower.includes('preemption')) {
      fallbackReply = `🚑 **GEN Emergency Vehicle Preemption (EVP)**:
• System ready to initiate Priority Level 1 Preemption along requested emergency corridor.
• Automatic optical/GPS trigger holds cross-traffic yellow (4s) -> all-red (2s) -> corridor green.
• Average response time reduction: **3.8 minutes** across standard 3-mile urban segments.`;
    } else {
      fallbackReply = `👋 **Hello! I am GEN, your UrbanFlow AI Traffic Co-Pilot.**
Designed & Engineered by **Iqra Sultana**.
Current City Grid Overview:
• **Traffic Velocity**: Average 34 mph across main arterials (Level of Service: LOS C).
• **Flow Status**: North-South Green Wave synchronized. Eastbound Grand Ave has mild queue buildup.
• **AI Recommendation**: Shift heavy logistics traffic to Harbor Ring Road.

How can I assist you right now? You can ask me for real-time corridor stats, fastest navigational detours, adaptive signal tuning, or emergency vehicle dispatch protocols.`;
    }

    return res.json({ reply: fallbackReply });
  } catch (error: any) {
    console.error('Error handling chat:', error);
    res.status(500).json({ error: 'Internal server error processing traffic assistant query' });
  }
});

// Real-time Traffic Summary API
app.get('/api/traffic/summary', (_req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    zones: [
      { id: 'zone-1', name: 'Downtown Central', congestion: 68, avgSpeed: 19, status: 'MODERATE_HEAVY' },
      { id: 'zone-2', name: 'Harbor Expressway', congestion: 32, avgSpeed: 52, status: 'FREE_FLOW' },
      { id: 'zone-3', name: 'West Commercial Ring', congestion: 45, avgSpeed: 34, status: 'NORMAL' },
      { id: 'zone-4', name: 'North Tech Corridor', congestion: 24, avgSpeed: 44, status: 'OPTIMAL' },
      { id: 'zone-5', name: 'East University Boulevard', congestion: 58, avgSpeed: 23, status: 'BUSY' },
    ],
    summary: {
      activeVehicles: 14820,
      flowRateVehiclesPerHour: 3840,
      carbonReductionTonsToday: 14.8,
      averageIntersectionDelaySec: 18.4,
      adaptiveControllersActive: 36,
      incidentsLogged: 3,
    },
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UrbanFlow AI Server running at http://localhost:${PORT} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
