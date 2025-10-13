# GAME DESIGN DOCUMENT (GDD)
## Tomb Raider Style Action-Adventure Game - Lydian Integration

**Version**: 1.0.0
**Date**: 2025-10-11
**Status**: Phase-0 - Feasibility & Planning
**Classification**: Internal - White-Hat Compliant

---

## 1. EXECUTIVE SUMMARY

### 1.1 Game Overview
**Title**: [TBD - Working Title: "Echoes of the Ancients"]
**Genre**: Third-Person Action-Adventure
**Platform**: PS5 (Primary), PC (Windows)
**Target Audience**: PEGI 16+ / ESRB T
**Estimated Duration**: 12-15 hours (main story), 20-25 hours (100% completion)

### 1.2 Core Pillars
1. **Exploration**: Verticality, traversal mechanics, environmental storytelling
2. **Combat**: Tactical third-person combat (melee + ranged)
3. **Puzzle**: Environmental puzzles, ancient mechanisms
4. **Narrative**: Strong protagonist, cinematic storytelling
5. **Integration**: Deep Lydian platform connectivity

### 1.3 Unique Selling Points (USPs)
- **Nanite-powered visuals**: PS5-quality graphics with Unreal Engine 5
- **Seamless Lydian integration**: SSO, cloud saves, marketplace, LiveOps
- **Modular level design**: World Partition for streaming, no loading screens
- **Accessibility**: Comprehensive options (color-blind, captions, difficulty)
- **White-hat monetization**: No P2W, cosmetic-only DLC, GDPR-compliant

---

## 2. GAME CONCEPT

### 2.1 High-Level Pitch
> "A fearless archaeologist uncovers an ancient civilization's last secret—a technology that could reshape reality. But she's not alone in the search. Navigate treacherous ruins, solve intricate puzzles, and battle rival factions in a race against time."

### 2.2 Setting
- **Time Period**: Modern day
- **Location**: Fictional Mediterranean island chain (inspired by Greek/Egyptian architecture)
- **Atmosphere**: Mystery, danger, awe-inspiring ancient wonders
- **Environmental Themes**: Jungle overgrowth, desert canyons, underwater caverns, volcanic ruins

### 2.3 Protagonist
**Name**: [TBD - Codename: "Lyra"]
**Background**: PhD archaeologist, trained climber, resourceful survivor
**Motivation**: Uncover father's research, protect ancient knowledge
**Character Arc**: Skeptic → Believer in ancient power; Loner → Leader

---

## 3. GAMEPLAY MECHANICS

### 3.1 Core Gameplay Loop
```
EXPLORE → NAVIGATE → ENCOUNTER → SOLVE → PROGRESS → UPGRADE → REPEAT
```

### 3.2 Traversal System

#### 3.2.1 Movement
- **Walk/Run**: Contextual speed (stealth crouch, sprint)
- **Jump**: Height clearance, ledge grab
- **Climb**: Ledge shimmy, vertical ascent, free-climbing
- **Swim**: Surface/underwater, breath meter
- **Slide**: Downhill momentum, control drift

#### 3.2.2 Advanced Traversal
| Mechanic | Description | Unlock Condition |
|----------|-------------|------------------|
| **Grappling Hook** | Swing across gaps, pull objects | Chapter 1 (tutorial) |
| **Zipline** | Fast descent, environmental lines | Always available |
| **Rope Climb** | Vertical rope ascent/descent | Inventory item (rope) |
| **Wall Run** | Limited-time horizontal wall run | Chapter 3 (upgrade) |
| **Parachute** | High-altitude descent control | Chapter 4 (story item) |

#### 3.2.3 Traversal Puzzles
- **Environmental Reading**: Cracks, ledges, handholds marked with subtle visual cues (white paint, wear patterns)
- **Timing Challenges**: Collapsing platforms, rotating mechanisms
- **Combo Moves**: Grapple → Swing → Wall Run → Ledge Grab sequences

### 3.3 Combat System

#### 3.3.1 Combat Stance
- **Soft Lock-On**: Camera assist, not hard lock
- **Cover System**: Contextual, low walls/pillars
- **Dodge Roll**: I-frames, stamina cost

