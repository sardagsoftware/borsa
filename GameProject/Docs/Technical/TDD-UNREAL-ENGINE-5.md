# TECHNICAL DESIGN DOCUMENT (TDD)
## Unreal Engine 5.4 - AAA Action-Adventure Game

**Version**: 1.0.0
**Date**: 2025-10-11
**Engine**: Unreal Engine 5.4
**Target Platforms**: PS5, PC (Windows 10/11)
**Classification**: Internal - White-Hat Compliant

---

## 1. EXECUTIVE TECHNICAL SUMMARY

### 1.1 Technology Stack Overview
```
┌─────────────────────────────────────────────┐
│         Unreal Engine 5.4 Core              │
├─────────────────────────────────────────────┤
│  Nanite  │  Lumen  │  Chaos  │  Niagara    │
├──────────┴─────────┴─────────┴─────────────┤
│         World Partition + HLOD              │
├─────────────────────────────────────────────┤
│  C++ Modules │ Blueprints │ Animation Sys  │
├─────────────────────────────────────────────┤
│   Lydian SDK   │  Anti-Cheat  │  Telemetry │
├─────────────────────────────────────────────┤
│     Platform APIs (PS5, Windows, Steam)    │
└─────────────────────────────────────────────┘
```

### 1.2 Performance Targets
| Platform | Resolution | FPS Target | GPU Budget | CPU Budget | Memory |
|----------|-----------|------------|------------|------------|--------|
| **PS5** | 1440p (upscaled to 4K) | 60fps | ≤16.6ms | ≤8ms | 12GB VRAM |
| **PC Min** | 1080p | 60fps | ≤16.6ms | ≤10ms | 6GB VRAM |
| **PC Recommended** | 1440p | 60fps | ≤16.6ms | ≤8ms | 8GB VRAM |
| **PC Ultra** | 4K | 60fps | ≤16.6ms | ≤8ms | 12GB VRAM |
| **Cinematic Mode** | 4K | 30fps | ≤33.3ms | ≤16ms | 16GB VRAM |

### 1.3 Technical Pillars
1. **Scalability**: Device profiles for PS5/PC, graceful degradation
2. **Streaming**: World Partition, no loading screens mid-gameplay
3. **Performance**: p95<16.6ms, hitches<2ms, loads<10s
4. **Security**: Anti-cheat, save encryption, server validation
5. **Integration**: Lydian SDK for SSO, store, telemetry, cloud saves

---

## 2. ENGINE ARCHITECTURE

### 2.1 Unreal Engine 5.4 Features

#### 2.1.1 Nanite (Virtualized Geometry)
**Purpose**: High-poly meshes without LOD management
**Target**:
- Triangles on-screen: ≤12M @ 1440p
- Triangle budget: 6-8M average
- Cluster size: 128 triangles
- Streaming pool: 2.5GB

**Usage**:
- ✅ Environmental meshes (rocks, cliffs, architecture)
- ✅ Static props (statues, debris, foliage clusters)
- ❌ Skeletal meshes (use traditional LODs)
- ❌ Foliage cards (use Grass Tool)

**Configuration**:
```ini
[/Script/Engine.RendererSettings]
r.Nanite=1
r.Nanite.MaxPixelsPerEdge=1.0
r.Nanite.ViewMeshLODBias.Offset=0
r.Nanite.ViewMeshLODBias.Min=-2
```

#### 2.1.2 Lumen (Global Illumination)
**Purpose**: Dynamic GI, real-time reflections
**Quality Modes**:
| Mode | Resolution | Tracing Distance | Performance |
|------|-----------|------------------|-------------|
| **Low** | 0.5x | 20m | 3ms GPU |
| **Medium** | 0.75x | 40m | 5ms GPU |
| **High** | 1.0x | 80m | 8ms GPU |
| **Epic** | 1.25x | 160m | 12ms GPU |

**Configuration**:
```ini
[/Script/Engine.RendererSettings]
r.Lumen.DiffuseIndirect.Allow=1
r.Lumen.Reflections.Allow=1
r.Lumen.TranslucencyReflections.FrontLayer.Allow=1
r.LumenScene.Radiosity.ProbeSpacing=4.0
r.LumenScene.Radiosity.HemisphereProbeResolution=4
```

**PS5 Settings**: Medium quality (60fps), High for 30fps mode

#### 2.1.3 World Partition
**Purpose**: Streaming large worlds, no level transitions
**Configuration**:
- Grid size: 51,200cm x 51,200cm (512m tiles)
- Loading range: 2 grids (1024m radius)
- HLOD layers: 3 levels (LOD0→LOD1→LOD2)
- Data layers: Gameplay, Audio, Lighting

**Streaming Strategy**:
- Player movement prediction: 2s ahead
- Priority: Distance + camera facing + quest markers
- Unload: 3 grids behind player (1536m)

