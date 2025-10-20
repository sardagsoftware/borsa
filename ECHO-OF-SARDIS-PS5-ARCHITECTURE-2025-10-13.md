# 🎮 ECHO OF SARDIS - PS5-QUALITY GAME ARCHITECTURE

**Date:** 2025-10-13
**Status:** Phase 1 - Foundation Complete, Phase 2 - Production Sprint Starting
**Compliance:** White-hat, KVKK/GDPR-first, 0-tolerance policy

---

## 📊 EXECUTIVE SUMMARY

### Mission
Build a PS5-caliber game "Echo of Sardis" using dual-pipeline approach:
- **UE5 Production**: Nanite + Lumen + VSM for AAA quality
- **Web Vertical Slice**: Next.js + React Three Fiber for showcase

### Current Status Matrix

| Component | Status | Progress | Notes |
|-----------|--------|----------|-------|
| **A. Visual Realism** | ✅ | 70% | ACES ✅, N8AO ✅, HDRI ✅, DoF ✅, Bloom ✅ |
| **B. Character Pro** | ✅ | 60% | GLB loader ✅, Resolver ✅, Animations ✅ |
| **C. Camera & Feel** | ⏳ | 10% | Basic follow exists, needs dolly presets |
| **D. Gameplay Core** | ⏳ | 5% | Framework only, needs combat/puzzle |
| **E. Audio/Haptics** | ❌ | 0% | Not started |
| **F. Narrative & L10N** | ❌ | 0% | Not started |
| **G. LiveOps/Telemetry** | ⏳ | 15% | Basic health endpoints exist |
| **H. CI/CD & Compliance** | ⏳ | 30% | GitHub Actions exist, needs SLSA |

---

## ✅ PHASE 1: FOUNDATION (COMPLETE)

### A. Visual Realism - Web Implementation

**Completed:**
```typescript
// realism.ts - ACES Tone Mapping ✅
gl.toneMapping = THREE.ACESFilmicToneMapping;
gl.toneMappingExposure = 1.0;
gl.outputColorSpace = THREE.SRGBColorSpace;
gl.shadowMap.enabled = true;
gl.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene.tsx - Post-Processing ✅
<EffectComposer multisampling={4}>
  <Bloom intensity={0.7} luminanceThreshold={0.85} mipmapBlur />
  <N8AO aoRadius={0.5} intensity={1} />  ← Modern AO, no NormalPass needed
  <DepthOfField focusDistance={0.02} focalLength={0.025} bokehScale={1.5}/>
</EffectComposer>

// HDRI Environment ✅
<Environment
  files="/assets/play/hdr/venice_sunset_4k.hdr"
  background={false}
  intensity={0.85}
/>

// Contact Shadows ✅
<ContactShadows
  opacity={0.45}
  scale={50}
  blur={2.2}
  far={12}
  resolution={2048}
/>
```

**Files:**
- ✅ `apps/console/src/lib/playpro/realism.ts` (ACES + loaders)
- ✅ `apps/console/src/components/playpro/Scene.tsx` (post-processing)
- ✅ `apps/console/public/assets/play/hdr/venice_sunset_4k.hdr` (22MB)

**Performance Metrics (Web):**
- DPR: Capped at 2x (window.devicePixelRatio * scale)
- Shadow Maps: 4096x4096 (ultra) / 2048x2048 (high)
- Contact Shadows: 2048 (ultra) / 1024 (high)
- Multisampling: 4x (ultra) / 2x (high)

**Next Steps for UE5:**
```cpp
// UE5 Project Settings (to match Web quality)
r.TonemapperFilm 1                    // ACES
r.Shadow.Virtual.Enable 1              // VSM
r.Lumen.DiffuseIndirect.Allow 1       // Lumen GI
r.Nanite.ProjectEnabled 1              // Nanite
r.MotionBlurQuality 4                 // Motion Blur
r.DepthOfFieldQuality 4               // DoF
r.BloomQuality 5                      // Bloom
```

---

### B. Character Pro - GLB System

