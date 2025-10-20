'use client';

/**
 * Expanded Settings Component
 * Full-featured settings with 9 panels
 */

import { useState } from 'react';
import { useTranslation, languageOptions } from '../lib/i18n/LanguageContext';

type SettingsPanel = 'main' | 'language' | 'notifications' | 'sounds' | 'privacy' | 'appearance' | 'chatSettings' | 'storage' | 'appSettings' | 'backup';

interface ExpandedSettingsProps {
  currentUser: any;
}

export function ExpandedSettings({ currentUser }: ExpandedSettingsProps) {
  const { t, language, setLanguage } = useTranslation();
  const [activePanel, setActivePanel] = useState<SettingsPanel>('main');

  // Settings state
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    messageNotifications: true,
    callNotifications: true,
    groupNotifications: true,
    sound: true,
    vibrate: true,
    preview: true,
    inAppSound: true,
    inAppVibrate: true
  });

  const [soundSettings, setSoundSettings] = useState({
    messageSent: 'default',
    messageReceived: 'default',
    callRingtone: 'default',
    notificationSound: 'default',
    volume: 80,
    vibrationPattern: 'default'
  });

  const [privacySettings, setPrivacySettings] = useState({
    e2ee: true,
    screenLock: false,
    twoFactor: false,
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    about: 'everyone',
    readReceipts: true
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'auto',
    fontSize: 'medium',
    bubbleStyle: 'modern',
    chatWallpaper: 'gradient'
  });

  const [chatSettings, setChatSettings] = useState({
    enterToSend: true,
    typingIndicator: true,
    readReceipts: true,
    mediaAutoDownload: true,
    archiveChats: false,
    messagePreview: true
  });

  const [storageSettings, setStorageSettings] = useState({
    cacheSize: '2.4 GB',
    mediaSize: '5.8 GB',
    autoDelete: false,
    wifiOnly: false
  });

  const [appSettings, setAppSettings] = useState({
    autoStart: false,
    minimizeToTray: true,
    notifications: true,
    autoUpdate: true
  });

  if (activePanel === 'main') {
    return (
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-8 bg-gradient-to-r from-white to-[#EC4899] bg-clip-text text-transparent">
            {t('settings.title')}
          </h2>

          {/* Profile Section */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1F2937]/80 to-[#111827]/80 backdrop-blur-xl border border-[#374151]/30 mb-6">
            <h3 className="text-xl font-black text-white mb-6">{t('settings.profile.title')}</h3>
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-xl shadow-[#6366F1]/30">
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-white mb-1">{currentUser?.displayName || 'User'}</p>
                <p className="text-sm text-[#6B7280] mb-3">@{currentUser?.username || 'username'}</p>
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] text-white font-bold text-sm transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#10A37F]/30">
                  {t('settings.profile.editProfile')}
                </button>
              </div>
            </div>
          </div>

          {/* Settings Options */}
          <div className="space-y-4">
            {[
              { key: 'language', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129', gradient: 'from-[#10A37F]/20 to-[#0D8F6E]/20', panel: 'language' as SettingsPanel },
              { key: 'notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', gradient: 'from-[#6366F1]/20 to-[#8B5CF6]/20', panel: 'notifications' as SettingsPanel },
              { key: 'sounds', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.586a2 2 0 001.414.586h2v-6H7a2 2 0 00-1.414.586l-3 3a2 2 0 000 2.828l3 3z', gradient: 'from-[#EC4899]/20 to-[#F43F5E]/20', panel: 'sounds' as SettingsPanel },
              { key: 'privacy', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', gradient: 'from-[#10A37F]/20 to-[#0D8F6E]/20', panel: 'privacy' as SettingsPanel },
              { key: 'appearance', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', gradient: 'from-[#6366F1]/20 to-[#8B5CF6]/20', panel: 'appearance' as SettingsPanel },
              { key: 'chatSettings', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', gradient: 'from-[#EC4899]/20 to-[#F43F5E]/20', panel: 'chatSettings' as SettingsPanel },
              { key: 'storage', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4', gradient: 'from-[#10A37F]/20 to-[#0D8F6E]/20', panel: 'storage' as SettingsPanel },
              { key: 'appSettings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', gradient: 'from-[#6366F1]/20 to-[#8B5CF6]/20', panel: 'appSettings' as SettingsPanel },
              { key: 'backup', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', gradient: 'from-[#EC4899]/20 to-[#F43F5E]/20', panel: 'backup' as SettingsPanel }
            ].map((setting) => (
              <button
                key={setting.key}
                onClick={() => setActivePanel(setting.panel)}
                className={`w-full p-5 rounded-2xl bg-gradient-to-r ${setting.gradient} backdrop-blur-sm border border-[#374151]/30 hover:scale-102 transition-all flex items-center gap-4 group text-left`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#1F2937]/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={setting.icon} />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white mb-1">{t(`settings.${setting.key}.title`)}</p>
                  <p className="text-sm text-[#9CA3AF]">{t(`settings.${setting.key}.description`)}</p>
                </div>
                <svg className="w-5 h-5 text-[#6B7280] group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Language Panel
  if (activePanel === 'language') {
    return (
      <SettingsPanel title={t('settings.language.title')} onBack={() => setActivePanel('main')}>
        <div className="space-y-3">
          {languageOptions.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                language === lang.code
                  ? 'bg-gradient-to-r from-[#10A37F]/20 to-[#0D8F6E]/20 border-[#10A37F]'
                  : 'bg-[#1F2937]/50 border-[#374151]/30 hover:border-[#374151]'
              }`}
            >
              <span className="text-4xl">{lang.flag}</span>
              <div className="flex-1 text-left">
                <p className="font-bold text-white">{lang.name}</p>
              </div>
              {language === lang.code && (
                <svg className="w-6 h-6 text-[#10A37F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </SettingsPanel>
    );
  }

  // Notifications Panel
  if (activePanel === 'notifications') {
    return (
      <SettingsPanel title={t('settings.notifications.title')} onBack={() => setActivePanel('main')}>
        <div className="space-y-4">
          <ToggleOption
            label={t('settings.notifications.enable')}
            checked={notificationSettings.enabled}
            onChange={(checked) => setNotificationSettings({ ...notificationSettings, enabled: checked })}
          />
          <ToggleOption
            label={t('settings.notifications.messageNotifications')}
            checked={notificationSettings.messageNotifications}
            onChange={(checked) => setNotificationSettings({ ...notificationSettings, messageNotifications: checked })}
          />
          <ToggleOption
            label={t('settings.notifications.callNotifications')}
            checked={notificationSettings.callNotifications}
            onChange={(checked) => setNotificationSettings({ ...notificationSettings, callNotifications: checked })}
          />
          <ToggleOption
            label={t('settings.notifications.groupNotifications')}
            checked={notificationSettings.groupNotifications}
            onChange={(checked) => setNotificationSettings({ ...notificationSettings, groupNotifications: checked })}
          />
          <ToggleOption
            label={t('settings.notifications.sound')}
            checked={notificationSettings.sound}
            onChange={(checked) => setNotificationSettings({ ...notificationSettings, sound: checked })}
          />
          <ToggleOption
            label={t('settings.notifications.vibrate')}
            checked={notificationSettings.vibrate}
            onChange={(checked) => setNotificationSettings({ ...notificationSettings, vibrate: checked })}
          />
          <ToggleOption
            label={t('settings.notifications.preview')}
            checked={notificationSettings.preview}
            onChange={(checked) => setNotificationSettings({ ...notificationSettings, preview: checked })}
          />
        </div>
      </SettingsPanel>
    );
  }

  // Sounds Panel
  if (activePanel === 'sounds') {
    return (
      <SettingsPanel title={t('settings.sounds.title')} onBack={() => setActivePanel('main')}>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#9CA3AF] mb-2">{t('settings.sounds.messageSent')}</label>
            <select className="w-full px-4 py-3 rounded-xl bg-[#1F2937]/80 border border-[#374151]/50 text-white focus:border-[#10A37F] focus:outline-none">
              <option value="default">{t('settings.sounds.default')}</option>
              <option value="none">{t('settings.sounds.none')}</option>
              <option value="custom">{t('settings.sounds.custom')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#9CA3AF] mb-2">{t('settings.sounds.volume')}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={soundSettings.volume}
              onChange={(e) => setSoundSettings({ ...soundSettings, volume: parseInt(e.target.value) })}
              className="w-full h-2 bg-[#1F2937] rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-right text-sm text-[#10A37F] font-bold mt-2">{soundSettings.volume}%</p>
          </div>
        </div>
      </SettingsPanel>
    );
  }

  // Privacy Panel
  if (activePanel === 'privacy') {
    return (
      <SettingsPanel title={t('settings.privacy.title')} onBack={() => setActivePanel('main')}>
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#10A37F]/10 border border-[#10A37F]/30">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-5 h-5 text-[#10A37F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="font-bold text-white">{t('settings.privacy.e2ee')}</p>
            </div>
            <p className="text-sm text-[#9CA3AF]">{t('settings.privacy.e2eeDescription')}</p>
          </div>
          <ToggleOption
            label={t('settings.privacy.screenLock')}
            description={t('settings.privacy.screenLockDescription')}
            checked={privacySettings.screenLock}
            onChange={(checked) => setPrivacySettings({ ...privacySettings, screenLock: checked })}
          />
          <ToggleOption
            label={t('settings.privacy.twoFactor')}
            description={t('settings.privacy.twoFactorDescription')}
            checked={privacySettings.twoFactor}
            onChange={(checked) => setPrivacySettings({ ...privacySettings, twoFactor: checked })}
          />
          <ToggleOption
            label={t('settings.privacy.readReceipts')}
            checked={privacySettings.readReceipts}
            onChange={(checked) => setPrivacySettings({ ...privacySettings, readReceipts: checked })}
          />
        </div>
      </SettingsPanel>
    );
  }

  // Appearance Panel
  if (activePanel === 'appearance') {
    return (
      <SettingsPanel title={t('settings.appearance.title')} onBack={() => setActivePanel('main')}>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-[#9CA3AF] mb-3">{t('settings.appearance.theme')}</label>
            <div className="grid grid-cols-3 gap-3">
              {['auto', 'light', 'dark'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setAppearanceSettings({ ...appearanceSettings, theme })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    appearanceSettings.theme === theme
                      ? 'border-[#10A37F] bg-[#10A37F]/10'
                      : 'border-[#374151]/30 bg-[#1F2937]/50 hover:border-[#374151]'
                  }`}
                >
                  <p className="text-white font-bold capitalize">{t(`settings.appearance.${theme}`)}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-[#9CA3AF] mb-3">{t('settings.appearance.fontSize')}</label>
            <div className="grid grid-cols-3 gap-3">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  onClick={() => setAppearanceSettings({ ...appearanceSettings, fontSize: size })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    appearanceSettings.fontSize === size
                      ? 'border-[#6366F1] bg-[#6366F1]/10'
                      : 'border-[#374151]/30 bg-[#1F2937]/50 hover:border-[#374151]'
                  }`}
                >
                  <p className="text-white font-bold capitalize">{t(`settings.appearance.${size}`)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsPanel>
    );
  }

  // Chat Settings Panel
  if (activePanel === 'chatSettings') {
    return (
      <SettingsPanel title={t('settings.chatSettings.title')} onBack={() => setActivePanel('main')}>
        <div className="space-y-4">
          <ToggleOption
            label={t('settings.chatSettings.enterToSend')}
            description={t('settings.chatSettings.enterToSendDescription')}
            checked={chatSettings.enterToSend}
            onChange={(checked) => setChatSettings({ ...chatSettings, enterToSend: checked })}
          />
          <ToggleOption
            label={t('settings.chatSettings.typingIndicator')}
            description={t('settings.chatSettings.typingIndicatorDescription')}
            checked={chatSettings.typingIndicator}
            onChange={(checked) => setChatSettings({ ...chatSettings, typingIndicator: checked })}
          />
          <ToggleOption
            label={t('settings.chatSettings.mediaAutoDownload')}
            description={t('settings.chatSettings.mediaAutoDownloadDescription')}
            checked={chatSettings.mediaAutoDownload}
            onChange={(checked) => setChatSettings({ ...chatSettings, mediaAutoDownload: checked })}
          />
          <ToggleOption
            label={t('settings.chatSettings.messagePreview')}
            description={t('settings.chatSettings.messagePreviewDescription')}
            checked={chatSettings.messagePreview}
            onChange={(checked) => setChatSettings({ ...chatSettings, messagePreview: checked })}
          />
        </div>
      </SettingsPanel>
    );
  }

  // Storage Panel
  if (activePanel === 'storage') {
    return (
      <SettingsPanel title={t('settings.storage.title')} onBack={() => setActivePanel('main')}>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#1F2937]/50 border border-[#374151]/30">
              <p className="text-sm text-[#9CA3AF] mb-1">{t('settings.storage.cacheSize')}</p>
              <p className="text-2xl font-black text-white">{storageSettings.cacheSize}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#1F2937]/50 border border-[#374151]/30">
              <p className="text-sm text-[#9CA3AF] mb-1">{t('settings.storage.mediaSize')}</p>
              <p className="text-2xl font-black text-white">{storageSettings.mediaSize}</p>
            </div>
          </div>
          <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#EF4444] text-white font-bold transition-all hover:scale-105">
            {t('settings.storage.clearCache')}
          </button>
          <ToggleOption
            label={t('settings.storage.autoDelete')}
            description={t('settings.storage.autoDeleteDescription')}
            checked={storageSettings.autoDelete}
            onChange={(checked) => setStorageSettings({ ...storageSettings, autoDelete: checked })}
          />
          <ToggleOption
            label={t('settings.storage.wifiOnly')}
            description={t('settings.storage.wifiOnlyDescription')}
            checked={storageSettings.wifiOnly}
            onChange={(checked) => setStorageSettings({ ...storageSettings, wifiOnly: checked })}
          />
        </div>
      </SettingsPanel>
    );
  }

  // App Settings Panel
  if (activePanel === 'appSettings') {
    return (
      <SettingsPanel title={t('settings.appSettings.title')} onBack={() => setActivePanel('main')}>
        <div className="space-y-4">
          <ToggleOption
            label={t('settings.appSettings.autoStart')}
            description={t('settings.appSettings.autoStartDescription')}
            checked={appSettings.autoStart}
            onChange={(checked) => setAppSettings({ ...appSettings, autoStart: checked })}
          />
          <ToggleOption
            label={t('settings.appSettings.minimizeToTray')}
            description={t('settings.appSettings.minimizeToTrayDescription')}
            checked={appSettings.minimizeToTray}
            onChange={(checked) => setAppSettings({ ...appSettings, minimizeToTray: checked })}
          />
          <ToggleOption
            label={t('settings.appSettings.autoUpdate')}
            checked={appSettings.autoUpdate}
            onChange={(checked) => setAppSettings({ ...appSettings, autoUpdate: checked })}
          />
          <div className="p-4 rounded-2xl bg-[#1F2937]/50 border border-[#374151]/30">
            <p className="text-sm text-[#9CA3AF] mb-1">{t('settings.appSettings.version')}</p>
            <p className="text-lg font-bold text-white">v1.0.0</p>
          </div>
        </div>
      </SettingsPanel>
    );
  }

  // Backup Panel
  if (activePanel === 'backup') {
    return (
      <SettingsPanel title={t('settings.backup.title')} onBack={() => setActivePanel('main')}>
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#1F2937]/50 border border-[#374151]/30">
            <p className="text-sm text-[#9CA3AF] mb-1">{t('settings.backup.lastBackup')}</p>
            <p className="text-lg font-bold text-white">{t('settings.backup.never')}</p>
          </div>
          <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#10A37F] to-[#0D8F6E] hover:from-[#0D8F6E] hover:to-[#10A37F] text-white font-bold transition-all hover:scale-105">
            {t('settings.backup.backupNow')}
          </button>
          <ToggleOption
            label={t('settings.backup.autoBackup')}
            description={t('settings.backup.autoBackupDescription')}
            checked={false}
            onChange={(checked) => console.log('Auto backup:', checked)}
          />
          <ToggleOption
            label={t('settings.backup.includeMedia')}
            description={t('settings.backup.includeMediaDescription')}
            checked={true}
            onChange={(checked) => console.log('Include media:', checked)}
          />
        </div>
      </SettingsPanel>
    );
  }

  return null;
}

// Settings Panel Wrapper
function SettingsPanel({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#9CA3AF] hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-semibold">Back</span>
        </button>
        <h2 className="text-3xl font-black text-white mb-8 bg-gradient-to-r from-white to-[#EC4899] bg-clip-text text-transparent">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

// Toggle Option Component
function ToggleOption({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1F2937]/50 border border-[#374151]/30 hover:bg-[#1F2937]/70 transition-colors">
      <div className="flex-1">
        <p className="font-bold text-white mb-0.5">{label}</p>
        {description && <p className="text-sm text-[#9CA3AF]">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-14 h-8 rounded-full transition-colors ${
          checked ? 'bg-gradient-to-r from-[#10A37F] to-[#0D8F6E]' : 'bg-[#374151]'
        }`}
      >
        <div
          className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