#### 2.1.4 Chaos Physics
**Purpose**: Destruction, ragdolls, interactive objects
**Budget**: ≤2.5ms CPU
**Features**:
- Destruction: Pre-fractured meshes (Voronoi), 50 pieces max
- Ragdoll: 15 bodies, 30 constraints per character
- Cloth: Apex cloth (4m² per cloth, 5 active simultaneously)

**Configuration**:
```ini
[/Script/Engine.PhysicsSettings]
SolverOptions.PositionIterations=8
SolverOptions.VelocityIterations=1
ChaosSettings.DefaultThreadingModel=DedicatedThread
```

#### 2.1.5 Niagara (VFX)
**Purpose**: Particle effects (fire, smoke, magic, impacts)
**Budget**: ≤2ms GPU
**Pools**:
- Ambient FX: 10 systems, 5k particles total
- Combat FX: 15 systems, 10k particles total
- Destruction: 5 systems, 2k particles total

**Optimization**:
- GPU culling: Distance (50m), frustum, occlusion
- LOD: 3 levels (Near→Mid→Far)
- Pooling: Pre-spawn 20 systems, recycle

---

## 3. MODULE ARCHITECTURE

### 3.1 C++ Module Structure
```
GameProject/
├── Source/
│   ├── GameProjectCore/          [Core systems, game mode, player controller]
│   ├── GameProjectPlayer/         [Character, movement, camera]
│   ├── GameProjectAI/             [Enemy AI, behavior trees, perception]
│   ├── GameProjectCombat/         [Damage, weapons, combat state]
│   ├── GameProjectTraversal/      [Climbing, grappling, parkour]
│   ├── GameProjectInteraction/    [Pickups, doors, levers, UI prompts]
│   ├── GameProjectInventory/      [Items, upgrades, crafting]
│   ├── GameProjectOnline/         [Lydian SDK wrapper, telemetry]
│   └── GameProjectUI/             [HUD, menus, localization]
```

### 3.2 Module Dependencies
```
GameProjectCore (Base)
  ├─> GameProjectPlayer
  │     ├─> GameProjectTraversal
  │     ├─> GameProjectCombat
  │     └─> GameProjectInventory
  ├─> GameProjectAI
  │     └─> GameProjectCombat
  ├─> GameProjectInteraction
  └─> GameProjectOnline
        └─> LydianSDK (Plugin)
```

### 3.3 Core Module (GameProjectCore)

#### 3.3.1 Game Mode
```cpp
UCLASS()
class GAMEPROJECTCORE_API AGameProjectGameMode : public AGameModeBase
{
    GENERATED_BODY()
public:
    virtual void InitGame(const FString& MapName, const FString& Options, FString& ErrorMessage) override;
    virtual void RestartPlayer(AController* NewPlayer) override;

    // Save/Load
    UFUNCTION(BlueprintCallable)
    void SaveGameToSlot(int32 SlotIndex);

    UFUNCTION(BlueprintCallable)
    UGameProjectSaveGame* LoadGameFromSlot(int32 SlotIndex);

    // Checkpoint
    UFUNCTION()
    void SetCheckpoint(FVector Location, FRotator Rotation);
};
```

#### 3.3.2 Save Game System
```cpp
UCLASS()
class UGameProjectSaveGame : public USaveGame
{
    GENERATED_BODY()
public:
    // Player data
    UPROPERTY()
    FVector PlayerLocation;

    UPROPERTY()
    FRotator PlayerRotation;

    UPROPERTY()
    float PlayerHealth;

    // Progression
    UPROPERTY()
    int32 ChapterIndex;

    UPROPERTY()
    TArray<FName> UnlockedAbilities;

    UPROPERTY()
    TArray<FName> CollectedItems;

    // Inventory
    UPROPERTY()
    TMap<FName, int32> InventoryCounts; // ItemID -> Quantity

    // Upgrades
    UPROPERTY()
    TMap<FName, int32> UpgradeLevels; // UpgradeID -> Level (0-3)

    // Encryption (AES-256-GCM)
    UPROPERTY()
    TArray<uint8> EncryptedBlob;

    UPROPERTY()
    FString HMAC_SHA256;
};
```

### 3.4 Player Module (GameProjectPlayer)

#### 3.4.1 Character Class
```cpp
UCLASS()
class GAMEPROJECTPLAYER_API AGameProjectCharacter : public ACharacter
{
    GENERATED_BODY()
public:
    // Components
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UCameraComponent* FollowCamera;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    USpringArmComponent* CameraBoom;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UGameProjectCombatComponent* CombatComponent;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UGameProjectTraversalComponent* TraversalComponent;

    // Stats
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    float MaxHealth = 100.0f;

    UPROPERTY(Replicated, BlueprintReadOnly, Category = "Stats")
    float CurrentHealth = 100.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    float MaxStamina = 100.0f;

    UPROPERTY(Replicated, BlueprintReadOnly, Category = "Stats")
    float CurrentStamina = 100.0f;

    // Input
    virtual void SetupPlayerInputComponent(UInputComponent* PlayerInputComponent) override;

    // Actions
    void MoveForward(float Value);
    void MoveRight(float Value);
    void LookUp(float Value);
    void Turn(float Value);
    void Jump() override;
    void Crouch();
    void Sprint();
};
```

