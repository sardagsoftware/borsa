# 🔐 Otomatik Şifrelenmiş Yedekleme Sistemi

## 📋 Genel Bakış

www.ailydian.com için profesyonel, güvenli ve otomatik yedekleme sistemi.

### ✅ Özellikler:

- **Otomatik Yedekleme**: Her commit sonrası + günlük
- **Şifreleme**: AES-256 ile güvenli
- **Multi-Location**: Local + GitHub + Cloud
- **Full History**: Tüm Git geçmişi dahil
- **Incremental**: Akıllı saklama politikası
- **Restore**: Kolay geri yükleme
- **Beyaz Şapka**: Güvenlik standartlarına uygun

## 🚀 Kullanım

### 1. Manuel Yedekleme

```bash
# Tek seferlik yedekleme
cd /Users/sardag/Desktop/ailydian-ultra-pro/ailydian-from-github
./scripts/automated-encrypted-backup.sh
```

### 2. Otomatik Yedekleme

Sistem otomatik olarak şu durumlarda çalışır:

- ✅ **Her Git commit sonrası** (post-commit hook)
- ✅ **Her gün 03:00 UTC** (GitHub Actions)
- ✅ **Her ay 1. gün** (GitHub Releases)

### 3. Geri Yükleme

```bash
# Yedek dosyasını geri yükle
cd /Users/sardag/Desktop/ailydian-backups
./RESTORE.sh ailydian-ultra-pro_YYYYMMDD_HHMMSS.tar.gz.enc
```

## 📁 Yedekleme İçeriği

### Yedeklenen Dosyalar:

```
backup/
├── source/
│   └── source_code.tar.gz       # Tüm kaynak kod
├── git/
│   ├── repository.git/          # Full Git history
│   ├── commit_history.txt       # Commit log
│   ├── branches.txt             # Tüm branch'ler
│   ├── tags.txt                 # Tüm tag'ler
│   └── remotes.txt              # Remote repository'ler
├── configs/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── vercel.json
│   └── .github/workflows/       # CI/CD workflows
└── metadata/
    └── BACKUP_METADATA.json     # Yedekleme bilgileri
```

### Hariç Tutulan Dosyalar:

- ❌ `node_modules/`
- ❌ `.git/` (bare clone olarak ayrıca yedeklenir)
- ❌ `*.log`
- ❌ `*.backup*`
- ❌ `.vercel/`
- ❌ `dist/`, `build/`

## 🔐 Güvenlik

### Şifreleme:

- **Algoritma**: AES-256-CBC
- **Key Size**: 256-bit (32 byte)
- **Salt**: OpenSSL otomatik salt
- **Format**: OpenSSL compatible

### Encryption Key:

```bash
# Key lokasyonu
/Users/sardag/Desktop/ailydian-backups/.backup_encryption.key

# ⚠️ UYARI: Bu dosyayı GÜVENLİ YERLERDEsaklayın!
# - Time Machine
- External encrypted drive
- Password manager (1Password, LastPass)
- Cloud storage (şifrelenmiş)
```

### GitHub Secrets:

GitHub Actions için encryption key:

```
Repository Settings → Secrets → Actions
Secret name: BACKUP_ENCRYPTION_KEY
Value: [encryption key content]
```

## 📊 Saklama Politikası

### Local Backups:

- **Günlük**: Son 30 gün
- **Haftalık**: Son 12 hafta
- **Aylık**: Son 12 ay

### GitHub Artifacts:

- **Retention**: 90 gün
- **Location**: Actions → Artifacts

### GitHub Releases:

- **Frequency**: Aylık (1. gün)
- **Retention**: Kalıcı
- **Tag**: `backup-YYYYMMDD_HHMMSS`

## 🔄 Otomatik Tetikleme

### Post-Commit Hook:

```bash
# .git/hooks/post-commit
#!/bin/bash
./scripts/automated-encrypted-backup.sh &
```

### GitHub Actions:

```yaml
# .github/workflows/automated-backup.yml
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 3 * * *'  # Daily at 03:00 UTC
```

## 📖 Yedek Metadata Örneği

```json
{
  "backup_timestamp": "2024-12-20T19:00:19Z",
  "backup_type": "automated_encrypted",
  "project_name": "ailydian-ultra-pro",
  "git_info": {
    "current_branch": "main",
    "last_commit": "b246dde...",
    "last_commit_message": "chore: Cache bust",
    "total_commits": "127"
  },
  "backup_size": "45M",
  "encryption": "AES-256",
  "compression": "gzip"
}
```

## 🛠️ Troubleshooting

### Yedekleme Başarısız:

```bash
# Disk alanı kontrol
df -h /Users/sardag/Desktop/ailydian-backups

# Encryption key kontrol
ls -la /Users/sardag/Desktop/ailydian-backups/.backup_encryption.key

# Manuel test
./scripts/automated-encrypted-backup.sh
```

### Geri Yükleme Başarısız:

```bash
# Encryption key doğru mu?
cat /Users/sardag/Desktop/ailydian-backups/.backup_encryption.key

# Manuel decrypt test
openssl enc -aes-256-cbc -d \
  -in backup.tar.gz.enc \
  -out backup.tar.gz \
  -pass file:/path/to/.backup_encryption.key
```

## 📞 Destek

Sorunlar için:

1. Log kontrol: `/tmp/backup.log`
2. Metadata kontrol: `BACKUP_METADATA.json`
3. GitHub Actions logs kontrol

## 🎯 Best Practices

### ✅ Yapılması Gerekenler:

1. **Encryption key'i güvenli sakla**
2. **Düzenli olarak restore test et**
3. **Backup log'larını kontrol et**
4. **Disk alanını izle**
5. **Off-site backup tut** (GitHub)

### ❌ Yapılmaması Gerekenler:

1. ❌ Encryption key'i repository'ye commit etme
2. ❌ Unencrypted backup'ları public yerlerde saklama
3. ❌ Backup verification'ı atlama
4. ❌ Tek lokasyonda saklama

## 📈 Monitoring

### Backup Status Kontrolü:

```bash
# En son yedek
ls -lt /Users/sardag/Desktop/ailydian-backups/*.enc | head -1

# Backup history
cat /Users/sardag/Desktop/ailydian-backups/BACKUP_LOG.txt

# GitHub Actions status
# Repository → Actions → Automated Encrypted Backup
```

## 🔄 Backup Lifecycle

```
1. Trigger (commit/schedule)
   ↓
2. Create backup structure
   ↓
3. Backup source/git/configs
   ↓
4. Create metadata
   ↓
5. Compress (tar.gz)
   ↓
6. Encrypt (AES-256)
   ↓
7. Upload (GitHub/Local)
   ↓
8. Verify integrity
   ↓
9. Cleanup old backups
   ↓
10. Update index
```

## 📌 Notlar

- **Encryption key olmadan geri yükleme MÜMKÜN DEĞİL**
- **Encryption key'i birden fazla güvenli yerde sakla**
- **Aylık test restore yap**
- **Disk alanını düzenli kontrol et**

---

**Son Güncelleme**: 2024-12-20
**Version**: 1.0.0
**Status**: ✅ Active & Tested