#### 3.3.2 Melee Combat
| Attack Type | Damage | Speed | Stamina Cost |
|-------------|--------|-------|--------------|
| **Light Attack** | Low | Fast | 10% |
| **Heavy Attack** | High | Slow | 30% |
| **Combo Finisher** | Critical | Moderate | 50% |
| **Parry** | N/A | Instant | 20% |

**Combo System**: Light → Light → Heavy (launcher), Light → Light → Light → Finisher

#### 3.3.3 Ranged Combat
- **Bow**: Silent, precision, headshot bonus (2x damage)
- **Pistol**: Loud, fast fire rate, limited ammo
- **Thrown Objects**: Environmental (rocks, bottles), distraction

#### 3.3.4 Stealth Combat
- **Takedowns**: Silent kill from behind/above, instant
- **Distraction**: Throw objects, whistle, shoot arrows
- **Detection States**:
  - **Unaware**: ⚪ White - Normal patrol
  - **Suspicious**: 🟡 Yellow - Investigating sound
  - **Alert**: 🔴 Red - Combat engaged

### 3.4 Puzzle Design

#### 3.4.1 Puzzle Categories
1. **Environmental Physics**: Weight-based platforms, water flow redirection
2. **Ancient Mechanisms**: Gear puzzles, light reflection, constellation alignment
3. **Traversal Challenges**: Timed jumps, rope swings, rotating pillars
4. **Cryptography**: Symbol matching, hieroglyph translation (journal hints)

#### 3.4.2 Puzzle Difficulty Curve
- **Chapter 1-2**: Tutorial (1-step solutions, obvious hints)
- **Chapter 3-4**: Intermediate (2-3 step, environmental observation)
- **Chapter 5-6**: Advanced (multi-room, timed elements)
- **Optional Tombs**: Expert (no hints, player mastery)

#### 3.4.3 Hint System
- **Level 1 (30s)**: Subtle visual cue (camera pan, object highlight)
- **Level 2 (90s)**: Journal entry unlock (cryptic text)
- **Level 3 (180s)**: Direct hint (UI marker, audio cue)

### 3.5 Inventory & Progression

#### 3.5.1 Inventory System
| Category | Items | Limit | Upgradeable |
|----------|-------|-------|-------------|
| **Weapons** | Bow, Pistol, Melee Tool | 3 slots | ✅ (damage, ammo) |
| **Consumables** | Health Kits, Ammo, Rope | 10 each | ✅ (capacity) |
| **Tools** | Grapple, Torch, Lockpick | Equipped | ❌ (story unlocks) |
| **Collectibles** | Artifacts, Documents | Unlimited | N/A |

#### 3.5.2 Upgrade System
**Currency**: Ancient Coins (world pickup + enemy drops)

**Upgrade Trees**:
1. **Combat**: Damage +10% → +20% → +35%; Stamina +20% → +40%
2. **Traversal**: Climb Speed +15% → +30%; Grapple Range +5m → +10m
3. **Survival**: Health +25% → +50%; Ammo Capacity +20% → +50%

**XP System**: N/A (story-driven progression, no leveling)

### 3.6 Health & Resources

#### 3.6.1 Health System
- **Max Health**: 100 HP (base), 150 HP (max upgrade)
- **Regeneration**: N/A (manual healing via health kits)
- **Death**: Checkpoint respawn (last auto-save)

#### 3.6.2 Resource Management
- **Ammo**: Scavenged from world/enemies, crafted at campfires
- **Crafting**: Arrows (Wood + Feathers), Health Kits (Herbs + Cloth)
- **Campfires**: Fast travel, crafting, save point

---

## 4. LEVEL DESIGN

### 4.1 World Structure
**Type**: Hub-and-Spoke (central camp → multiple expeditions)