#### 3.4.2 Enhanced Input System
```cpp
// Input Action Assets
UCLASS()
class UGameProjectInputConfig : public UDataAsset
{
    GENERATED_BODY()
public:
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly)
    UInputAction* MoveAction;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly)
    UInputAction* LookAction;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly)
    UInputAction* JumpAction;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly)
    UInputAction* AttackAction;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly)
    UInputAction* GrappleAction;
};
```

### 3.5 AI Module (GameProjectAI)

#### 3.5.1 Enemy Base Class
```cpp
UCLASS()
class GAMEPROJECTAI_API AGameProjectEnemyCharacter : public ACharacter
{
    GENERATED_BODY()
public:
    // AI Components
    UPROPERTY(VisibleAnywhere)
    UAIPerceptionComponent* PerceptionComponent;

    UPROPERTY(EditAnywhere, Category = "AI")
    UBehaviorTree* BehaviorTree;

    // Stats
    UPROPERTY(EditAnywhere, Category = "Stats")
    float MaxHealth = 100.0f;

    UPROPERTY(Replicated)
    float CurrentHealth = 100.0f;

    // AI Behavior
    UPROPERTY(EditAnywhere, Category = "AI")
    float SightRadius = 1500.0f;

    UPROPERTY(EditAnywhere, Category = "AI")
    float LoseSightRadius = 2000.0f;

    UPROPERTY(EditAnywhere, Category = "AI")
    float PeripheralVisionAngleDegrees = 90.0f;
};
```

#### 3.5.2 Behavior Tree Structure
```
Root
├─ Selector (Combat/Patrol/Investigate)
│   ├─ Sequence [Combat - Has Target]
│   │   ├─ Move To Target (Attack Range)
│   │   ├─ Attack (Light/Heavy)
│   │   └─ Dodge (If Player Attacks)
│   ├─ Sequence [Investigate - Heard Sound]
│   │   ├─ Move To Last Known Position
│   │   ├─ Look Around (Search Pattern)
│   │   └─ Return To Patrol (After 10s)
│   └─ Sequence [Patrol - Default]
│       ├─ Get Next Patrol Point
│       ├─ Move To Patrol Point
│       └─ Wait (2-5s Random)
```

### 3.6 Combat Module (GameProjectCombat)

#### 3.6.1 Damage System
```cpp
USTRUCT(BlueprintType)
struct FGameProjectDamageInfo
{
    GENERATED_BODY()

    UPROPERTY()
    float BaseDamage = 10.0f;

    UPROPERTY()
    EDamageType DamageType; // Melee, Ranged, Environmental

    UPROPERTY()
    AActor* DamageCauser;

    UPROPERTY()
    FVector HitLocation;

    UPROPERTY()
    bool bIsHeadshot = false;

    UPROPERTY()
    bool bIsCritical = false;
};

UCLASS()
class GAMEPROJECTCOMBAT_API UGameProjectCombatComponent : public UActorComponent
{
    GENERATED_BODY()
public:
    // Apply damage
    UFUNCTION(BlueprintCallable)
    void ApplyDamage(const FGameProjectDamageInfo& DamageInfo);

    // Lock-on system
    UFUNCTION(BlueprintCallable)
    AActor* GetLockOnTarget();

    UFUNCTION()
    void SetLockOnTarget(AActor* NewTarget);

    // Combo system
    UPROPERTY()
    int32 ComboCount = 0;

    UPROPERTY()
    float LastAttackTime = 0.0f;

    UPROPERTY(EditAnywhere, Category = "Combat")
    float ComboResetTime = 1.5f;
};
```

### 3.7 Traversal Module (GameProjectTraversal)

#### 3.7.1 Climb System
```cpp
UCLASS()
class GAMEPROJECTTRAVERSAL_API UGameProjectClimbComponent : public UActorComponent
{
    GENERATED_BODY()
public:
    // State machine
    UPROPERTY()
    EClimbState CurrentState = EClimbState::NotClimbing;

    // Trace detection
    UFUNCTION()
    bool CanStartClimb(FVector& OutLedgeLocation, FVector& OutLedgeNormal);

    UFUNCTION()
    void StartClimbing();

    UFUNCTION()
    void StopClimbing();

    // Movement
    UFUNCTION()
    void ClimbMove(float ForwardValue, float RightValue);

    UPROPERTY(EditAnywhere, Category = "Climb")
    float ClimbSpeed = 300.0f;

    UPROPERTY(EditAnywhere, Category = "Climb")
    float ClimbReach = 80.0f; // Next ledge detection range
};

UENUM(BlueprintType)
enum class EClimbState : uint8
{
    NotClimbing,
    Climbing,
    Shimmying,
    Vaulting,
    Jumping
};
```

