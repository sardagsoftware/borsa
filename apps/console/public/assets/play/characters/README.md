# Karakter GLB Dosyaları / Character GLB Files

## 📍 Buraya Koyun / Place Here

Bu klasöre karakter GLB dosyalarınızı yerleştirin:
Place your character GLB files in this directory:

```
Elif.glb
Melih.glb
```

## 🎨 Blender/Mixamo Export Gereksinimleri

### Animasyon İsimleri (Animation Clip Names)
GLB export ederken animasyon cliplerinin isimleri **TAM OLARAK** şöyle olmalı:
When exporting GLB, animation clip names must be **EXACTLY**:

- `Idle` (boşta bekleyiş / idle stance)
- `Walk` (yürüme / walking)
- `Run` (koşma / running)

### Blender Export Ayarları
1. File → Export → glTF 2.0 (.glb)
2. ✅ Include → Animations
3. ✅ Skinned Meshes
4. ✅ Export animation clip names exactly as: Idle, Walk, Run
5. Format: GLB (binary .glb)

### Mixamo Export
1. Select character + animation
2. Download as FBX for Unity
3. Import to Blender
4. Rename animations to: Idle, Walk, Run
5. Export as GLB

## 📏 Otomatik Ölçeklendirme / Auto-scaling

Model çok büyük veya küçük gelirse endişelenmeyin - sistem otomatik olarak ~1.8 birim (insan boyu) olacak şekilde ölçekler.

Don't worry if the model is too big or small - the system automatically scales to ~1.8 units (human height).

## ✅ Test Etme / Testing

1. GLB dosyasını bu klasöre koyun
2. Tarayıcıda hard refresh yapın: `Ctrl+Shift+R` (Windows/Linux) veya `Cmd+Shift+R` (Mac)
3. Sağ üstteki "ASSETS" paneline bakın:
   - ✔ yeşil = dosya bulundu, model yüklendi
   - ✖ kırmızı = dosya bulunamadı, kapsül fallback kullanılıyor

## 🔧 Sorun Giderme / Troubleshooting

**Hala kapsül görünüyorsa:**
1. Dosya adını kontrol edin (tam olarak `Elif.glb` olmalı)
2. Dosya konumunu kontrol edin (tam yol: `apps/console/public/assets/play/characters/Elif.glb`)
3. Hard refresh yapın
4. Browser console'u açın (F12) ve hata mesajlarını kontrol edin

**If still seeing capsule:**
1. Check filename (must be exactly `Elif.glb`)
2. Check location (full path: `apps/console/public/assets/play/characters/Elif.glb`)
3. Do hard refresh
4. Open browser console (F12) and check for errors

## 🌐 Geçici Test için URL Kullanımı

Kendi GLB dosyanız yoksa, test için URL de kullanabilirsiniz.
`src/lib/playpro/char-config.ts` dosyasında `glb` değerini tam URL ile değiştirin:

```typescript
{
  name: "Test Character",
  glb: "https://example.com/model.glb",
  anims: { idle: "Idle", walk: "Walk", run: "Run" }
}
```