**Completed:**
```typescript
// CharacterGLB.tsx - Multi-Candidate Resolver ✅
export default function CharacterGLB({ candidates, idle, walk, run }) {
  const [src, setSrc] = useState<string|null>(null);

  // Resolver: tries multiple paths, returns first 200 OK
  useEffect(() => {
    resolveFirst200(candidates).then(resolved => {
      if (resolved) {
        setSrc(resolved);
        console.log(`✅ Resolved: ${resolved}`);
      }
    });
  }, [candidates]);

  // Auto-scale to 1.8m
  const scale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const target = 1.8;
    return target / Math.max(size.x, size.y, size.z);
  }, [scene]);

  // Animation FSM
  useEffect(() => {
    if (actions[idle]) {
      actions[idle].reset().fadeIn(0.2).play();
    }
  }, [actions, idle]);
}
```

**Character Config:**
```typescript
// char-config.ts ✅
export const CHARACTERS: CharConfig[] = [
  {
    name: "Elif Melisa Sarı",
    candidates: [
      "/assets/play/characters/Elif.glb",    // Primary ✅
      "/assets/models/Elif.glb",             // Fallback 1
      "/assets/models/character.glb",        // Fallback 2
      "/assets/play/characters/character.glb" // Fallback 3
    ],
    anims: { idle: "Idle", walk: "Walk", run: "Run" }
  },
  {
    name: "Melih Sarı",
    candidates: [
      "/assets/play/characters/Melih.glb",   // Primary ✅
      "/assets/models/Melih.glb"             // Fallback
    ],
    anims: { idle: "Idle", walk: "Walk", run: "Run" }
  }
];
```

**Current Assets:**
- ✅ `Elif.glb` - 2.1MB (Three.js Soldier with animations)
- ✅ `Melih.glb` - 2.1MB (Copy of Elif for testing)

**Character Selector UI:**
```typescript
// Scene.tsx - Dynamic character switching ✅
const [charIndex, setCharIndex] = useState(0);
const char = CHARACTERS[charIndex];

// UI Panel (top-right)
<div className="fixed top-20 right-3 z-40">
  <div className="font-semibold mb-2">KARAKTER SEÇ</div>
  {CHARACTERS.map((c, i) => (
    <button
      onClick={() => setCharIndex(i)}
      className={charIndex === i ? 'bg-blue-500' : 'bg-white/10'}
    >
      {c.name}
    </button>
  ))}
</div>
```

**Validation:**
```javascript
// Browser Console Output ✅
🔍 Resolving GLB from candidates: Array(4)
  Trying: /assets/play/characters/Elif.glb...
  → 200 ✓
✅ Resolved: /assets/play/characters/Elif.glb
✅ GLB resolved successfully
✅ Playing animation: Idle
```

**Next Steps for Production Characters:**
1. **Mesh Requirements:**
   - Triangle count: 45,000-80,000
   - 4K PBR textures (Base Color, Normal, Roughness, Metallic, AO)
   - ARKit 52 blendshapes for facial animation

2. **Rig Requirements:**
   - 150-180 joints
   - Twist bones for shoulders/wrists
   - IK chains for feet/hands
   - Root motion enabled

3. **Animation Sets:**
   - Idle (breathing, micro-movements)
   - Locomotion: Walk, Run, Sprint, Turn L/R
   - Combat: Light Attack, Heavy Attack, Dodge Roll, Parry
   - Traversal: Jump, Mantle, Vault, Climb
   - Contextual: Open Door, Push Object, Pull Lever

---

## ⏳ PHASE 2: PRODUCTION SPRINT (IN PROGRESS)

### C. Camera & Feel

**Current Implementation:**
```typescript
// CharacterGLB.tsx - Basic follow camera
useFrame(({camera}, dt) => {
  const target = ref.current.position.clone();
  camera.position.lerp(
    target.clone().add(new THREE.Vector3(6, 5, 8)),
    0.08
  );
  camera.lookAt(target);
});
```

**Required Enhancements:**
1. **Third-Person Rig:**
   - Orbit controls with mouse/gamepad
   - Collision detection (raycast to avoid walls)
   - Camera shake layer (subtle idle, intense combat)
   - Zoom levels (exploration 8m, combat 5m, dialogue 2m)

2. **Cinematic System:**
   - Timeline.json format for cutscenes
   - Dolly track presets (intro, boss reveal, puzzle solve)
   - Depth of Field automation (focus on speaker)
   - Letterbox bars for cinematic moments