#### 3.7.2 Grapple System
```cpp
UCLASS()
class UGameProjectGrappleComponent : public UActorComponent
{
    GENERATED_BODY()
public:
    UPROPERTY(EditAnywhere, Category = "Grapple")
    float MaxGrappleDistance = 2000.0f;

    UPROPERTY(EditAnywhere, Category = "Grapple")
    float GrappleSpeed = 1500.0f;

    UPROPERTY()
    UCableComponent* GrappleCable;

    UFUNCTION(BlueprintCallable)
    bool TryGrapple(FVector TargetLocation);

    UFUNCTION()
    void UpdateGrappleSwing(float DeltaTime);

    UFUNCTION()
    void ReleaseGrapple();
};
```

---

## 4. ASSET PIPELINE

### 4.1 DCC Tool Chain
| Asset Type | Source Tool | Export Format | UE Import Settings |
|------------|-------------|---------------|-------------------|
| **Static Meshes** | Blender 4.0+ | FBX 2020 | Nanite: ON, LOD: Auto |
| **Skeletal Meshes** | Maya 2024+ | FBX 2020 | IK Retargeter, LOD: Manual (4) |
| **Animations** | MotionBuilder | FBX 2020 | 30fps, Root Motion |
| **Textures** | Substance 3D | PNG/TGA (4K) | Virtual Texture: ON, Mip Gen: ON |
| **VFX** | Houdini 20+ | HDA/FBX | Niagara Emitters |
| **Audio** | Wwise/FMOD | .wav 48kHz | Compression: Vorbis |

### 4.2 Texture Budget
| Asset Category | Texture Size | Format | VRAM Budget |
|----------------|-------------|--------|-------------|
| **Characters** | 2048x2048 (body) | BC7 (Albedo), BC5 (Normal) | 80MB (5 chars) |
| **Environments** | 4096x4096 (terrain) | BC7 (VT) | 500MB (Nanite) |
| **Props** | 1024x1024 | BC7 | 300MB |
| **UI** | 512x512 (icons) | BC7 | 50MB |
| **VFX** | 512x512 (sprites) | BC4 (Grayscale) | 100MB |

**Total VRAM Target**: 2.5GB textures (PS5), 1.8GB (PC Min)

### 4.3 Poly Budget
| Asset Type | Triangles (LOD0) | Triangles (LOD1) | Triangles (LOD2) | Notes |
|------------|------------------|------------------|------------------|-------|
| **Main Character** | 50k | 25k | 10k | Skeletal, 4 LODs |
| **Enemy (Melee)** | 30k | 15k | 7k | Skeletal, 4 LODs |
| **Environment (Nanite)** | 500k-2M | N/A | N/A | Virtualized |
| **Prop (Small)** | 5k | 2k | 500 | 3 LODs |
| **Prop (Large)** | 20k | 10k | 3k | Nanite if static |

### 4.4 Animation Budget
- **Locomotion**: 20 animations (idle, walk, run, crouch, sprint)
- **Combat**: 40 animations (light/heavy attacks, dodge, parry, hit-react, death)
- **Traversal**: 30 animations (climb, vault, grapple, hang, slide)
- **Cinematic**: 50 animations (cutscenes, specific to story beats)

**Total**: ~140 animations, ~8 GB uncompressed → 2 GB compressed (Compression: Automatic)

### 4.5 Audio Budget
- **Music**: 60 min adaptive score, Vorbis Q8 → 120 MB
- **SFX**: 2000 sounds, Vorbis Q6 → 250 MB
- **VO**: 4 hours dialogue, Vorbis Q7 → 180 MB
- **Ambience**: 30 min loops, Vorbis Q6 → 50 MB

**Total**: 600 MB audio

---

## 5. PERFORMANCE OPTIMIZATION

### 5.1 GPU Budget Breakdown (16.6ms @ 60fps)
| System | Budget | Actual (Target) | Notes |
|--------|--------|-----------------|-------|
| **Nanite Rasterization** | 4.0ms | 3.5ms | Mesh rendering |
| **Lumen GI** | 5.0ms | 4.5ms | Diffuse + reflections |
| **Shadows** | 2.5ms | 2.2ms | VSM, 2 cascades |
| **Post-Processing** | 2.0ms | 1.8ms | Bloom, DOF, motion blur |
| **Niagara VFX** | 2.0ms | 1.5ms | Particle effects |
| **UI/HUD** | 0.5ms | 0.3ms | Slate rendering |
| **Misc** | 0.6ms | 0.4ms | Decals, translucency |

**Total**: 16.6ms target, 14.2ms actual (2.4ms headroom)

### 5.2 CPU Budget Breakdown (8ms @ 60fps - PS5)
| System | Budget | Actual (Target) | Notes |
|--------|--------|-----------------|-------|
| **Game Thread** | 5.0ms | 4.2ms | Gameplay logic, AI, physics |
| **Animation** | 2.0ms | 1.8ms | State machines, IK |
| **Physics (Chaos)** | 2.5ms | 2.2ms | Collision, ragdolls |
| **Audio (Wwise)** | 1.5ms | 1.2ms | 3D positioning, mixing |
| **Networking** | 0.5ms | 0.3ms | Lydian API calls (async) |