**World Zones**:
1. **Tutorial Island**: Shipwreck cove, jungle training ground (Chapter 1)
2. **Coastal Ruins**: Beach cliffs, underwater caves (Chapter 2)
3. **Desert Canyon**: Sandstone temples, nomad camps (Chapter 3)
4. **Volcanic Plateau**: Lava flows, obsidian chambers (Chapter 4)
5. **Sky Citadel**: Ancient floating city, final boss (Chapter 5-6)

### 4.2 Level Design Principles
- **Readability**: Clear visual language (yellow = climb, white = path)
- **Verticality**: Multiple layers, encourage exploration
- **Backtracking**: Unlockable shortcuts, new areas with upgrades
- **Pacing**: Combat → Traversal → Puzzle → Cinematic (rhythm)

### 4.3 Optional Content
- **Challenge Tombs** (6x): Standalone puzzle dungeons, cosmetic rewards
- **Collectibles**:
  - Artifacts (30x): Lore entries
  - Documents (20x): Story background
  - Relics (10x): High-value coins
- **Side Quests** (5x): NPC requests, unique weapon skins

---

## 5. NARRATIVE DESIGN

### 5.1 Story Structure
**Act I - Discovery**: Protagonist arrives, uncovers first clues (Chapters 1-2)
**Act II - Conflict**: Rival faction introduced, race to artifacts (Chapters 3-4)
**Act III - Resolution**: Final showdown, moral choice (Chapters 5-6)

### 5.2 Key Characters
| Character | Role | Arc |
|-----------|------|-----|
| **Lyra** | Protagonist | Skeptic → Protector |
| **Marcus** | Mentor (radio contact) | Guides → Sacrifices self (Ch 4) |
| **Kai** | Rival treasure hunter | Antagonist → Reluctant ally |
| **The Architect** | Ancient AI | Reveals truth, final boss |

### 5.3 Cutscenes
- **In-Engine**: 12 major cinematics (3-5 min each)
- **Interactive**: 8 dialogue scenes (player choices, minor branches)
- **Skippable**: All cutscenes (accessibility requirement)

### 5.4 Localization
**Launch Languages**: English, Turkish, German, French, Spanish, Japanese
**Subtitles**: Forced on by default (accessibility)
**Voice Acting**: English (full), Turkish (full), others (subtitles only)

---

## 6. ART DIRECTION

### 6.1 Visual Style
- **Realism Level**: Photorealistic (Unreal Engine 5 Nanite/Lumen)
- **Color Palette**: Earth tones (ochre, bronze, jade) with accent blues (ancient tech)
- **Lighting**: Dynamic time-of-day, volumetric fog, god rays
- **Atmosphere**: Epic scale, sense of awe, danger lurking

### 6.2 Character Design
- **Protagonist**: Practical clothing (cargo pants, climbing harness, weathered jacket)
- **Enemies**:
  - Mercenaries (modern tactical gear)
  - Cultists (robed, masked, ritualistic weapons)
  - Ancient Guardians (stone/metal constructs)

### 6.3 Environment Art
- **Architecture**: Greek columns, Egyptian hieroglyphs, Mesopotamian ziggurats
- **Vegetation**: Overgrown jungle, desert succulents, volcanic ash flora
- **Props**: Ancient pottery, weathered statues, crumbling frescoes

---

## 7. AUDIO DESIGN

### 7.1 Music
- **Adaptive Score**: Exploration (ambient) → Combat (intense) → Victory (triumphant)
- **Composer**: [TBD - Target: Hans Zimmer-style orchestral/electronic hybrid]
- **Themes**:
  - Protagonist theme (hopeful, adventurous)
  - Ancient civilization theme (mysterious, otherworldly)
  - Combat theme (percussion-heavy, adrenaline)

### 7.2 Sound Effects
- **Foley**: Realistic footsteps (surface-dependent), cloth rustles, weapon impacts
- **Environmental**: Wind, water, cave echoes, animal calls
- **UI**: Subtle clicks, satisfying unlocks, non-intrusive alerts

### 7.3 Voice Acting
- **Protagonist**: Strong, intelligent, occasional humor
- **NPCs**: Diverse accents, professional cast
- **Implementation**: Wwise/FMOD, dynamic mixing

---

## 8. USER EXPERIENCE (UX)