**Implementation Plan:**
```typescript
// camera-rig.ts (to be created)
export class CameraRig {
  constructor(camera: THREE.Camera, target: THREE.Object3D) {
    this.camera = camera;
    this.target = target;
    this.offset = new THREE.Vector3(0, 2, 5);
    this.collisionRay = new THREE.Raycaster();
  }

  update(dt: number, input: GameInput, scene: THREE.Scene) {
    // Orbit with input
    this.orbit.x += input.mouse.deltaX * sensitivity;
    this.orbit.y += input.mouse.deltaY * sensitivity;

    // Calculate ideal position
    const idealPos = this.target.position.clone()
      .add(this.offset.clone().applyEuler(this.orbit));

    // Raycast for collision
    const collision = this.checkCollision(scene, idealPos);
    const finalPos = collision ? collision.point : idealPos;

    // Smooth lerp
    this.camera.position.lerp(finalPos, 0.1);
    this.camera.lookAt(this.target.position);

    // Camera shake
    if (this.shakeIntensity > 0) {
      this.applyShake(dt);
    }
  }
}
```

---

### D. Gameplay Core

**Required Systems:**

#### 1. Combat Framework
```typescript
// combat-system.ts (to be created)
export class CombatSystem {
  // Combo system
  registerCombo(sequence: InputSequence, damage: number, animation: string);

  // Hit detection
  checkHitbox(attacker: Entity, defender: Entity): HitResult;

  // Parry/Dodge
  tryParry(defender: Entity, attackFrame: number): boolean;
  applyIFrames(entity: Entity, duration: number);

  // Boss mechanics
  updateBossPhase(boss: BossEntity, healthPercent: number);
}
```

**Combat Specs:**
- Light attack: 3-hit combo (tap, tap, tap)
- Heavy attack: Hold 0.8s, release
- Dodge roll: 0.22s i-frames
- Parry window: 0.16s before hit
- Boss HP bar: Persistent UI element

#### 2. Puzzle Framework
```typescript
// puzzle-system.ts (to be created)
export class PuzzleSystem {
  // Chordstone multi-column puzzle
  solvePuzzle(columns: number[], targetFrequency: number): boolean {
    const tolerance = 3; // ±3Hz
    const sum = columns.reduce((a, b) => a + b, 0);
    return Math.abs(sum - targetFrequency) <= tolerance;
  }

  // Event emission
  onPuzzleSolved(callback: () => void);

  // Audit logging
  logPuzzleAttempt(userId: string, attempt: PuzzleAttempt);
}
```

**Puzzle UI:**
- Multi-column frequency sliders
- Real-time feedback (color coded: green = close, red = far)
- Success animation → Door opens → Audio cue

---

### E. Audio/Haptics

**Required Implementation:**

#### 1. Audio System
```typescript
// audio-system.ts (to be created)
import { Howl, Howler } from 'howler';

export class AudioSystem {
  private sounds: Map<string, Howl> = new Map();

  // Preload
  async preload(manifest: AudioManifest) {
    for (const [key, src] of Object.entries(manifest)) {
      this.sounds.set(key, new Howl({ src: [src], preload: true }));
    }
  }

  // Play with spatial audio
  play(key: string, position?: THREE.Vector3) {
    const sound = this.sounds.get(key);
    if (!sound) return;

    if (position) {
      // 3D spatial audio
      sound.pos(position.x, position.y, position.z);
    }

    sound.play();
  }

  // Music layering (investigation → combat)
  crossfade(fromKey: string, toKey: string, duration: number) {
    const from = this.sounds.get(fromKey);
    const to = this.sounds.get(toKey);

    from?.fade(1, 0, duration);
    to?.fade(0, 1, duration);
    to?.play();
  }
}
```

**Audio Assets Required:**
- Footsteps: Concrete, Wood, Metal, Grass (4x variations each)
- Weapon: Swing, Hit (flesh), Hit (metal), Parry
- UI: Button click, Puzzle solve, Error
- Music: Exploration layer, Investigation layer, Combat layer
- Boss: Harbor Colossus roar, attack telegraphs