**Total**: 8ms target, 7.5ms actual (0.5ms headroom)

### 5.3 Memory Budget (PS5)
| Category | Budget | Notes |
|----------|--------|-------|
| **VRAM (GPU)** | 12 GB | 2.5GB textures, 1GB geometry, 8.5GB systems |
| **RAM (CPU)** | 13.5 GB | OS reserves 2.5GB of 16GB |
| **Streaming Pool** | 3 GB | World Partition assets |

### 5.4 Optimization Techniques

#### 5.4.1 LOD Strategy
- **Nanite**: Automatic virtualized LODs (disabled if <5k triangles)
- **Skeletal Meshes**: 4 manual LODs
  - LOD0: 0-10m (full detail)
  - LOD1: 10-25m (50% triangles)
  - LOD2: 25-50m (20% triangles)
  - LOD3: 50m+ (10% triangles, simplified skeleton)

#### 5.4.2 HLOD (Hierarchical LOD)
- **Layer 0**: Individual meshes (0-50m)
- **Layer 1**: Merged proxy (50-150m)
- **Layer 2**: Billboard impostor (150m+)

#### 5.4.3 Occlusion Culling
- **Software Occlusion**: Nanite hardware-accelerated
- **Hierarchical Z-Buffer**: For non-Nanite meshes
- **Precomputed Visibility**: Indoor areas only

#### 5.4.4 Streaming
- **World Partition**: Tile-based streaming (512m grid)
- **Texture Streaming**: Virtual textures, mip bias
- **Audio Streaming**: Wwise stream bank (music, VO)

#### 5.4.5 PSO Caching
- **Precompile Shaders**: On first launch (5-10 min)
- **PSO Cache**: Store per-device, reduce hitches
- **Async Compile**: Background shader compilation

---

## 6. PLATFORM-SPECIFIC DETAILS

### 6.1 PS5 Architecture
**CPU**: AMD Zen 2 (8 cores @ 3.5GHz)
**GPU**: AMD RDNA 2 (10.28 TFLOPs, 36 CUs @ 2.23GHz)
**RAM**: 16 GB GDDR6 (shared)
**SSD**: 825 GB (5.5 GB/s raw)

**Optimizations**:
- **Geometry Engine**: Nanite-native acceleration
- **Cache Scrubbers**: Reduce memory thrashing
- **Tempest 3D**: Spatial audio (Wwise integration)
- **Fast Loading**: Oodle Kraken compression, direct SSD streaming

**Device Profile** (`DeviceProfiles.ini`):
```ini
[PS5]
r.Nanite=1
r.Lumen.Reflections.Allow=1
r.Shadow.Virtual.Enable=1
r.Streaming.PoolSize=3072
r.ScreenPercentage=100
```

### 6.2 PC Specifications

#### 6.2.1 Minimum (1080p @ 60fps)
- **CPU**: Intel i5-10400 / AMD Ryzen 5 3600
- **GPU**: NVIDIA GTX 1660 Ti (6GB) / AMD RX 5600 XT
- **RAM**: 16 GB DDR4
- **Storage**: 80 GB SSD

**Device Profile** (`PCMinSpec`):
```ini
[PCMinSpec]
r.Nanite=1
r.Lumen.Reflections.Allow=0  ; Use SSR
r.Shadow.Virtual.Enable=0    ; Use CSM
r.Streaming.PoolSize=2048
r.ScreenPercentage=75  ; Upscale from 810p
```

#### 6.2.2 Recommended (1440p @ 60fps)
- **CPU**: Intel i7-12700K / AMD Ryzen 7 5800X
- **GPU**: NVIDIA RTX 3070 (8GB) / AMD RX 6800
- **RAM**: 16 GB DDR4
- **Storage**: 80 GB NVMe SSD

**Device Profile** (`PCRecommended`):
```ini
[PCRecommended]
r.Nanite=1
r.Lumen.Reflections.Allow=1
r.Shadow.Virtual.Enable=1
r.Streaming.PoolSize=3072
r.ScreenPercentage=100
```

#### 6.2.3 Ultra (4K @ 60fps)
- **CPU**: Intel i9-13900K / AMD Ryzen 9 7950X
- **GPU**: NVIDIA RTX 4080 (16GB) / AMD RX 7900 XTX
- **RAM**: 32 GB DDR5
- **Storage**: 100 GB NVMe Gen4

**Device Profile** (`PCUltra`):
```ini
[PCUltra]
r.Nanite=1
r.Lumen.Reflections.Allow=1
r.Lumen.Reflections.ScreenTraces=1
r.Shadow.Virtual.Enable=1
r.Streaming.PoolSize=4096
r.ScreenPercentage=100
r.PostProcessAAQuality=6  ; TXAA
```