### 8.1 UI Design
**Style**: Minimalist diegetic HUD
**Elements**:
- **Health Bar**: Bottom-left, blood vignette at low health
- **Ammo Counter**: Bottom-right, weapon icon
- **Objective Marker**: Top-center, compass style
- **Survival Vision**: Hold button → highlight interactables (yellow glow)

### 8.2 Menus
- **Main Menu**: 3D scene background (campfire), music
- **Pause Menu**: Inventory, Map, Journal, Settings, Save/Load
- **Settings**: Graphics, Audio, Controls, Accessibility, Lydian Account

### 8.3 Accessibility Features
| Feature | Options |
|---------|---------|
| **Difficulty** | Story (easy), Balanced, Survivor (hard) |
| **Subtitles** | Size (S/M/L), Background opacity, Speaker names |
| **Color-Blind** | Deuteranopia, Protanopia, Tritanopia filters |
| **Controls** | Remap all keys/buttons, toggle vs hold, aim assist |
| **Camera** | FOV slider, motion blur on/off, camera shake intensity |
| **Audio** | Separate sliders (music, SFX, dialogue, UI) |

### 8.4 Onboarding
- **Tutorial**: Integrated into Chapter 1 (organic, not intrusive)
- **Tooltips**: Contextual, dismissible, respects "seen" flag
- **Journal**: Recaps story, logs mechanics, hints for puzzles

---

## 9. MONETIZATION & LYDIAN INTEGRATION

### 9.1 Business Model
**Base Game**: Premium ($49.99 / €49.99 / ₺899.99)
**DLC**:
- Story Expansion (6-8 hours): $19.99
- Cosmetic Pack (4 outfits + 2 weapon skins): $4.99
- Soundtrack: $9.99

**NO**:
- Loot boxes
- Pay-to-win mechanics
- Randomized purchases
- In-game ads (without explicit consent)

### 9.2 Lydian Platform Features

#### 9.2.1 Authentication (SSO)
- **Login Flow**: Lydian account → OAuth/OIDC → Game profile
- **Guest Mode**: Offline play, no cloud features
- **Benefits**: Cross-platform saves, exclusive rewards

#### 9.2.2 Cloud Saves
- **Auto-Save**: Every checkpoint, exit game
- **Manual Save**: Campfire locations
- **Conflict Resolution**: Timestamp-based, user choice
- **Data Size**: ~5 MB per save, 10 slots

#### 9.2.3 Marketplace Integration
- **In-Game Store**: Browse DLC, cosmetics
- **Payment**: Lydian wallet (PC only), platform stores (PSN)
- **Receipt Validation**: Server-side, anti-cheat

#### 9.2.4 Telemetry & Analytics
**Collected Data** (GDPR-compliant):
- Session duration, FPS averages
- Level completion times, death locations
- Puzzle solve times, hint usage
- Combat stats (accuracy, playstyle)

**NOT Collected**:
- PII (unless consented for support)
- Voice chat (N/A in single-player)
- Screenshots/videos (unless shared by user)

**Retention**: 180 days, anonymized after 90 days
**Export**: User self-service via Lydian portal

#### 9.2.5 LiveOps
- **News Feed**: Patch notes, community events
- **Seasonal Challenges**: Optional objectives, cosmetic rewards
- **Community Goals**: Global progress tracking (e.g., "1M tombs cleared")

### 9.3 Platform Compliance
- **PS5**: Follow Sony TRC, use PSN for purchases
- **PC**: Steam/Epic integration optional, Lydian primary
- **PEGI/ESRB**: Violence (16+/T), no sexual content, fantasy themes
- **KVKK/GDPR**: Data minimization, purpose tags, right to delete

---

## 10. RISK ASSESSMENT

### 10.1 Design Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Scope Creep** | Schedule slip | Vertical Slice lock, change board approval |
| **Combat Feel** | Poor reception | Early playtest, iterative tuning |
| **Puzzle Difficulty** | Frustration | 3-tier hint system, analytics-driven balancing |
| **Story Pacing** | Player disengagement | Focus groups, skip cutscenes option |