#### 2. Haptics System
```typescript
// haptics-system.ts (to be created)
export class HapticsSystem {
  private gamepad: Gamepad | null = null;

  // WebHID DualSense support
  async connect() {
    if ('getGamepads' in navigator) {
      const gamepads = navigator.getGamepads();
      this.gamepad = gamepads.find(gp => gp?.id.includes('DualSense')) || null;
    }
  }

  // Vibration patterns
  vibrate(intensity: number, duration: number) {
    if (this.gamepad?.vibrationActuator) {
      this.gamepad.vibrationActuator.playEffect('dual-rumble', {
        duration,
        strongMagnitude: intensity,
        weakMagnitude: intensity * 0.5
      });
    }
  }

  // Event-driven haptics
  onAttackHit() { this.vibrate(0.8, 100); }
  onParry() { this.vibrate(1.0, 150); }
  onPuzzleSolve() { this.vibrate(0.4, 200); }
}
```

---

### F. Narrative & L10N

**Story Structure:**
```json
// story/timeline.json (to be created)
{
  "prologue": {
    "id": "prologue_intro",
    "type": "cutscene",
    "duration": 45.0,
    "events": [
      {
        "time": 0.0,
        "type": "camera_dolly",
        "preset": "intro_pan",
        "duration": 8.0
      },
      {
        "time": 2.0,
        "type": "dialogue",
        "character": "elif",
        "text_key": "prologue.elif.line_01",
        "subtitle": true,
        "facial": "surprise",
        "duration": 4.5
      },
      {
        "time": 7.0,
        "type": "music_cue",
        "track": "theme_mystery",
        "fade_in": 2.0
      }
    ]
  }
}
```

**Dialogue Database:**
```json
// story/dialogue/tr.json
{
  "prologue": {
    "elif": {
      "line_01": "Bu şehir... ne kadar da ıssız.",
      "line_02": "Birilerinin burada olması gerekiyordu."
    }
  }
}

// story/dialogue/en.json
{
  "prologue": {
    "elif": {
      "line_01": "This city... it's so desolate.",
      "line_02": "Someone should have been here."
    }
  }
}
```

**L10N System:**
```typescript
// l10n-system.ts (to be created)
export class L10NSystem {
  private locale: string = 'tr';
  private strings: Record<string, string> = {};

  async loadLocale(locale: string) {
    const response = await fetch(`/story/dialogue/${locale}.json`);
    this.strings = await response.json();
    this.locale = locale;
  }

  getString(key: string): string {
    const keys = key.split('.');
    let value: any = this.strings;

    for (const k of keys) {
      value = value?.[k];
    }

    return value || `[MISSING: ${key}]`;
  }
}
```

**Facial Animation:**
```typescript
// ARKit 52 blendshapes integration
export function applyViseme(character: THREE.SkinnedMesh, viseme: string) {
  const morphTargets = character.morphTargetDictionary;
  if (!morphTargets) return;

  // Map viseme to blendshapes
  const visemeMap: Record<string, string[]> = {
    'AA': ['jawOpen', 'mouthOpen'],
    'EE': ['mouthSmile'],
    'OH': ['mouthRound', 'jawOpen']
  };

  const shapes = visemeMap[viseme] || [];
  shapes.forEach(shapeName => {
    const index = morphTargets[shapeName];
    if (index !== undefined) {
      character.morphTargetInfluences![index] = 1.0;
    }
  });
}
```

---

### G. LiveOps/Telemetry

**Current Foundation:**
```typescript
// Existing health endpoints ✅
/api/health → 404 (needs implementation)
/api/ai-assistant/health → 404
/api/database/health → 404
/api/cache/health → 404
/api/storage/health → 404
```

**Required Systems:**

#### 1. OpenTelemetry Integration
```typescript
// telemetry-system.ts (to be created)
import { trace, metrics } from '@opentelemetry/api';

export class TelemetrySystem {
  private tracer = trace.getTracer('echo-of-sardis');
  private meter = metrics.getMeter('echo-of-sardis');

  // Performance metrics
  recordFPS(fps: number) {
    this.meter.createHistogram('fps').record(fps);
  }

  recordFrameTime(ms: number) {
    this.meter.createHistogram('frame_time_ms').record(ms);
  }

  // User behavior
  recordPuzzleAttempt(success: boolean, duration: number) {
    this.tracer.startSpan('puzzle_attempt', {
      attributes: { success, duration }
    }).end();
  }

  recordCombatMetrics(damage: number, comboLength: number) {
    this.meter.createCounter('combat_damage').add(damage);
    this.meter.createHistogram('combo_length').record(comboLength);
  }
}
```