---

## 7. NETWORKING & ONLINE (LYDIAN INTEGRATION)

### 7.1 Lydian SDK Architecture
```
Game (C++)
  └─> LydianSDK Plugin (C++)
        ├─> HTTP Client (libcurl / UE HTTP)
        ├─> JSON Parser (RapidJSON)
        ├─> Crypto (AES-256-GCM, HMAC-SHA256)
        └─> Telemetry Queue (async batching)
```

### 7.2 API Contracts (REST/HTTPS)

#### 7.2.1 Authentication
```http
POST /lydian/auth/exchange
Content-Type: application/json
Authorization: Bearer <PlatformToken>

Request:
{
  "platformId": "PSN" | "Steam" | "EGS",
  "platformTicket": "base64-encoded-ticket"
}

Response (200 OK):
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-jwt",
  "expiresIn": 3600,
  "user": {
    "lydianId": "uuid",
    "displayName": "string",
    "ageBand": "13-17|18-24|25+",
    "region": "TR|US|EU|..."
  }
}
```

#### 7.2.2 Cloud Save
```http
GET /lydian/save/get
Authorization: Bearer <LydianAccessToken>
X-Game-Version: 1.0.0

Response (200 OK):
{
  "saveData": "base64-encoded-blob",
  "version": 5,
  "lastModified": "2025-10-11T19:00:00Z"
}

POST /lydian/save/put
Authorization: Bearer <LydianAccessToken>
Content-Type: application/json

Request:
{
  "saveData": "base64-encoded-blob",
  "version": 6,
  "checksum": "sha256-hash"
}

Response (200 OK):
{
  "success": true,
  "version": 6
}
```

#### 7.2.3 Store/Marketplace
```http
GET /lydian/store/offers?locale=tr-TR
Authorization: Bearer <LydianAccessToken>

Response (200 OK):
{
  "offers": [
    {
      "id": "dlc-chapter-7",
      "title": "Lost Chapters DLC",
      "description": "...",
      "price": 19.99,
      "currency": "USD",
      "imageUrl": "https://..."
    }
  ]
}

POST /lydian/store/purchase
Authorization: Bearer <LydianAccessToken>
Content-Type: application/json

Request:
{
  "offerId": "dlc-chapter-7",
  "paymentMethod": "lydian-wallet"
}

Response (200 OK):
{
  "receiptId": "uuid",
  "status": "completed",
  "entitlementId": "uuid"
}
```

#### 7.2.4 Telemetry
```http
POST /lydian/telemetry/event
Authorization: Bearer <LydianAccessToken>
Content-Type: application/json

Request:
{
  "sessionId": "uuid",
  "events": [
    {
      "type": "gameplay.level_complete",
      "timestamp": "2025-10-11T19:30:00Z",
      "payload": {
        "levelId": "chapter-2",
        "duration": 1245,
        "deaths": 3
      }
    }
  ]
}

Response (202 Accepted):
{
  "accepted": 1
}
```

### 7.3 Security Measures

#### 7.3.1 Save Encryption
```cpp
// AES-256-GCM encryption
class USaveEncryption
{
public:
    static TArray<uint8> Encrypt(const TArray<uint8>& PlainText, const FString& Key);
    static TArray<uint8> Decrypt(const TArray<uint8>& CipherText, const FString& Key);
    static FString GenerateHMAC(const TArray<uint8>& Data, const FString& Secret);
};
```

#### 7.3.2 Anti-Cheat (Lite)
```cpp
UCLASS()
class UAntiCheatComponent : public UActorComponent
{
    GENERATED_BODY()
public:
    // Memory integrity
    UFUNCTION()
    bool VerifyMemoryIntegrity();

    // Debug detection
    UFUNCTION()
    bool IsDebuggerPresent();

    // Speed hack detection
    UPROPERTY()
    float LastTickTime;

    UFUNCTION()
    bool DetectSpeedHack();

    // Secure save validation
    UFUNCTION()
    bool ValidateSaveChecksum(const UGameProjectSaveGame* SaveGame);
};
```

#### 7.3.3 Server-Side Validation
- **Purchase validation**: Server checks receipt before granting entitlement
- **Telemetry anomaly detection**: Flag impossible stats (e.g., 1000 kills in 10s)
- **Rate limiting**: Max 100 API calls per minute per user

---

## 8. BUILD & CI/CD PIPELINE

### 8.1 Version Control
**System**: Git + Git LFS
**Branch Strategy**: GitFlow
- `main`: Production-ready builds
- `develop`: Active development
- `feature/*`: Feature branches
- `hotfix/*`: Critical fixes

**LFS Patterns**:
```
*.uasset
*.umap
*.fbx
*.png
*.wav
*.mp4
```

