# 🎯 SHARD 16: Unified Chat Architecture

**Goal**: Single-page WhatsApp-like chat with ALL features integrated

**Zero Mock Data** - Real backend integration only

---

## 📋 System Components

### 1. Core Chat Engine
- **Signal Protocol E2EE** (`/lib/crypto/signal.ts`)
- **Redis Message Queue** (`/lib/redis/delivery.ts`)
- **WebSocket Real-time** (Server-Sent Events fallback)
- **IndexedDB Local Storage** (encrypted)

### 2. Feature Modules (All in One Screen)

#### A. Text Messaging
- ✅ E2EE encryption before send
- ✅ Real-time delivery via Redis
- ✅ Read receipts (double check marks)
- ✅ Typing indicators
- ✅ Message reactions
- ✅ Reply/Quote
- ✅ Message edit/delete
- ✅ Search in conversation

#### B. File Sharing
- ✅ Drag & drop upload
- ✅ AES-256-GCM encryption
- ✅ Progress indicator
- ✅ File preview (images, PDFs)
- ✅ Size limits per tier
- ✅ Encrypted thumbnail generation

#### C. Video/Audio Calls
- ✅ WebRTC peer-to-peer
- ✅ SFrame encryption
- ✅ TURN/STUN fallback
- ✅ In-chat call UI (overlay)
- ✅ Screen sharing
- ✅ Call history

#### D. Live Location
- ✅ HTML5 Geolocation
- ✅ Real-time streaming (5s interval)
- ✅ Encrypted coordinates
- ✅ In-chat map preview
- ✅ Duration selector (15min/1hr/8hr)
- ✅ Stop sharing button

#### E. Contact Management
- ✅ User discovery (search)
- ✅ Add contact
- ✅ Contact sync
- ✅ Block/unblock
- ✅ Online status

#### F. Conversation Features
- ✅ Pin conversations
- ✅ Mute notifications
- ✅ Archive chats
- ✅ Delete conversation
- ✅ Export chat (encrypted backup)

---

## 🏗️ Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│              /chat-test (Unified UI)                │
├─────────────────────────────────────────────────────┤
│  Chat List  │  Chat Window  │  Feature Sidebar     │
│             │               │  - Video Call        │
│             │               │  - Location Share    │
│             │               │  - File Upload       │
│             │               │  - Contact Info      │
├─────────────────────────────────────────────────────┤
│         React Context (Chat State Manager)          │
├─────────────────────────────────────────────────────┤
│  Signal   │  Redis    │  WebRTC   │  Geolocation   │
│  Protocol │  Delivery │  Video    │  Streaming     │
├─────────────────────────────────────────────────────┤
│  IndexedDB │  LocalStorage │  Service Worker       │
└─────────────────────────────────────────────────────┘
```

---

## 🔌 Backend Integration Points

### API Endpoints (Real, No Mock)

#### 1. Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/me` - Get current user

#### 2. Messaging
- `POST /api/messages/send` - Send encrypted message
- `GET /api/messages/history/:chatId` - Load message history
- `POST /api/messages/react` - Add reaction
- `DELETE /api/messages/:id` - Delete message
- `PUT /api/messages/:id` - Edit message

#### 3. Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts/add` - Add contact
- `GET /api/contacts/search?q=` - Search users
- `PUT /api/contacts/:id/block` - Block user

#### 4. Files
- `POST /api/files/upload` - Upload encrypted file
- `GET /api/files/:id` - Download encrypted file
- `GET /api/files/:id/thumbnail` - Get thumbnail

#### 5. WebRTC Signaling
- `POST /api/webrtc/offer` - Send offer
- `POST /api/webrtc/answer` - Send answer
- `POST /api/webrtc/ice-candidate` - Exchange ICE

#### 6. Location
- `POST /api/location/start` - Start location session
- `POST /api/location/update` - Update coordinates
- `DELETE /api/location/stop` - Stop sharing

#### 7. Real-time (WebSocket/SSE)
- `WS /api/ws/chat` - WebSocket connection
- `GET /api/sse/chat` - Server-Sent Events fallback

---

## 📦 Data Models

### Message Model
```typescript
interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string; // Encrypted
  contentType: 'text' | 'file' | 'location' | 'call';
  encryptedKey: string; // Per-message key
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string; // Message ID
  reactions?: { userId: string; emoji: string }[];
  editedAt?: number;
  deletedAt?: number;
}
```

### Chat Model
```typescript
interface Chat {
  id: string;
  type: '1-1' | 'group';
  participants: string[]; // User IDs
  name?: string; // For groups
  avatar?: string;
  lastMessage: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  signalSession: SignalSession; // E2EE session
}
```

### User Model
```typescript
interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  publicKey: string; // Signal Protocol
  identityKey: string;
  preKeys: PreKey[];
  onlineStatus: 'online' | 'offline' | 'away';
  lastSeen: number;
}
```

---

## 🎨 UI Components Architecture