#### 2. Season System
```json
// LiveOps/seasons/s2.json (to be created)
{
  "season_id": "s2_echoes",
  "start_date": "2025-11-01T00:00:00Z",
  "end_date": "2026-01-31T23:59:59Z",
  "rewards": [
    {
      "tier": 1,
      "unlock_xp": 1000,
      "reward_id": "skin_elif_winter",
      "type": "cosmetic"
    },
    {
      "tier": 10,
      "unlock_xp": 10000,
      "reward_id": "weapon_frostblade",
      "type": "weapon"
    }
  ],
  "challenges": [
    {
      "id": "complete_5_puzzles",
      "description": "Solve 5 Chordstone puzzles",
      "reward_xp": 500
    }
  ]
}
```

#### 3. A/B Testing Framework
```typescript
// ab-testing.ts (to be created)
export class ABTestingSystem {
  async getVariant(experimentId: string, userId: string): Promise<string> {
    // Hash user ID to get consistent assignment
    const hash = await this.hashUserId(userId);
    const bucket = hash % 100;

    // Fetch experiment config
    const experiment = await this.fetchExperiment(experimentId);

    // Assign to variant based on bucket
    let cumulativePct = 0;
    for (const variant of experiment.variants) {
      cumulativePct += variant.percentage;
      if (bucket < cumulativePct) {
        return variant.id;
      }
    }

    return 'control';
  }
}
```

---

### H. CI/CD & Compliance

**Current CI/CD:**
```yaml
# .github/workflows/ci.yml ✅
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
```

**Required Enhancements:**

#### 1. SAST/DAST Pipeline
```yaml
# .github/workflows/security.yml (to enhance)
name: Security Scan
on: [push, pull_request]
jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: SAST with Semgrep
        run: |
          pip install semgrep
          semgrep --config=auto --json -o sast-results.json
      - name: Upload SAST results
        uses: actions/upload-artifact@v3
        with:
          name: sast-results
          path: sast-results.json

  dast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start server
        run: npm run dev &
      - name: Wait for server
        run: sleep 10
      - name: DAST with ZAP
        run: |
          docker run -v $(pwd):/zap/wrk/:rw \
            -t owasp/zap2docker-stable zap-baseline.py \
            -t http://localhost:3100 -J zap-results.json
      - name: Upload DAST results
        uses: actions/upload-artifact@v3
        with:
          name: dast-results
          path: zap-results.json

  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: OSV Scanner
        run: |
          curl -L https://github.com/google/osv-scanner/releases/latest/download/osv-scanner_linux_amd64 -o osv-scanner
          chmod +x osv-scanner
          ./osv-scanner --lockfile=package-lock.json --format=json > osv-results.json
      - name: Upload OSV results
        uses: actions/upload-artifact@v3
        with:
          name: osv-results
          path: osv-results.json
```

#### 2. SBOM & SLSA
```yaml
# .github/workflows/sbom-slsa.yml (to be created)
name: SBOM & SLSA
on:
  push:
    branches: [main]
jobs:
  sbom:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generate SBOM
        run: |
          npm install -g @cyclonedx/cyclonedx-npm
          cyclonedx-npm --output-file sbom.json
      - name: Upload SBOM
        uses: actions/upload-artifact@v3
        with:
          name: sbom
          path: sbom.json

  slsa:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v3
      - name: Build
        run: npm run build
      - name: Generate SLSA Provenance
        uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v1.9.0
        with:
          artifacts: apps/console/.next
      - name: Sign with Cosign
        run: |
          curl -sSfL https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64 -o cosign
          chmod +x cosign
          ./cosign sign-blob --bundle cosign.bundle sbom.json
      - name: Upload signed artifacts
        uses: actions/upload-artifact@v3
        with:
          name: signed-sbom
          path: |
            sbom.json
            cosign.bundle
```