### 8.2 CI/CD Architecture
```
GitHub Actions
  ├─> Build (Win64 + PS5 DevKit)
  ├─> Unit Tests (GTest + UE Automation)
  ├─> Asset Validation (Texture size, LOD count)
  ├─> Packaging (Paks + DLC)
  ├─> Code Signing (cosign)
  └─> Deployment (Steam, PSN, Lydian CDN)
```

### 8.3 Build Configuration
```yaml
# .github/workflows/build.yml
name: UE5 Game Build

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop]

jobs:
  build-win64:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
        with:
          lfs: true

      - name: Setup Unreal Engine
        run: |
          # Install UE 5.4 from Epic Games Launcher

      - name: Build Project
        run: |
          RunUAT.bat BuildCookRun ^
            -project=GameProject.uproject ^
            -platform=Win64 ^
            -clientconfig=Development ^
            -cook -build -stage -pak

      - name: Run Tests
        run: |
          UnrealEditor-Cmd.exe GameProject.uproject ^
            -ExecCmds="Automation RunTests System" ^
            -unattended -nopause -nullrhi

      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: Win64-Build
          path: Saved/StagedBuilds/Win64/
```

### 8.4 Packaging Scripts
```bat
REM build-shipping.bat
@echo off
SET PROJECT_PATH=C:\GameProject\GameProject.uproject
SET OUTPUT_DIR=C:\GameProject\Builds\Shipping

RunUAT.bat BuildCookRun ^
  -project=%PROJECT_PATH% ^
  -noP4 ^
  -platform=Win64 ^
  -clientconfig=Shipping ^
  -serverconfig=Shipping ^
  -cook ^
  -build ^
  -stage ^
  -pak ^
  -archive ^
  -archivedirectory=%OUTPUT_DIR% ^
  -compressed

echo Build complete: %OUTPUT_DIR%
pause
```

---

## 9. TESTING STRATEGY

### 9.1 Test Pyramid
```
                  /\
                 /  \  Manual QA
                /____\
               /      \  Playtests
              /________\
             /          \  Integration
            /____________\
           /              \  Unit Tests
          /__________________\
```

### 9.2 Unit Tests (C++)
```cpp
// Tests/GameProjectCore/SaveGameTest.cpp
#include "Misc/AutomationTest.h"
#include "GameProjectSaveGame.h"

IMPLEMENT_SIMPLE_AUTOMATION_TEST(FSaveGameEncryptionTest,
    "GameProject.Core.SaveGame.Encryption",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FSaveGameEncryptionTest::RunTest(const FString& Parameters)
{
    // Create save data
    UGameProjectSaveGame* SaveGame = NewObject<UGameProjectSaveGame>();
    SaveGame->PlayerHealth = 75.0f;
    SaveGame->ChapterIndex = 3;

    // Encrypt
    TArray<uint8> Encrypted = USaveEncryption::Encrypt(SaveGame->EncryptedBlob, TEXT("TestKey"));

    // Decrypt
    TArray<uint8> Decrypted = USaveEncryption::Decrypt(Encrypted, TEXT("TestKey"));

    // Verify
    TestEqual("Decrypted data matches original", Decrypted, SaveGame->EncryptedBlob);

    return true;
}
```

### 9.3 Functional Tests (Blueprints)
```
FunctionalTest: LevelCompletion
  ├─> Spawn Player at Checkpoint
  ├─> Trigger Enemy Encounter
  ├─> Wait for All Enemies Defeated
  ├─> Verify Door Unlocked
  └─> Assert Player Can Progress
```

### 9.4 Performance Tests
```cpp
IMPLEMENT_SIMPLE_AUTOMATION_TEST(FPerformanceTest,
    "GameProject.Performance.GPUFrame",
    EAutomationTestFlags::ApplicationContextMask | EAutomationTestFlags::ProductFilter)

bool FPerformanceTest::RunTest(const FString& Parameters)
{
    // Capture 300 frames (5 seconds @ 60fps)
    TArray<float> FrameTimes;
    for (int32 i = 0; i < 300; ++i)
    {
        float GPUTime = GEngine->GetGPUFrameTime();
        FrameTimes.Add(GPUTime);
    }

    // Calculate p95
    FrameTimes.Sort();
    float P95 = FrameTimes[FMath::FloorToInt(300 * 0.95)];

    // Assert p95 < 16.6ms (60fps)
    TestTrue("P95 GPU frame time < 16.6ms", P95 < 16.6f);

    return true;
}
```

---

## 10. COMPLIANCE & LEGAL

### 10.1 Platform Certification

#### 10.1.1 PS5 TRC (Technical Requirements Checklist)
- **Boot Time**: <10s from cold start
- **Save Data**: Must auto-save, manual save optional
- **Trophy Support**: 12+ trophies (Bronze/Silver/Gold/Platinum)
- **Activity Cards**: Support PS5 activity tracking
- **DualSense**: Haptic feedback + adaptive triggers
- **3D Audio**: Tempest 3D engine support
- **Accessibility**: Subtitles, difficulty options, remap controls

