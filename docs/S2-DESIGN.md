# Season 2: Echo Storms - Design Document

**Version**: 2.0.0
**Date**: January 15, 2026
**Design Team**: Content, UX, Systems
**Status**: APPROVED

---

## Design Pillars

### 1. Mystery & Discovery
**Theme**: Uncover the origin of resonance storms through environmental storytelling
**Implementation**: Hidden lore tablets, audio logs, environmental clues

### 2. Audio-Visual Synergy
**Theme**: Sound waves visualized as gameplay mechanics
**Implementation**: Frequency puzzles, echo triangulation, storm pulse patterns

### 3. Optional Cooperation
**Theme**: Play solo or with a friend, no forced multiplayer
**Implementation**: Resonance Link (drop-in co-op), solo-viable content

---

## Core Mechanics

### Storm Puzzles (New for S2)

#### 1. Frequency Alignment
**Difficulty**: Easy
**Goal**: Match audio frequency to visual waveform

**Gameplay**:
1. Player sees sine wave on screen (visual)
2. Player hears reference tone (audio)
3. Player adjusts dial to match frequency (interaction)
4. Success: Waveforms align, puzzle unlocks

**Reward**: 150 CR, 400 XP, 10% cosmetic token

**Design Rationale**: Gentle introduction to S2 acoustic mechanics, accessible to all players

#### 2. Phase Chain
**Difficulty**: Medium
**Goal**: Chain multiple frequencies in correct sequence

**Gameplay**:
1. Player discovers 3-5 frequency nodes
2. Each node emits a tone (C, E, G for example)
3. Player must activate in melodic order
4. Wrong order = reset, right order = unlock

**Reward**: 250 CR, 600 XP, 15% cosmetic token

**Design Rationale**: Introduces sequencing, tests player memory

#### 3. Echo Triangulation
**Difficulty**: Hard
**Goal**: Locate sound source using spatial audio + visual clues

**Gameplay**:
1. Player hears distant echo (3D spatial audio)
2. Player moves through environment
3. Echo gets louder/clearer when closer to source
4. Visual clues (faint glowing orbs) guide direction
5. Find source to unlock

**Reward**: 400 CR, 800 XP, 20% cosmetic token

**Design Rationale**: Leverages spatial audio tech, rewards exploration

---

## Boss Design: Echo Sentinel

### Phase 1: Awakening (HP 100% → 66%)
**Mechanics**:
- **Basic Melee**: Slow wind-up, telegraphed attacks
- **Storm Summon**: Calls lightning strikes in AoE (dodge)
- **Lightning Bolt**: Fast ranged attack (sidestep or use cover)

**Tells** (Telegraph System):
- Ground Slam: Boss raises arms, ground cracks glow red (1.5s warning)
- Lightning Charge: Boss body glows yellow, electrical sparks (1.0s warning)

**Success Rate Target**: 55%

### Phase 2: Fury (HP 66% → 33%)
**New Mechanics**:
- **Wind Shear**: Push-back AoE, forces positioning
- **Echo Pulse**: Radial sound wave, must time dodge

**Phase Transition**: Boss roars, arena darkens, lightning intensifies

### Phase 3: Enrage (HP 33% → 0%)
**New Mechanics**:
- **Echo Cascade**: Multi-hit combo, requires precise dodge timing
- **Enrage Timer**: 120 seconds, boss damage +50% if not defeated

**Design Rationale**: 3-phase structure creates narrative arc (awakening → fury → desperation), each phase adds 1-2 mechanics

---

## Biomes

### Canyon Night-Storm
**Theme**: Electrical storms illuminate dark canyons

**Visual Design**:
- Dark blue/purple color palette
- Lightning flashes every 8-12 seconds (dynamic lighting)
- Rain particles, reflective puddles

**Gameplay Elements**:
- Lightning hazards (avoid standing in water during flash)
- Echo puzzles hidden in canyon alcoves
- Vertical traversal (grapple points)

**Audio Design**:
- Thunder rumbles (low-frequency bass)
- Rain ambience
- Wind gusts (directional audio)

### Ruins Sand-Gale
**Theme**: Ancient ruins with swirling sand storms

**Visual Design**:
- Orange/brown color palette
- Sand particles (GPU particle system)
- Crumbling stone architecture

**Gameplay Elements**:
- Wind-based traversal (glide using updrafts)
- Sandstorm visibility reduction (every 5 min, lasts 30s)
- Hidden chambers (reveal when sandstorm clears)

**Audio Design**:
- Wind howling (stereo panning)
- Sand impacts (granular synthesis)
- Distant chimes (ancient ruins theme)

---

## Cooperative Mechanic: Resonance Link

### Design Philosophy
**"Optional, Not Mandatory"**: All content solo-viable, co-op provides 1.25x bonus (Week 4 only)