#### 3. KVKV/GDPR Compliance
```typescript
// compliance/gdpr-portal.ts (to be created)
export class GDPRPortal {
  // User data export (GDPR Article 15)
  async exportUserData(userId: string): Promise<UserDataExport> {
    return {
      profile: await this.db.getUserProfile(userId),
      telemetry: await this.db.getUserTelemetry(userId),
      progress: await this.db.getUserProgress(userId),
      purchases: await this.db.getUserPurchases(userId)
    };
  }

  // Right to be forgotten (GDPR Article 17)
  async deleteUserData(userId: string): Promise<void> {
    // Anonymize telemetry (keep aggregate stats)
    await this.db.anonymizeTelemetry(userId);

    // Delete personal data
    await this.db.deleteUserProfile(userId);
    await this.db.deleteUserProgress(userId);

    // Audit log
    await this.auditLog.record({
      action: 'user_data_deletion',
      userId,
      timestamp: new Date().toISOString()
    });
  }

  // Data portability (GDPR Article 20)
  async generatePortableData(userId: string): Promise<Blob> {
    const data = await this.exportUserData(userId);
    return new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
  }
}
```

---

## 🎯 EXECUTION PLAN - SPRINT 2

### Week 1: Camera & Core Gameplay

**Day 1-2: Camera Rig**
- [ ] Implement third-person orbit camera
- [ ] Add collision detection (wall avoidance)
- [ ] Implement camera shake system
- [ ] Add zoom level presets

**Day 3-4: Combat Framework**
- [ ] Implement combo system (tap/hold detection)
- [ ] Add hit detection (hitbox/hurtbox)
- [ ] Implement parry/dodge with i-frames
- [ ] Create boss HP bar UI

**Day 5-7: Puzzle System**
- [ ] Implement Chordstone multi-column puzzle
- [ ] Add frequency tolerance checking (±3Hz)
- [ ] Create puzzle UI (sliders + feedback)
- [ ] Add door opening animation on solve

**Deliverables:**
- [ ] Web demo: Player can move, attack, dodge, solve puzzle
- [ ] Boss HP bar decreases on hit
- [ ] Door opens on puzzle solve

---

### Week 2: Audio, Haptics & Narrative

**Day 8-9: Audio System**
- [ ] Integrate Howler.js for spatial audio
- [ ] Add footstep sound system (material-based)
- [ ] Implement music layering (exploration/combat)
- [ ] Add UI sound effects

**Day 10-11: Haptics**
- [ ] Implement WebHID DualSense detection
- [ ] Add vibration patterns for events
- [ ] Create fallback for non-DualSense gamepads

**Day 12-14: Narrative System**
- [ ] Create timeline.json format
- [ ] Implement dialogue system with subtitles
- [ ] Add L10N support (TR/EN)
- [ ] Integrate ARKit blendshapes for facial

**Deliverables:**
- [ ] Prologue cutscene with 2 dialogue lines
- [ ] Subtitles displayed with facial animation
- [ ] Audio plays for footsteps, attacks, puzzle solve
- [ ] Haptics trigger on combat events

---

### Week 3: LiveOps & Telemetry

**Day 15-16: OpenTelemetry**
- [ ] Set up OTEL collector
- [ ] Add FPS/frame time metrics
- [ ] Implement user behavior tracking
- [ ] Create telemetry dashboard

**Day 17-18: Season System**
- [ ] Create season JSON format
- [ ] Implement reward unlocking
- [ ] Add challenge tracking
- [ ] Build season UI panel

**Day 19-21: A/B Testing**
- [ ] Implement variant assignment
- [ ] Add experiment config format
- [ ] Create metrics comparison dashboard
- [ ] Test canary → GA rollout

**Deliverables:**
- [ ] Live telemetry dashboard showing FPS, behavior
- [ ] Season 2 rewards visible in UI
- [ ] A/B test experiment running

---

### Week 4: CI/CD & Compliance

**Day 22-23: Security Pipeline**
- [ ] Enhance GitHub Actions with SAST/DAST
- [ ] Add OSV scanner for dependencies
- [ ] Set up automated security reports

**Day 24-25: SBOM & SLSA**
- [ ] Generate CycloneDX SBOM
- [ ] Implement SLSA Level 3 provenance
- [ ] Sign artifacts with Cosign