#### 10.1.2 PEGI Rating (Expected: 16)
- **Violence**: Realistic combat, blood effects (no dismemberment)
- **Language**: Mild profanity (maximum 5 instances of strong language)
- **Fear**: Tense sequences, dark environments
- **Online**: Telemetry disclosure in EULA

### 10.2 KVKK/GDPR Compliance

#### 10.2.1 Data Collection
**Collected**:
- Player ID (Lydian UUID)
- Gameplay telemetry (session duration, FPS, deaths, progress)
- Settings preferences (difficulty, graphics, audio)
- Crash reports (stack traces, system info)

**NOT Collected**:
- Real name, email (unless provided via Lydian SSO)
- Voice/video (N/A in single-player)
- Location (IP geolocation only for region, not stored)

#### 10.2.2 Data Retention
- **Active users**: 180 days
- **Inactive users**: Anonymized after 90 days inactivity
- **Deleted accounts**: 30 days grace period, then purged

#### 10.2.3 User Rights
- **Access**: Export all data via Lydian portal
- **Rectification**: Correct inaccurate data
- **Erasure**: Delete account + all data
- **Portability**: JSON export of all gameplay data

---

## 11. RISK MITIGATION

### 11.1 Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **FPS drops below 60** | Medium | High | Device profiles, aggressive LOD, HLOD |
| **Lydian API downtime** | Low | Medium | Offline mode, graceful degradation |
| **Save corruption** | Low | High | Versioning, cloud backup, checksum validation |
| **Shader compilation hitches** | High | Medium | PSO caching, async compilation |
| **Memory leaks** | Medium | High | UE memory profiler, automated leak detection |

### 11.2 Platform Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **PS5 cert rejection** | Low | High | Pre-submission TRC review, test on devkit |
| **Engine version incompatibility** | Low | Medium | Lock to UE 5.4.x, avoid preview features |
| **Third-party plugin bugs** | Medium | Medium | Vet plugins, maintain fallback code |

---

## 12. DELIVERABLES

### 12.1 Phase-0 (Current)
- [x] Project structure
- [x] GDD template
- [x] TDD (this document)
- [ ] Lydian SDK contracts
- [ ] Asset pipeline documentation
- [ ] Performance budget spreadsheet
- [ ] CI/CD setup
- [ ] Compliance checklist

### 12.2 Phase-1 (Vertical Slice - 8 weeks)
- [ ] UE5 project initialized
- [ ] Core modules (Player, Combat, Traversal)
- [ ] 1 playable level (gray-box)
- [ ] Lydian SDK integration (auth + telemetry)
- [ ] 60fps @ 1080p (PC min)

### 12.3 Phase-2 (Alpha - 6 months)
- [ ] All gameplay systems complete
- [ ] 60% content (3 chapters)
- [ ] Full Lydian integration (store, saves, LiveOps)
- [ ] PS5 devkit builds
- [ ] Performance: p95 < 20ms (need optimization)

### 12.4 Phase-3 (Beta - 3 months)
- [ ] 100% content (6 chapters)
- [ ] Localization (6 languages)
- [ ] QA pass (functional, compatibility)
- [ ] Performance: p95 < 16.6ms (optimized)
- [ ] PS5 TRC checklist complete

### 12.5 Phase-4 (Gold - 1 month)
- [ ] Cert submission (PS5, Steam)
- [ ] Day-1 patch prepared
- [ ] LiveOps content pipeline
- [ ] Launch marketing assets

---

## 13. APPENDIX

### 13.1 Unreal Engine Resources
- **Documentation**: https://docs.unrealengine.com/5.4/
- **Performance Guidelines**: https://docs.unrealengine.com/5.4/en-US/performance-guidelines/
- **Nanite**: https://docs.unrealengine.com/5.4/en-US/nanite-virtualized-geometry-in-unreal-engine/
- **Lumen**: https://docs.unrealengine.com/5.4/en-US/lumen-global-illumination-and-reflections-in-unreal-engine/

### 13.2 PS5 Development
- **DevNet**: https://p.siedev.net/ (NDA required)
- **ProDG**: PS5 debugging tools
- **Razor**: PS5 profiling suite

### 13.3 Profiling Tools
- **Unreal Insights**: Built-in profiler (CPU, GPU, memory)
- **RenderDoc**: GPU frame capture
- **PIX**: Windows GPU profiler
- **Superluminal**: C++ CPU profiler

---

## 14. CHANGE LOG
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-10-11 | Technical Architect | Initial TDD |

---

## 15. APPROVAL
| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Technical Director** | [TBD] | _________ | _____ |
| **Lead Programmer** | [TBD] | _________ | _____ |
| **Platform Engineer** | [TBD] | _________ | _____ |
| **Producer** | [TBD] | _________ | _____ |

---

**Document Classification**: Internal Use Only
**Security**: White-Hat Compliant
**Performance Targets**: 60fps @ 1440p (PS5)

✅ **Phase-0 TDD - READY FOR IMPLEMENTATION**
