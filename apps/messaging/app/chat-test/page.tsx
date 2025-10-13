/**
 * SHARD_16 - Unified Messaging Hub with i18n
 * Chat + Dashboard + Settings in ONE revolutionary interface
 *
 * Features:
 * - Multi-language support (Turkish/English)
 * - Multi-tab navigation (Chat/Dashboard/Settings)
 * - Glass morphism/Holographic design
 * - Real-time E2EE messaging
 * - Video/Audio calls
 * - Live location sharing
 * - Encrypted file uploads
 * - Analytics dashboard
 * - Comprehensive settings (9 panels)
 *
 * Design: Ultra-modern, unique, futuristic
 * Default Language: Turkish (TR)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { LanguageProvider, useTranslation } from '@/lib/i18n/LanguageContext';
import { ChatProvider, useChatContext } from '@/lib/chat/ChatContext';
import { getCallManager, formatCallDuration, type CallState } from '@/lib/webrtc/video-call';
import { getLocationManager, formatLocationDuration, formatAccuracy, type LocationShareState, type LocationData } from '@/lib/location/real-location';
import { getFileUploadManager, formatFileSize, type FileUploadProgress } from '@/lib/files/real-upload';
import { ExpandedSettings } from '@/components/ExpandedSettings';

type ViewMode = 'chat' | 'dashboard' | 'settings';

export default function UnifiedMessagingHub() {
  return (
    <LanguageProvider>
      <ChatProvider>
        <HubInterface />
      </ChatProvider>
    </LanguageProvider>
  );
}

function HubInterface() {
  const { t } = useTranslation();
  const {
    chats,
    messages,
    selectedChatId,
    currentUser,
    isWebSocketConnected,
    dispatch,
    sendMessage,
    addReaction,
    deleteMessage
  } = useChatContext();

  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [messageInput, setMessageInput] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  // Context menu state for WhatsApp-like features
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Real WebRTC call state
  const [callState, setCallState] = useState<CallState | null>(null);
  const callManager = getCallManager();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Real location sharing state
  const [locationState, setLocationState] = useState<LocationShareState | null>(null);
  const locationManager = getLocationManager();

  // Real file upload state
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress | null>(null);
  const fileUploadManager = getFileUploadManager();

  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const chatMessages = selectedChatId ? messages[selectedChatId] || [] : [];

  // Initialize real managers
  useEffect(() => {
    callManager.onStateChange(setCallState);
    locationManager.onStateChange(setLocationState);
    locationManager.onLocationUpdate((location: LocationData) => {
      console.log('[Hub] Location updated:', location);
    });
  }, []);

  // Handle click outside user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Handle click outside context menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    }

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu]);

  // Update video elements
  useEffect(() => {
    if (callState?.localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = callState.localStream;
    }
    if (callState?.remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChatId) return;
    await sendMessage(selectedChatId, messageInput.trim());
    setMessageInput('');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChatId) return;
    try {
      await fileUploadManager.uploadFile(file, setUploadProgress);
    } catch (error) {
      console.error('[Hub] File upload failed:', error);
    }
  };

  const handleStartVideoCall = async () => {
    if (!selectedChat) return;
    try {
      await callManager.startCall(selectedChat.id, { video: true, audio: true });
    } catch (error) {
      alert(t('errors.permission'));
    }
  };

  const handleStartAudioCall = async () => {
    if (!selectedChat) return;
    try {
      await callManager.startCall(selectedChat.id, { video: false, audio: true });
    } catch (error) {
      alert(t('errors.permission'));
    }
  };

  const handleEndCall = async () => {
    await callManager.endCall();
  };

  const handleToggleVideo = () => {
    callManager.toggleVideo();
  };

  const handleToggleAudio = () => {
    callManager.toggleAudio();
  };

  const handleStartLocationSharing = async () => {
    if (!selectedChat) return;
    try {
      await locationManager.startSharing('15min');
    } catch (error) {
      alert(t('errors.permission'));
    }
  };

  const handleStopLocationSharing = () => {
    locationManager.stopSharing();
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Lütfen sadece resim dosyası yükleyin (JPG, PNG, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu çok büyük. Maksimum 5MB olmalıdır.');
      return;
    }

    try {
      // Create preview URL
      const imageUrl = URL.createObjectURL(file);

      // TODO: Upload to server/storage
      // For now, just update the user state with the preview
      console.log('[Profile] Image selected:', file.name, 'Size:', file.size);

      // Update user avatar (in a real app, this would be saved to backend)
      if (currentUser) {
        currentUser.avatar = imageUrl;
      }

      alert('Profil resmi güncellendi! ✓');
    } catch (error) {
      console.error('[Profile] Image upload failed:', error);
      alert('Resim yüklenirken bir hata oluştu.');
    }
  };

  // WhatsApp-like context menu handlers
  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenu({ chatId, x: e.clientX, y: e.clientY });
  };

  const handleArchiveChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat?.isArchived) {
      dispatch({ type: 'UNARCHIVE_CHAT', payload: chatId });
    } else {
      dispatch({ type: 'ARCHIVE_CHAT', payload: chatId });
    }
    setContextMenu(null);
  };

  const handleDeleteChat = (chatId: string) => {
    if (confirm(t('chat.deleteChatConfirm'))) {
      dispatch({ type: 'DELETE_CHAT', payload: chatId });
      setContextMenu(null);
    }
  };

  const handleMuteChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat?.isMuted) {
      dispatch({ type: 'UNMUTE_CHAT', payload: chatId });
    } else {
      dispatch({ type: 'MUTE_CHAT', payload: chatId });
    }
    setContextMenu(null);
  };

  const handlePinChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat?.isPinned) {
      dispatch({ type: 'UNPIN_CHAT', payload: chatId });
    } else {
      dispatch({ type: 'PIN_CHAT', payload: chatId });
    }
    setContextMenu(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#0B0F19] via-[#0F1419] to-[#0B0F19] relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#10A37F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#6366F1]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#EC4899]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative bg-gradient-to-r from-[#111827]/80 via-[#1F2937]/80 to-[#111827]/80 backdrop-blur-xl border-b border-[#374151]/50 px-6 py-4" style={{ zIndex: 50 }}>
        <div className="flex items-center justify-between">

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-[#1F2937]/50 backdrop-blur-sm rounded-2xl p-1.5 border border-[#374151]/30">
            <NavTab
              active={viewMode === 'chat'}
              onClick={() => setViewMode('chat')}
              icon="💬"
              label={t('nav.messages')}
              gradient="from-[#10A37F] to-[#0D8F6E]"
            />
            <NavTab
              active={viewMode === 'dashboard'}
              onClick={() => setViewMode('dashboard')}
              icon="📊"
              label={t('nav.dashboard')}
              gradient="from-[#6366F1] to-[#8B5CF6]"
            />
            <NavTab
              active={viewMode === 'settings'}
              onClick={() => setViewMode('settings')}
              icon="⚙️"
              label={t('nav.settings')}
              gradient="from-[#EC4899] to-[#F43F5E]"
            />
          </div>

          {/* User Status */}
          <div className="flex items-center gap-3">
            {/* User Avatar with Dropdown */}
            <div className="relative" style={{ zIndex: 9999 }} ref={userMenuRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[User Menu] BUTTON CLICKED!!!');
                  console.log('[User Menu] Current state:', showUserMenu);
                  setShowUserMenu(!showUserMenu);
                  console.log('[User Menu] New state will be:', !showUserMenu);
                }}
                className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-[#6366F1]/30 cursor-pointer"
                style={{ pointerEvents: 'auto' }}
                type="button"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10A37F] border-2 border-[#111827] animate-pulse" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  className="absolute right-0 top-14 w-72 bg-gradient-to-br from-[#111827]/98 via-[#1F2937]/98 to-[#111827]/98 backdrop-blur-2xl border border-[#374151]/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                  style={{ zIndex: 9999, pointerEvents: 'auto' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* User Info Header */}
                  <div className="p-4 border-b border-[#374151]/50 bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10">
                    <div className="flex items-center gap-3">
                      {/* Profile Image with Upload */}
                      <div className="relative group">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg overflow-hidden">
                          {currentUser?.avatar ? (
                            <img
                              src={currentUser.avatar}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>

                        {/* Upload Button - Shows on hover */}
                        <button
                          onClick={() => profileImageInputRef.current?.click()}
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          title="Profil resmini değiştir"
                        >
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>

                        {/* Hidden file input */}
                        <input
                          ref={profileImageInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/jpg"
                          className="hidden"
                          onChange={handleProfileImageUpload}
                        />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-black text-white">{currentUser?.displayName || 'User'}</h3>
                        <p className="text-xs text-[#9CA3AF] font-semibold">@{currentUser?.username || 'username'}</p>
                        <p className="text-xs text-[#6366F1] mt-0.5">📸 Resmi değiştir</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setViewMode('dashboard');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-[#1F2937]/80 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 flex items-center justify-center group-hover:from-[#6366F1] group-hover:to-[#8B5CF6] transition-all">
                        <svg className="w-5 h-5 text-[#6366F1] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-white group-hover:text-[#6366F1] transition-colors">{t('userMenu.controlPanel')}</p>
                        <p className="text-xs text-[#6B7280]">Analitik ve istatistikler</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setViewMode('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-[#1F2937]/80 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#EC4899]/20 to-[#F43F5E]/20 flex items-center justify-center group-hover:from-[#EC4899] group-hover:to-[#F43F5E] transition-all">
                        <svg className="w-5 h-5 text-[#EC4899] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-white group-hover:text-[#EC4899] transition-colors">{t('userMenu.settings')}</p>
                        <p className="text-xs text-[#6B7280]">Uygulama tercihleri</p>
                      </div>
                    </button>

                    <div className="h-px bg-[#374151]/50 my-2" />

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // TODO: Implement logout
                        console.log('Logout clicked');
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-[#EF4444]/10 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#EF4444]/20 flex items-center justify-center group-hover:bg-[#EF4444] transition-all">
                        <svg className="w-5 h-5 text-[#EF4444] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-[#EF4444] group-hover:text-white transition-colors">{t('userMenu.logout')}</p>
                        <p className="text-xs text-[#6B7280]">Güvenli çıkış</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative" style={{ zIndex: 1 }}>
        {viewMode === 'chat' && (
          <ChatView
            t={t}
            chats={chats}
            messages={chatMessages}
            selectedChatId={selectedChatId}
            selectedChat={selectedChat}
            messageInput={messageInput}
            setMessageInput={setMessageInput}
            handleSendMessage={handleSendMessage}
            handleFileSelect={handleFileSelect}
            handleStartVideoCall={handleStartVideoCall}
            handleStartAudioCall={handleStartAudioCall}
            handleStartLocationSharing={handleStartLocationSharing}
            dispatch={dispatch}
            currentUser={currentUser}
            addReaction={addReaction}
            deleteMessage={deleteMessage}
            showQuickActions={showQuickActions}
            setShowQuickActions={setShowQuickActions}
            locationState={locationState}
            contextMenu={contextMenu}
            setContextMenu={setContextMenu}
            contextMenuRef={contextMenuRef}
            handleContextMenu={handleContextMenu}
            handleArchiveChat={handleArchiveChat}
            handleDeleteChat={handleDeleteChat}
            handleMuteChat={handleMuteChat}
            handlePinChat={handlePinChat}
          />
        )}

        {viewMode === 'dashboard' && (
          <DashboardView t={t} chats={chats} messages={messages} />
        )}

        {viewMode === 'settings' && (
          <ExpandedSettings currentUser={currentUser} />
        )}
      </div>

      {/* Video Call Overlay */}
      {callState?.isActive && (
        <VideoCallOverlay
          t={t}
          callState={callState}
          selectedChat={selectedChat}
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          handleToggleVideo={handleToggleVideo}
          handleToggleAudio={handleToggleAudio}
          handleEndCall={handleEndCall}
        />
      )}

      {/* Location Sharing Overlay */}
      {locationState?.isActive && locationState.currentLocation && (
        <LocationOverlay
          t={t}
          locationState={locationState}
          handleStopLocationSharing={handleStopLocationSharing}
        />
      )}

      {/* File Upload Progress Overlay */}
      {uploadProgress && uploadProgress.status !== 'completed' && (
        <FileUploadOverlay t={t} uploadProgress={uploadProgress} />
      )}
    </div>
  );
}

// Nav Tab Component
function NavTab({ active, onClick, icon, label, gradient }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
        active
          ? `bg-gradient-to-r ${gradient} text-white shadow-lg shadow-${gradient.split(' ')[0].slice(6)}/30 scale-105`
          : 'text-[#9CA3AF] hover:text-white hover:bg-[#374151]/50'
      }`}
    >
      {icon} {label}
    </button>
  );
}

// Chat View Component
function ChatView({ t, chats, messages, selectedChatId, selectedChat, messageInput, setMessageInput, handleSendMessage, handleFileSelect, handleStartVideoCall, handleStartAudioCall, handleStartLocationSharing, dispatch, currentUser, addReaction, deleteMessage, showQuickActions, setShowQuickActions, locationState, contextMenu, setContextMenu, contextMenuRef, handleContextMenu, handleArchiveChat, handleDeleteChat, handleMuteChat, handlePinChat }: any) {
  return (
    <>
      {/* Left Sidebar - Chat List */}
      <div className="w-96 border-r border-[#374151]/30 flex flex-col bg-gradient-to-b from-[#111827]/50 to-[#1F2937]/50 backdrop-blur-xl relative">
        {/* Search */}
        <div className="p-4">
          <div className="relative group">
            <input
              type="text"
              placeholder={t('chat.searchPlaceholder')}
              className="w-full px-4 py-3 pl-12 rounded-2xl bg-[#1F2937]/80 backdrop-blur-sm border border-[#374151]/50 text-white placeholder-[#6B7280] focus:border-[#10A37F] focus:outline-none focus:ring-2 focus:ring-[#10A37F]/30 transition-all"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280] group-focus-within:text-[#10A37F] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#374151] scrollbar-track-transparent">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#10A37F]/20 to-[#6366F1]/20 flex items-center justify-center mb-4 animate-pulse">
                <svg className="w-10 h-10 text-[#10A37F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-bold text-white mb-2">{t('chat.noMessages')}</p>
              <p className="text-sm text-[#6B7280]">{t('chat.encrypted')}</p>
            </div>
          ) : (
            chats.map((chat: any) => (
              <button
                key={chat.id}
                onClick={() => dispatch({ type: 'SELECT_CHAT', payload: chat.id })}
                onContextMenu={(e) => handleContextMenu(e, chat.id)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-[#1F2937]/80 transition-all duration-300 border-l-4 group relative ${
                  selectedChatId === chat.id
                    ? 'bg-gradient-to-r from-[#1F2937] to-transparent border-l-[#10A37F] shadow-lg'
                    : 'border-l-transparent'
                }`}
              >
                {/* Pinned Badge */}
                {chat.isPinned && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#6366F1] flex items-center justify-center shadow-lg">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                )}

                <div className="relative">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${
                    chat.isArchived ? 'from-[#6B7280] to-[#4B5563]' : 'from-[#10A37F] to-[#0D8F6E]'
                  }`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  {chat.onlineStatus === 'online' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#10A37F] border-2 border-[#111827] animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate group-hover:text-[#10A37F] transition-colors">
                        {chat.name || 'Unknown'}
                      </h3>
                      {/* Muted Icon */}
                      {chat.isMuted && (
                        <svg className="w-4 h-4 text-[#6B7280] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                      )}
                      {/* Archived Icon */}
                      {chat.isArchived && (
                        <svg className="w-4 h-4 text-[#6B7280] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <span className="text-xs text-[#6B7280] flex-shrink-0 ml-2">
                        {new Date(chat.lastMessage.timestamp).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#9CA3AF] truncate">
                      {chat.isTyping ? (
                        <span className="text-[#10A37F] font-semibold animate-pulse">{t('chat.typing')}</span>
                      ) : chat.lastMessage ? (
                        chat.lastMessage.content
                      ) : (
                        t('chat.noMessages')
                      )}
                    </p>
                    {chat.unreadCount > 0 && !chat.isMuted && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] text-xs font-black text-white shadow-lg shadow-[#10A37F]/30 animate-pulse">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-t border-[#374151]/30">
          <button className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] text-white font-black transition-all hover:scale-105 hover:shadow-2xl hover:shadow-[#10A37F]/40 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            {t('chat.startConversation')}
          </button>
        </div>
      </div>

      {/* Middle - Chat Window */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-transparent to-[#0B0F19]/30 backdrop-blur-sm">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#111827]/90 via-[#1F2937]/90 to-[#111827]/90 backdrop-blur-xl border-b border-[#374151]/30 px-6 py-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10A37F] to-[#0D8F6E] flex items-center justify-center shadow-lg shadow-[#10A37F]/30">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    {selectedChat.onlineStatus === 'online' && (
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#10A37F] border-2 border-[#111827] animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-black text-white text-lg">{selectedChat.name}</h2>
                    <p className="text-xs font-semibold">
                      {selectedChat.onlineStatus === 'online' ? (
                        <span className="text-[#10A37F]">● {t('chat.online')}</span>
                      ) : (
                        <span className="text-[#6B7280]">○ {t('chat.offline')}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-[#374151] scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[#10A37F]/20 to-[#6366F1]/20 flex items-center justify-center animate-pulse">
                      <svg className="w-12 h-12 text-[#10A37F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="font-bold text-white text-xl mb-2">{t('chat.noMessages')}</p>
                    <p className="text-sm text-[#6B7280]">{t('chat.startConversation')}</p>
                  </div>
                </div>
              ) : (
                messages.map((message: any) => (
                  <MessageBubble
                    key={message.id}
                    t={t}
                    message={message}
                    isSent={message.senderId === currentUser?.id}
                    onReact={(emoji: string) => addReaction(message.id, emoji)}
                    onDelete={() => deleteMessage(message.id)}
                  />
                ))
              )}
            </div>

            {/* Input Bar */}
            <div className="bg-gradient-to-r from-[#111827]/90 via-[#1F2937]/90 to-[#111827]/90 backdrop-blur-xl border-t border-[#374151]/30 px-6 py-4 shadow-2xl">
              <div className="flex items-center gap-3">
                {/* File Upload */}
                <label className="p-3 rounded-xl bg-gradient-to-br from-[#374151]/50 to-[#1F2937]/50 backdrop-blur-sm border border-[#374151]/30 hover:border-[#10A37F] cursor-pointer transition-all hover:scale-110 hover:shadow-lg hover:shadow-[#10A37F]/20 group">
                  <svg className="w-5 h-5 text-[#6B7280] group-hover:text-[#10A37F] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <input type="file" className="hidden" onChange={handleFileSelect} />
                </label>

                {/* Location */}
                <button
                  onClick={handleStartLocationSharing}
                  disabled={locationState?.isActive}
                  className="p-3 rounded-xl bg-gradient-to-br from-[#EC4899]/20 to-[#F43F5E]/20 backdrop-blur-sm border border-[#EC4899]/30 hover:from-[#EC4899] hover:to-[#F43F5E] hover:border-[#EC4899] text-[#EC4899] hover:text-white transition-all hover:scale-110 hover:shadow-lg hover:shadow-[#EC4899]/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('chat.shareLocation')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                {/* Message Input */}
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t('chat.typeMessage')}
                  className="flex-1 px-5 py-3.5 rounded-2xl bg-[#1F2937]/80 backdrop-blur-sm border border-[#374151]/50 text-white placeholder-[#6B7280] focus:border-[#10A37F] focus:outline-none focus:ring-2 focus:ring-[#10A37F]/30 transition-all"
                />

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110 hover:shadow-2xl hover:shadow-[#10A37F]/40 group"
                  title={t('chat.send')}
                >
                  <svg className="w-6 h-6 text-white group-hover:rotate-45 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-[#10A37F]/20 to-[#6366F1]/20 flex items-center justify-center animate-pulse">
                <svg className="w-16 h-16 text-[#10A37F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">{t('chat.selectChat')}</h3>
              <p className="text-[#6B7280]">{t('chat.startConversation')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu - Rendered outside sidebar to fix z-index */}
      {contextMenu && (
        <>
          {/* Backdrop - Tıklanabilir, blur yok */}
          <div
            className="fixed inset-0 bg-transparent z-[9998]"
            onClick={() => setContextMenu(null)}
          />

          {/* Context Menu */}
          <div
            ref={contextMenuRef}
            className="fixed z-[9999] w-64 bg-gradient-to-br from-[#111827]/98 via-[#1F2937]/98 to-[#111827]/98 backdrop-blur-2xl border border-[#374151]/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2">
              {/* Archive/Unarchive */}
              <button
                onClick={() => handleArchiveChat(contextMenu.chatId)}
                className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-[#1F2937]/80 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B7280]/20 to-[#4B5563]/20 flex items-center justify-center group-hover:from-[#6B7280] group-hover:to-[#4B5563] transition-all">
                  <svg className="w-5 h-5 text-[#6B7280] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <span className="font-bold text-white group-hover:text-[#6B7280] transition-colors">
                  {chats.find((c: any) => c.id === contextMenu.chatId)?.isArchived ? t('chat.unarchive') : t('chat.archive')}
                </span>
              </button>

              {/* Pin/Unpin */}
              <button
                onClick={() => handlePinChat(contextMenu.chatId)}
                className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-[#1F2937]/80 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 flex items-center justify-center group-hover:from-[#6366F1] group-hover:to-[#8B5CF6] transition-all">
                  <svg className="w-5 h-5 text-[#6366F1] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <span className="font-bold text-white group-hover:text-[#6366F1] transition-colors">
                  {chats.find((c: any) => c.id === contextMenu.chatId)?.isPinned ? t('chat.unpin') : t('chat.pin')}
                </span>
              </button>

              {/* Mute/Unmute */}
              <button
                onClick={() => handleMuteChat(contextMenu.chatId)}
                className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-[#1F2937]/80 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B]/20 to-[#D97706]/20 flex items-center justify-center group-hover:from-[#F59E0B] group-hover:to-[#D97706] transition-all">
                  <svg className="w-5 h-5 text-[#F59E0B] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {chats.find((c: any) => c.id === contextMenu.chatId)?.isMuted ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    )}
                  </svg>
                </div>
                <span className="font-bold text-white group-hover:text-[#F59E0B] transition-colors">
                  {chats.find((c: any) => c.id === contextMenu.chatId)?.isMuted ? t('chat.unmute') : t('chat.mute')}
                </span>
              </button>

              <div className="h-px bg-[#374151]/50 my-2" />

              {/* Delete */}
              <button
                onClick={() => handleDeleteChat(contextMenu.chatId)}
                className="w-full px-4 py-3 flex items-center gap-3 rounded-xl hover:bg-[#EF4444]/10 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#EF4444]/20 flex items-center justify-center group-hover:bg-[#EF4444] transition-all">
                  <svg className="w-5 h-5 text-[#EF4444] group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <span className="font-bold text-[#EF4444] group-hover:text-white transition-colors">
                  {t('chat.deleteChat')}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Dashboard View
function DashboardView({ t, chats, messages }: any) {
  const totalMessages = Object.values(messages).reduce((acc: number, msgs: any) => acc + msgs.length, 0);
  const totalChats = chats.length;
  const onlineChats = chats.filter((c: any) => c.onlineStatus === 'online').length;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-black text-white mb-8 bg-gradient-to-r from-white to-[#6366F1] bg-clip-text text-transparent">
          {t('dashboard.title')}
        </h2>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: t('dashboard.totalMessages'), value: totalMessages, icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', gradient: 'from-[#10A37F] to-[#0D8F6E]' },
            { label: t('dashboard.activeChats'), value: totalChats, icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', gradient: 'from-[#6366F1] to-[#8B5CF6]' },
            { label: t('dashboard.onlineNow'), value: onlineChats, icon: 'M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z', gradient: 'from-[#EC4899] to-[#F43F5E]' }
          ].map((stat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-gradient-to-br from-[#1F2937]/80 to-[#111827]/80 backdrop-blur-xl border border-[#374151]/30 hover:scale-105 transition-transform shadow-xl"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <p className="text-4xl font-black text-white mb-2">{stat.value}</p>
              <p className="text-sm font-semibold text-[#6B7280]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1F2937]/80 to-[#111827]/80 backdrop-blur-xl border border-[#374151]/30">
          <h3 className="text-xl font-black text-white mb-4">{t('dashboard.recentActivity')}</h3>
          <div className="space-y-3">
            {chats.slice(0, 5).map((chat: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-[#111827]/50 hover:bg-[#1F2937]/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10A37F] to-[#0D8F6E] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{chat.name}</p>
                  <p className="text-xs text-[#6B7280]">{chat.lastMessage?.content || t('chat.noMessages')}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${chat.onlineStatus === 'online' ? 'bg-[#10A37F]' : 'bg-[#6B7280]'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Bubble
function MessageBubble({ t, message, isSent, onReact, onDelete }: any) {
  const handleDelete = () => {
    if (confirm(t('chat.deleteChatConfirm'))) {
      onDelete();
    }
  };

  // Show "Message deleted" if message was deleted
  if (message.deletedAt) {
    return (
      <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} group`}>
        <div className={`max-w-md ${isSent ? 'items-end' : 'items-start'} flex flex-col`}>
          <div className="px-5 py-3 rounded-3xl backdrop-blur-xl border border-[#6B7280]/30 bg-[#1F2937]/50">
            <p className="text-sm text-[#6B7280] italic">🚫 Mesaj silindi</p>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#6B7280] font-semibold">
            <span>
              {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-md ${isSent ? 'items-end' : 'items-start'} flex flex-col relative`}>
        {/* Delete Button - Shows on hover */}
        {isSent && (
          <button
            onClick={handleDelete}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#EF4444] hover:bg-[#DC2626] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
            title="Mesajı sil"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        <div
          className={`px-5 py-3 rounded-3xl backdrop-blur-xl border transition-all hover:scale-105 ${
            isSent
              ? 'bg-gradient-to-br from-[#10A37F] to-[#0D8F6E] text-white border-[#10A37F]/30 shadow-lg shadow-[#10A37F]/20'
              : 'bg-gradient-to-br from-[#1F2937]/90 to-[#111827]/90 text-white border-[#374151]/30'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        <div className="flex items-center gap-2 mt-1.5 text-xs text-[#6B7280] font-semibold">
          <span>
            {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {isSent && message.status === 'read' && <span className="text-[#10A37F]">✓✓</span>}
          {message.isEncrypted && (
            <svg className="w-3 h-3 text-[#10A37F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

// Video Call Overlay
function VideoCallOverlay({ t, callState, selectedChat, localVideoRef, remoteVideoRef, handleToggleVideo, handleToggleAudio, handleEndCall }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#0B0F19] via-[#1F2937] to-[#0B0F19] flex flex-col">
      <div className="p-6 flex items-center justify-between bg-[#111827]/80 backdrop-blur-xl border-b border-[#374151]/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center animate-pulse shadow-lg shadow-[#6366F1]/30">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{selectedChat?.name || 'Unknown'}</h2>
            <p className="text-sm font-semibold text-[#10A37F]">
              {callState.callDuration > 0 ? formatCallDuration(callState.callDuration) : t('call.connecting')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center p-6">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover rounded-3xl bg-[#1F2937]/50" />
        <div className="absolute top-8 right-8 w-64 h-48 rounded-2xl overflow-hidden border-4 border-[#10A37F] shadow-2xl shadow-[#10A37F]/30">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover bg-[#111827]" />
        </div>
        <div className="absolute top-8 left-8 px-4 py-2 bg-[#111827]/90 backdrop-blur-sm rounded-xl border border-[#374151]/30">
          <p className="text-white font-mono text-lg font-bold">{formatCallDuration(callState.callDuration)}</p>
        </div>
      </div>

      <div className="p-6 flex items-center justify-center gap-4 bg-[#111827]/80 backdrop-blur-xl border-t border-[#374151]/30">
        <button
          onClick={handleToggleVideo}
          className={`p-5 rounded-2xl transition-all hover:scale-110 shadow-xl ${
            callState.isVideoEnabled
              ? 'bg-[#1F2937] hover:bg-[#374151]'
              : 'bg-[#EF4444] hover:bg-[#DC2626]'
          }`}
          title={t('call.toggleVideo')}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={handleToggleAudio}
          className={`p-5 rounded-2xl transition-all hover:scale-110 shadow-xl ${
            callState.isAudioEnabled
              ? 'bg-[#1F2937] hover:bg-[#374151]'
              : 'bg-[#EF4444] hover:bg-[#DC2626]'
          }`}
          title={t('call.toggleAudio')}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>
        <button
          onClick={handleEndCall}
          className="p-6 rounded-2xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#EF4444] shadow-2xl shadow-[#EF4444]/40 transition-all hover:scale-110"
          title={t('call.endCall')}
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Location Overlay
function LocationOverlay({ t, locationState, handleStopLocationSharing }: any) {
  return (
    <div className="fixed bottom-24 right-6 bg-gradient-to-br from-[#111827]/95 via-[#1F2937]/95 to-[#111827]/95 backdrop-blur-2xl border-2 border-[#EC4899] rounded-3xl p-6 shadow-2xl shadow-[#EC4899]/30 z-40 w-80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EC4899] to-[#F43F5E] flex items-center justify-center animate-pulse shadow-lg shadow-[#EC4899]/40">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <div>
            <p className="font-black text-white">{t('location.liveLocation')}</p>
            <p className="text-xs font-semibold text-[#EC4899]">{formatLocationDuration(locationState.sessionDuration)}</p>
          </div>
        </div>
        <button onClick={handleStopLocationSharing} className="text-[#EF4444] hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2 text-sm mb-4">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#1F2937]/50">
          <span className="text-[#9CA3AF] font-semibold">Latitude</span>
          <span className="text-white font-mono font-bold">{locationState.currentLocation.latitude.toFixed(6)}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#1F2937]/50">
          <span className="text-[#9CA3AF] font-semibold">Longitude</span>
          <span className="text-white font-mono font-bold">{locationState.currentLocation.longitude.toFixed(6)}</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#1F2937]/50">
          <span className="text-[#9CA3AF] font-semibold">{t('location.accuracy')}</span>
          <span className="text-[#10A37F] font-bold">{formatAccuracy(locationState.currentLocation.accuracy)}</span>
        </div>
      </div>

      <a
        href={`https://www.google.com/maps?q=${locationState.currentLocation.latitude},${locationState.currentLocation.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#EC4899] to-[#F43F5E] hover:from-[#F43F5E] hover:to-[#EC4899] text-white text-center font-black transition-all hover:scale-105 hover:shadow-xl hover:shadow-[#EC4899]/40 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        {t('location.openMaps')}
      </a>
    </div>
  );
}

// File Upload Overlay
function FileUploadOverlay({ t, uploadProgress }: any) {
  return (
    <div className="fixed bottom-24 left-6 bg-gradient-to-br from-[#111827]/95 via-[#1F2937]/95 to-[#111827]/95 backdrop-blur-2xl border-2 border-[#10A37F] rounded-3xl p-6 shadow-2xl shadow-[#10A37F]/30 z-40 w-96">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#10A37F] to-[#0D8F6E] flex items-center justify-center animate-pulse shadow-lg shadow-[#10A37F]/40">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-black text-white truncate">{uploadProgress.fileName}</p>
          <p className="text-xs font-semibold text-[#10A37F]">
            {uploadProgress.status === 'encrypting' ? t('files.encrypting') : `${uploadProgress.progress.toFixed(0)}%`}
          </p>
        </div>
      </div>

      <div className="w-full bg-[#1F2937] rounded-full h-2.5 overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] transition-all duration-300 shadow-lg shadow-[#10A37F]/50"
          style={{ width: `${uploadProgress.progress}%` }}
        />
      </div>

      <p className="text-xs text-[#6B7280] font-semibold">
        {formatFileSize(uploadProgress.uploadedBytes)} / {formatFileSize(uploadProgress.fileSize)}
      </p>
    </div>
  );
}