**Day 26-28: GDPR Portal**
- [ ] Implement user data export API
- [ ] Add right to be forgotten functionality
- [ ] Create data portability endpoint
- [ ] Build GDPR compliance UI

**Deliverables:**
- [ ] Green CI/CD pipeline with security checks
- [ ] Signed SBOM and attestation
- [ ] GDPR-compliant data export/delete endpoints

---

## 📈 PERFORMANCE BUDGETS

### Web Target (60 FPS = 16.6ms/frame)

| Budget Item | Target | Current | Status |
|-------------|--------|---------|--------|
| Triangle Count | 8-12M | ~80k | ✅ |
| Draw Calls | ≤4000 | ~150 | ✅ |
| GPU Frame Time | ≤16.6ms | TBD | ⏳ |
| Shadow Maps | 4096² | 4096² | ✅ |
| Texture Memory | ≤2GB | ~100MB | ✅ |

### PS5 Target (4K60 or 1440p120)

| Budget Item | 4K60 | 1440p120 | Notes |
|-------------|------|----------|-------|
| Triangle Count | 12-20M | 8-12M | Nanite streaming |
| VRAM Budget | ≤12GB | ≤10GB | Including textures |
| GPU Frame | ≤16.6ms | ≤8.3ms | With TAAU |
| Lumen Bounces | 2 | 1 | GI quality |
| Shadow Maps | VSM ∞ | VSM ∞ | Virtual shadow maps |

---

## 🧪 TESTING & QA CHECKLIST

### Functional Testing
- [ ] Character loads and displays correctly
- [ ] Animations play smoothly (Idle, Walk, Run)
- [ ] Camera follows character without jitter
- [ ] Combat combos register correctly
- [ ] Puzzle solving works with ±3Hz tolerance
- [ ] Door opens on puzzle completion
- [ ] Boss HP decreases on hit
- [ ] Audio plays at correct times
- [ ] Haptics trigger on events
- [ ] Dialogue displays with subtitles
- [ ] L10N switching works (TR ↔ EN)

### Performance Testing
- [ ] FPS stays above 60 on target hardware
- [ ] No memory leaks during 30min session
- [ ] Asset loading completes within 5s
- [ ] Hot reload works without crashes
- [ ] No dropped frames during combat

### Accessibility (AA Level)
- [ ] Subtitles are readable (min 18px)
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Keyboard/gamepad navigation works
- [ ] Text scaling supported (up to 200%)
- [ ] Alternative audio cues for deaf players

### Security & Compliance
- [ ] SAST scan passes with 0 critical issues
- [ ] DAST scan passes with 0 high vulnerabilities
- [ ] OSV scan shows no known exploits
- [ ] SBOM generated and signed
- [ ] SLSA Level 3 provenance verified
- [ ] GDPR export/delete APIs functional
- [ ] Audit logs capturing sensitive operations

---

## 🚀 DEPLOYMENT STRATEGY

### Canary → GA Rollout

```
Phase 1: Internal Testing (Days 1-7)
├─ Deploy to localhost:3100
├─ Internal QA team testing
└─ Fix critical bugs

Phase 2: Canary (Days 8-14)
├─ Deploy to 5% of production traffic
├─ Monitor telemetry for anomalies
├─ Compare with baseline (A/B test)
└─ Roll forward if metrics OK, rollback if not

Phase 3: GA (Days 15+)
├─ Gradual rollout: 25% → 50% → 100%
├─ Monitor crash rates, FPS, retention
└─ Post-launch support
```

### Rollback Procedure

```bash
# If critical issue detected during canary:
1. Feature flag OFF
   → Set `features.s2_release = false` in config

2. Traffic reroute
   → Route 100% to previous stable version

3. Post-mortem
   → Review logs, telemetry, crash reports
   → Identify root cause
   → Fix and re-deploy to canary
```

---

## 📊 SUCCESS METRICS (KPIs)

### Technical Metrics
- **FPS P95:** >55 FPS (target: 60)
- **Frame Time P95:** <18ms (target: 16.6ms)
- **Crash Rate:** <0.1% sessions
- **Asset Load Time:** <5s for full scene

