# UrbanFlow AI — Real-Time Urban Traffic Data Analysis & Flow Optimization

An intelligent urban traffic management and navigation optimization platform designed to analyze real-time urban telemetry, minimize intersection queuing delays via adaptive Webster timing formulations, coordinate arterial Green Waves, dispatch emergency clearance, and assist motorists via **GEN**, an AI traffic co-pilot powered by Gemini 3.8 Flash.

---

## 🌟 Key Modules & Capabilities

1. **Interactive Real-Time Vector Traffic Grid**:
   - Vector canvas visualization covering 9 major urban intersections, 12 arterial corridors, and metropolitan bypasses.
   - Live simulated vehicle tracking (passenger cars, public transit buses, logistics delivery trucks, and emergency responders).
   - Real-time Highway Capacity Manual (HCM 2022) Level of Service (LOS A through F) dynamic color coding.
   - Approach queue indicators, speed limits, and synthetic optical CCTV surveillance feeds.

2. **Adaptive Signal Timing Optimization (Webster's Model)**:
   - Dynamic cycle length calculation:
     $$C_{opt} = \frac{1.5 L + 5}{1 - Y}$$
     where $L$ is lost clearance time (12s) and $Y = \sum \frac{q_i}{s_i}$ represents critical approach flow ratios with saturation flow $s = 1900\text{ vphpl}$.
   - Proportional green split allocation eliminating unnecessary red delay on low-demand phases.
   - Emergency Vehicle Preemption (EVP): Automatic sequence clearance providing immediate green wave progression for priority responders.
   - Green Wave coordination with adjustable progression bandwidth velocities (25 to 50 mph).

3. **GEN — AI Traffic & Navigation Assistant**:
   - Built on `@google/genai` utilizing the `gemini-3.8-flash` model.
   - Server-side integration proxying all AI requests to protect credentials.
   - Grounded with real-time metropolitan corridor telemetry, active incidents, and delay predictions.
   - Interactive prompt chips and optional text-to-speech voice readout.

4. **Multi-Objective Navigation & Detour Optimizer**:
   - Compares AI Flow-Optimized Route (Green wave synchronized) vs. Legacy GPS Direct Route vs. Eco-Route.
   - Quantifies minutes saved, idle stops avoided, and fuel/carbon reduction (kg CO₂).

5. **Incident Response & Dynamic VMS Messaging**:
   - Sensor anomaly detection for collisions, stalls, and road hazards.
   - Real-time Variable Message Sign (VMS) broadcast simulation.
   - One-click incident response dispatch and recovery tracking.

6. **Urban Flow Analytics & Environmental Telemetry**:
   - Greenshields Speed-Density fundamental model:
     $$v = v_f \left(1 - \frac{k}{k_j}\right)$$
   - 24-hour demand curves (AM/PM peak demand modeling).
   - EPA-standard vehicle idle emissions calculator (0.65 L/hour idle fuel savings).

---

## 🐳 Docker Deployment Setup

UrbanFlow AI is fully containerized using a multi-stage, production-hardened `Dockerfile` on `node:20-alpine` with non-root security execution and automated container health checks.

### 1. Build and Run Container Directly
```bash
# Build the Docker image
docker build -t urbanflow-traffic:latest .

# Run the container in detached mode on port 3000
docker run -d -p 3000:3000 --name urbanflow-app urbanflow-traffic:latest

# Check container health status
curl http://localhost:3000/api/health
```

### 2. Run with Docker Compose
```bash
# Launch containerized stack with healthcheck and resource limits
docker-compose up --build -d

# Inspect live container logs
docker-compose logs -f
```

---

## 🔄 CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

The repository includes a production GitHub Actions workflow automating:
- **Lint & TypeScript Validation**: `npm run lint` (`tsc --noEmit`)
- **Asset Compilation**: `npm run build`
- **Docker Container Build**: Multi-stage build testing via Buildx
- **Container Health Probe**: Verifying `/api/health` returns `200 OK`
- **Deployment Gate**: Continuous delivery readiness for release branches

---

## 📡 Production API Endpoints

- `GET /api/health` — Container and service health check (status, uptime, memory, version).
- `POST /api/chat` — GEN AI traffic assistant dialogue engine (Gemini 3.8 Flash with live traffic context).
- `GET /api/traffic/summary` — JSON snapshot of active zones, flow rates, and carbon metrics.

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start full-stack development server (Express + Vite)
npm run dev

# 3. Verify TypeScript types
npm run lint

# 4. Create production build
npm run build
```