### 10.2 Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Performance Targets** | Fails cert | Device profiles, aggressive optimization |
| **Lydian API Downtime** | Feature loss | Offline mode, graceful degradation |
| **Save Corruption** | Data loss | Versioning, backup slots, cloud redundancy |

### 10.3 Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Licensing Issues** | Asset removal | Pre-cleared library, legal review |
| **Rating Rejection** | Market restriction | Pre-submission PEGI/ESRB review |
| **Monetization Backlash** | Community outcry | Transparent pricing, no P2W |

---

## 11. SUCCESS METRICS (KPIs)

### 11.1 Player Engagement
- **Completion Rate**: ≥40% finish story
- **Average Playtime**: 12-15 hours (main story)
- **Collectible Find Rate**: ≥60% for artifacts
- **Death/Checkpoint**: ≤3 average per hour (balanced difficulty)

### 11.2 Technical Performance
- **FPS**: P95 ≥60fps @ 1440p (PS5)
- **Loading**: <10s initial, <2s level transition
- **Crash-Free Rate**: ≥95% of sessions
- **Hitch Rate**: <2 hitches per 10 minutes

### 11.3 Business Goals
- **Unit Sales**: [TBD - Target: 500k units Year 1]
- **DLC Attach Rate**: ≥25% of base game owners
- **Lydian Registrations**: ≥60% of PC players
- **Review Scores**: Metacritic ≥75, Steam ≥80% positive

---

## 12. NEXT STEPS (Phase-0 → Phase-1)

### 12.1 Immediate Actions
- [ ] Finalize protagonist name/design
- [ ] Create 3D prototype (gray-box level)
- [ ] Implement core traversal (climb/jump/grapple)
- [ ] Build combat prototype (1 enemy type)
- [ ] Develop 1 sample puzzle
- [ ] Integrate Lydian SDK (auth + telemetry)

### 12.2 Milestone 1 (Vertical Slice - 8 weeks)
**Deliverable**: 15-minute playable demo
**Content**:
- 1 complete level (cave → canyon → ruins)
- Traversal showcase (climb, grapple, zipline)
- 1 combat encounter (3 enemies)
- 1 environmental puzzle
- 1 short cinematic (in-engine)
- Lydian SSO integration

**Acceptance**:
- ✅ 60fps @ 1080p (PC min spec)
- ✅ No game-breaking bugs
- ✅ Playtest feedback ≥70% positive
- ✅ Core gameplay loop feels satisfying

---

## 13. APPENDIX

### 13.1 Reference Games
- **Tomb Raider (2013)**: Traversal, combat balance
- **Uncharted 4**: Cinematic storytelling, set pieces
- **God of War (2018)**: Camera, melee combat feel
- **Horizon Zero Dawn**: Open-world structure, collectibles
- **Control**: Environmental puzzles, Metroidvania progression

### 13.2 Inspirational Media
- **Films**: Raiders of the Lost Ark, The Mummy (1999), Apocalypto
- **Books**: Dan Brown's "Da Vinci Code", Clive Cussler's adventure novels
- **Art**: Ian McQue (concept art), Sparth (environment design)

### 13.3 Glossary
- **GDD**: Game Design Document
- **USP**: Unique Selling Point
- **Lydian**: Platform ecosystem (SSO, store, analytics)
- **Vertical Slice**: Polished demo of all game systems
- **TRC**: Technical Requirements Checklist (platform cert)

---

## 14. CHANGE LOG
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-10-11 | Game Integration Architect | Initial GDD draft |

---

## 15. APPROVAL
| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Game Director** | [TBD] | _________ | _____ |
| **Lead Designer** | [TBD] | _________ | _____ |
| **Technical Director** | [TBD] | _________ | _____ |
| **Producer** | [TBD] | _________ | _____ |
| **Legal/Compliance** | [TBD] | _________ | _____ |

---

**Document Classification**: Internal Use Only
**Security**: White-Hat Compliant
**GDPR Status**: Privacy by Design

✅ **Phase-0 GDD Template - READY FOR REVIEW**