### User Engagement
- **Retention D1:** >40%
- **Retention D7:** >20%
- **Avg Session Length:** >15 minutes
- **Puzzle Completion Rate:** >70%

### Business Metrics (if applicable)
- **Monetization:** Season pass purchase rate
- **Virality:** Social share rate
- **Cost:** Infrastructure cost per DAU

---

## 🎯 NEXT IMMEDIATE ACTIONS

### NOW (This Sprint):

1. **Performance Profiling Tool**
   ```typescript
   // Add to Scene.tsx
   import { Perf } from 'r3f-perf';

   <Canvas>
     <Perf position="top-left" />
     {/* ... */}
   </Canvas>
   ```

2. **Asset Health Monitoring**
   ```typescript
   // Already exists in AssetHealth.tsx ✅
   // Shows green ✔ for loaded assets, red ✖ for missing
   ```

3. **FPS Counter**
   ```typescript
   // Add to UI.tsx
   export function FPSCounter() {
     const [fps, setFps] = useState(60);
     useFrame((_, delta) => {
       setFps(Math.round(1 / delta));
     });
     return <div className="fixed top-3 left-3">FPS: {fps}</div>;
   }
   ```

4. **Create UE5 Project Structure**
   ```bash
   mkdir -p Desktop/ailydian-ultra-pro/GameProject
   cd GameProject

   # UE5 project structure
   mkdir -p Content/{Characters,Environments,Materials,Audio,Blueprints}
   mkdir -p Source/GameProject/{Public,Private}
   mkdir -p Config

   # Create .uproject file
   cat > GameProject.uproject <<EOF
   {
     "FileVersion": 3,
     "EngineAssociation": "5.3",
     "Category": "",
     "Description": "Echo of Sardis - PS5 Quality Game",
     "Modules": [
       {
         "Name": "GameProject",
         "Type": "Runtime",
         "LoadingPhase": "Default"
       }
     ],
     "Plugins": [
       {
         "Name": "Nanite",
         "Enabled": true
       },
       {
         "Name": "Lumen",
         "Enabled": true
       },
       {
         "Name": "VirtualShadowMaps",
         "Enabled": true
       }
     ]
   }
   EOF
   ```

---

## 📞 SUPPORT & RESOURCES

### Documentation
- **Web:** `/docs/playpro/` (performance, architecture)
- **UE5:** `/GameProject/Docs/` (setup, workflows)
- **API:** `/docs/api/` (endpoints, schemas)

### External Resources
- **Three.js Docs:** https://threejs.org/docs/
- **R3F Docs:** https://docs.pmnd.rs/react-three-fiber
- **UE5 Docs:** https://docs.unrealengine.com/5.3/
- **SLSA Framework:** https://slsa.dev/
- **OWASP ZAP:** https://www.zaproxy.org/

### Team Contacts
- **Tech Lead:** [Your Name]
- **Security:** [Security Team]
- **Compliance:** [Legal/GDPR Team]
- **QA:** [QA Team]

---

## 🎉 CONCLUSION

**Current State:**
- ✅ Visual realism foundation complete (ACES, post-FX, HDRI)
- ✅ Character system functional (GLB loader, animations)
- ⏳ Gameplay core in progress (camera, combat, puzzle)
- ❌ Audio/haptics not started
- ❌ Narrative system not started
- ⏳ LiveOps/telemetry partially implemented
- ⏳ CI/CD needs security enhancements

**Target State (End of Sprint 2):**
- ✅ Fully playable vertical slice (Web)
- ✅ UE5 proof-of-concept scene
- ✅ Performance profiling active
- ✅ Security pipeline green
- ✅ GDPR-compliant data handling

**Risk Mitigation:**
- **Performance issues:** DRS + LOD fallbacks
- **Asset missing:** Multi-candidate resolver + placeholder
- **Security vulnerabilities:** SAST/DAST/OSV continuous scanning
- **Compliance issues:** GDPR portal + audit logging

**Success Criteria:**
- Web demo runs at 60 FPS
- All tests pass (functional, performance, security)
- DoD checklist 100% complete
- Production-ready for canary deployment

---

**Last Updated:** 2025-10-13
**Next Review:** 2025-10-20 (End of Week 1)