### Matchmaking
**Opt-In System**:
- Player enters puzzle area
- Prompt: "Try co-op mode? (1.25x rewards this week)"
- Player can accept (matchmake) or decline (play solo)

**A/B Test**: `abx-coop-optin` tests prompt frequency (1, 2, or 3 times per session)

### Co-op Puzzle Design
**Synchronized Actions**:
- **Example 1**: Two players hold frequency nodes simultaneously
- **Example 2**: One player sees clue, other executes action (asymmetric info)

**Drop-In/Drop-Out**:
- Second player joins mid-puzzle: progress saved
- Second player leaves: puzzle reverts to solo mode

---

## UI/UX Design

### Season Progress Screen
**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  SEASON 2: ECHO STORMS                    [Week 3 of 6] │
├─────────────────────────────────────────────────────────┤
│  [■■■■■■■■■■□□□□□□□□] 50% Complete                      │
│                                                          │
│  ACTIVE EVENTS:                                          │
│  • Photo Contest: Storm Trails (5 days left)             │
│  • Daily Trials (Reset in 14h 32m)                       │
│                                                          │
│  UPCOMING:                                               │
│  • Co-op Puzzle Week (7 days)                            │
│  • Vendor Sale 10% (11 days)                             │
│                                                          │
│  [View Rewards] [Leaderboards] [Change Language]         │
└─────────────────────────────────────────────────────────┘
```

### Storm Puzzle HUD
**Visual Elements**:
- Waveform visualizer (center screen)
- Frequency dial (bottom-right)
- Timer (top-right, if timed puzzle)
- Hint button (bottom-left, 1 hint per puzzle)

**Accessibility**:
- Colorblind mode: Waveforms use patterns + colors
- Audio-only mode: Haptic feedback for frequency matching

### Boss Health Bar
**Design**:
- Boss HP bar (top, red)
- Phase indicators (3 segments, glow when transitioning)
- Player HP bar (bottom-left, green)
- Boss mechanics icons (bottom-right, show incoming attacks)

---

## Cosmetics Design

### Costume: Storm Walker (Epic)
**Visual**:
- Flowing cape with lightning particle effects
- Blue/purple color scheme
- Glowing eyes

**Acquisition**: Echo Sentinel Phase 2 first clear

### Costume: Sentinel's Shroud (Legendary)
**Visual**:
- Hooded cloak with echo pulse animation
- Dark gray with gold trim
- Sound waves emanate from shoulders

**Acquisition**: Echo Sentinel Phase 1 first clear

### Effect: Lightning Trail (Epic)
**Visual**:
- Lightning sparks trail behind player
- Electric blue color
- Fades after 0.5 seconds

**Acquisition**: Photo contest 2nd place

### Effect: Wind Aura (Rare)
**Visual**:
- Swirling wind particles around player
- Translucent white
- Gentle animation loop

**Acquisition**: Photo contest 3rd place

---

## Audio Design

### Music
**Themes**:
- **Week 1-2**: Mystery (minor key, ambient synths)
- **Week 3-4**: Discovery (major key, hopeful melody)
- **Week 5-6**: Climax (orchestral, intense percussion)

**Dynamic Music System**:
- Combat: Increases tempo + adds percussion
- Exploration: Calm, ambient
- Puzzle: Subtle melodic hints (frequency = musical note)

### Sound Effects
**Storm Puzzles**:
- Frequency tone: Pure sine wave (tunable 200-800 Hz)
- Success: Harmonic chord (C major)
- Failure: Dissonant chord (tritone)

**Boss Encounter**:
- Footsteps: Heavy, stone-like (Foley + low-frequency rumble)
- Lightning Bolt: Sharp crack + electrical hum
- Roar: Distorted, layered animal sounds

### Spatial Audio
**Implementation**: HRTF (Head-Related Transfer Function) for 3D positioning
**Use Cases**:
- Echo triangulation puzzles
- Boss telegraph audio cues
- Environmental ambience (thunder distance)

---

## Performance Optimization

### Target Specs
- **Min Spec**: GTX 1060, 8GB RAM, 60 FPS at 1080p Medium
- **Recommended**: RTX 3060, 16GB RAM, 144 FPS at 1080p High
- **Max Spec**: RTX 4080, 32GB RAM, 144 FPS at 4K Ultra

### Optimization Techniques
1. **LOD (Level of Detail)**: 3 levels (high/medium/low), distance-based
2. **Occlusion Culling**: Don't render objects behind walls
3. **Particle Budget**: Max 10,000 particles on-screen (GPU instancing)
4. **Texture Streaming**: Load textures on-demand, unload when far
5. **Audio Optimization**: Max 32 audio channels, prioritize nearest sounds

### Performance Targets (from KPI Dashboard)
- **Crash-Free Rate**: ≥98.5%
- **P95 GPU Frame Time**: ≤16.6ms (60 FPS)
- **Hitch Rate**: <2% (hitches >2ms)
- **P95 Server Latency**: ≤150ms

---

## Accessibility (a11y)

### Vision
- **Colorblind Modes**: Deuteranopia, Protanopia, Tritanopia filters
- **High Contrast Mode**: Increase UI contrast (borders, text)
- **Text Scaling**: 100%, 125%, 150%, 200%
- **Subtitles**: All cutscenes, audio logs (8 languages)

### Hearing
- **Visual Audio Cues**: Boss attacks show icon + direction indicator
- **Haptic Feedback**: Controller vibration for frequency matching
- **Closed Captions**: Music, sound effects (e.g., [Thunder rumbles])

### Motor
- **Rebindable Controls**: All inputs customizable
- **Auto-Run Toggle**: Hold forward vs toggle
- **Aim Assist**: Optional (slider 0-100%)
- **Reaction Time**: Adjustable telegraph durations (+50% option)

### Cognitive
- **Objective Markers**: Always visible, waypoint system
- **Hint System**: 1 hint per puzzle (reveals next step)
- **Pause in Puzzles**: Can pause to think (except timed challenges)

---

## Monetization (Ethical)

### Principles
- ✅ **NO Pay-to-Win**: Ancient Crystals (AC) buy cosmetics only
- ✅ **NO Loot Boxes**: All purchases direct (no RNG)
- ✅ **NO FOMO**: Cosmetics eventually rotate back
- ✅ **Transparent Pricing**: Show local currency (TRY, EUR, USD)

### Pricing (Ancient Crystals)
| AC Pack | Price | $/AC |
|---------|-------|------|
| 500 AC | $4.99 | $0.010 |
| 1200 AC | $9.99 | $0.008 |
| 2500 AC | $19.99 | $0.008 |

### Cosmetic Pricing
| Item | AC Cost | USD Equivalent |
|------|---------|----------------|
| Costume (Rare) | 300 AC | ~$3 |
| Costume (Epic) | 600 AC | ~$6 |
| Costume (Legendary) | 1200 AC | ~$12 |
| Effect (Rare) | 200 AC | ~$2 |
| Effect (Epic) | 400 AC | ~$4 |

---

## Narrative Design

### Story Arc (6 Weeks)

**Week 1**: Discovery
- Player investigates strange acoustic anomalies
- Audio logs hint at ancient civilization's downfall

**Week 2**: Confrontation
- Echo Sentinel awakens (boss encounter)
- Player learns Sentinel guards harmonic seal

**Week 3**: Investigation
- Player explores ruins, uncovers civilization's history
- PhotoMode contest: Document storm phenomena

**Week 4**: Alliance
- Player befriends NPC scholars (co-op NPCs)
- Learn resonance technology basics

**Week 5**: Crisis
- Echo Sentinel returns, corrupted (boss Phase 2)
- Harmonic seal breaking, storms intensifying

**Week 6**: Resolution
- Player restores harmonic balance
- Finale cutscene: Storms calm, Sentinel at peace

### Environmental Storytelling
- **Lore Tablets**: 12 hidden tablets (Turkish + 7 translations)
- **Audio Logs**: 8 logs (voiced, subtitled)
- **Environmental Clues**: Ancient murals, ruined instruments

---

## Technical Implementation

### Tech Stack
- **Engine**: Custom (C++, Vulkan renderer)
- **Physics**: Havok
- **Audio**: FMOD (3D spatial audio, dynamic music)
- **Networking**: WebSocket (real-time co-op)
- **Backend**: Node.js + Express (API), PostgreSQL (database), Redis (cache)

### Data Pipeline
```
Player Action → Client Telemetry → Backend API → PostgreSQL → Analytics Pipeline → Grafana Dashboard
```

### A/B Testing Infrastructure
- **Allocation**: Murmur3 hash (user ID → arm)
- **Persistence**: Redis cache (user stays in same arm)
- **Analysis**: Python (scipy.stats), Jupyter notebooks

---

## Approval & Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Creative Director** | - | ✅ Approved | Jan 5, 2026 |
| **UX Lead** | - | ✅ Approved | Jan 6, 2026 |
| **Systems Designer** | - | ✅ Approved | Jan 7, 2026 |
| **Audio Director** | - | ✅ Approved | Jan 8, 2026 |
| **Technical Director** | - | ✅ Approved | Jan 10, 2026 |

---

**Design Document Status**: ✅ FINALIZED
**Implementation**: ✅ Complete
**Testing**: ✅ PASS
**Launch**: ✅ READY

**Version**: 2.0.0
**Prepared by**: Content Design Team