### Main Layout
```
┌────────────────────────────────────────────────────┐
│  Header: Logo, Search, Settings, User Profile     │
├──────────┬────────────────────────┬────────────────┤
│          │                        │                │
│  Chat    │   Chat Window          │  Feature       │
│  List    │   ┌──────────────────┐ │  Sidebar       │
│          │   │ Chat Header      │ │                │
│  [Alice] │   ├──────────────────┤ │  [Video Call]  │
│  [Bob]   │   │ Messages         │ │  [Share Loc]   │
│  [Team]  │   │ │ Alice: Hi!     │ │  [Upload File] │
│          │   │ │ You: Hello     │ │  [Contact Info]│
│          │   │ │ ...            │ │                │
│          │   ├──────────────────┤ │                │
│          │   │ Input Bar        │ │                │
│          │   │ [📎][😊][🎤][→] │ │                │
│          │   └──────────────────┘ │                │
│          │                        │                │
└──────────┴────────────────────────┴────────────────┘
```

### Feature Overlays
- **Video Call**: Full-screen overlay with local/remote video
- **Location Share**: In-chat map preview, full-screen map option
- **File Upload**: Drag-drop zone, progress indicator
- **Contact Info**: Slide-in panel from right

---

## 🔒 Security Flow

### Message Send Flow
```
1. User types message
   ↓
2. Encrypt with Signal Protocol (Double Ratchet)
   ↓
3. Generate message ID + timestamp
   ↓
4. Store in IndexedDB (local)
   ↓
5. Send to backend via POST /api/messages/send
   ↓
6. Backend queues in Redis
   ↓
7. Backend delivers via WebSocket to recipient
   ↓
8. Recipient decrypts with their Signal session
   ↓
9. Update UI with delivery/read status
```

### File Share Flow
```
1. User selects file
   ↓
2. Generate AES-256 key
   ↓
3. Encrypt file in chunks (client-side)
   ↓
4. Upload encrypted chunks to /api/files/upload
   ↓
5. Backend stores in encrypted storage
   ↓
6. Send message with file metadata + encrypted key
   ↓
7. Recipient downloads + decrypts
```

---

## ⚡ Real-time Features

### WebSocket Events
```typescript
// Client → Server
ws.send({
  type: 'message.send',
  chatId: 'chat-123',
  encryptedContent: '...',
  timestamp: Date.now()
});

ws.send({
  type: 'typing.start',
  chatId: 'chat-123'
});

// Server → Client
ws.onmessage({
  type: 'message.new',
  message: { ... }
});

ws.onmessage({
  type: 'status.online',
  userId: 'user-456',
  status: 'online'
});
```

---

## 🎯 Implementation Plan

### Phase 1: Core Foundation (Day 1)
1. ✅ Setup ChatContext (React Context API)
2. ✅ Implement Signal Protocol integration
3. ✅ Setup Redis message queue
4. ✅ Create WebSocket connection manager
5. ✅ IndexedDB storage layer

### Phase 2: Text Messaging (Day 1-2)
1. ✅ Send/receive encrypted messages
2. ✅ Message status tracking
3. ✅ Typing indicators
4. ✅ Read receipts
5. ✅ Message reactions
6. ✅ Reply functionality

### Phase 3: File Sharing (Day 2)
1. ✅ Drag & drop UI
2. ✅ File encryption
3. ✅ Upload progress
4. ✅ Download & decrypt
5. ✅ File preview

### Phase 4: Video/Audio Calls (Day 3)
1. ✅ WebRTC setup
2. ✅ Call initiation UI
3. ✅ Local/remote video streams
4. ✅ SFrame encryption
5. ✅ Call controls (mute, video off, hang up)

### Phase 5: Live Location (Day 3)
1. ✅ Geolocation permission
2. ✅ Location encryption
3. ✅ Real-time streaming
4. ✅ Map integration
5. ✅ Duration controls

### Phase 6: Premium UI (Day 4)
1. ✅ Modern gradient design
2. ✅ Premium icons (no emojis)
3. ✅ Smooth animations
4. ✅ Responsive design
5. ✅ Dark mode optimized

### Phase 7: Testing (Day 4-5)
1. ✅ End-to-end message flow
2. ✅ File upload/download
3. ✅ Video call quality
4. ✅ Location accuracy
5. ✅ Performance optimization

---

## 🚀 Technical Stack

### Frontend
- **Framework**: React 18 + Next.js 14
- **State**: React Context API + useReducer
- **UI**: Tailwind CSS + Custom gradients
- **Real-time**: WebSocket API
- **Storage**: IndexedDB + LocalStorage

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js (minimal)
- **Queue**: Redis Pub/Sub
- **WebSocket**: ws library
- **Storage**: File system (encrypted)

### Crypto
- **E2EE**: Signal Protocol (libsignal)
- **File Encryption**: AES-256-GCM
- **Key Exchange**: X3DH + Double Ratchet

### WebRTC
- **Library**: simple-peer
- **Encryption**: SFrame
- **TURN/STUN**: Public servers (coturn)

---

## 📊 Performance Targets

- **Message Latency**: < 100ms
- **File Upload**: 1MB/s minimum
- **Video Quality**: 720p @ 30fps
- **Location Update**: Every 5s
- **UI FPS**: 60fps smooth

---

## ✅ White Hat Principles

1. ✅ **Zero-Knowledge**: Server never sees plaintext
2. ✅ **Transparent Crypto**: Open algorithms (Signal)
3. ✅ **User Control**: Delete, export, block
4. ✅ **Privacy First**: Minimal data collection
5. ✅ **Security Audit**: Regular code reviews

---

**Status**: Architecture Complete ✅
**Next**: Implementation Start 🚀
