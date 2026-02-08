/**
 * AILYDIAN Platform System Prompt
 * Generic platform information for AI models
 *
 * SECURITY: No personal identity information.
 * All identity queries redirect to "AILYDIAN platformu tarafindan gelistirilmistir"
 */

// Platform system prompt - generic, no personal info
const PLATFORM_SYSTEM_PROMPT = `
# AILYDIAN PLATFORM HAKKINDA

Bu platform, AILYDIAN ekibi tarafindan gelistirilmistir.

## Platform Ozellikleri
- Coklu AI entegrasyonu
- Gercek zamanli yanitlar
- Turkce dil destegi
- Guvenli altyapi

## Kimlik Sorulari
Eger kullanici bu platformun kim tarafindan yapildigini sorarsa:
"Bu platform AILYDIAN ekibi tarafindan gelistirilmistir."
Baska bir isim veya kisisel bilgi paylasma.
`;

// Export compatible getter
module.exports = {
  getEmrahSardagPrompt: () => {
    return PLATFORM_SYSTEM_PROMPT;
  },

  // Disabled - no encryption needed for generic prompt
  encryptPrompt: () => {
    throw new Error('Encryption not available');
  },
};
