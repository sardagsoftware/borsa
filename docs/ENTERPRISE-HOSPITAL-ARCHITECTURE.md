# 🏥 ENTERPRISE HOSPITAL MANAGEMENT SYSTEM - ARCHITECTURE

**Version:** 1.0.0
**Date:** 2025-10-05
**Status:** DESIGN COMPLETE

---

## 🎯 SYSTEM OVERVIEW

Multi-tenant enterprise hospital management system with:
- **Individual Hospital Instances** (each hospital = isolated tenant)
- **Centralized AI & Medical Services** (shared Firildak AI, Health Data Services)
- **Hospital-Specific Configuration** (custom branding, modules, permissions)
- **Real Data Integration** (no mock/demo data)
- **Enterprise Security** (2FA, IP whitelist, role-based access)

---

## 🏗️ ARCHITECTURE LAYERS

### **Layer 1: Multi-Tenant Database**
```
┌─────────────────────────────────────────────────┐
│         CENTRAL DATABASE (PostgreSQL)           │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐            │
│  │  Hospitals   │  │  Users       │            │
│  │  Table       │  │  Table       │            │
│  └──────────────┘  └──────────────┘            │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  Patients    │  │  Medical     │            │
│  │  (tenant_id) │  │  Records     │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
```

**Tenant Isolation:**
- Each hospital has unique `hospital_id` (tenant ID)
- All patient/medical data tagged with `hospital_id`
- Row-level security ensures data isolation

---

### **Layer 2: Hospital Admin Panel**
```
┌─────────────────────────────────────────────────┐
│        HOSPITAL ADMIN DASHBOARD                 │
├─────────────────────────────────────────────────┤
│  🏥 Hospital Info        🔐 Security Settings   │
│  ⚙️  Module Configuration 👥 User Management    │
│  📊 Analytics Dashboard  🚨 Audit Logs          │
│  🎨 Branding Settings    💳 Billing             │
└─────────────────────────────────────────────────┘
```

**Admin Features:**
1. **Hospital Information Management**
   - Name, address, phone, email
   - Logo upload, color scheme
   - Operating hours, emergency contact
   - License/certification info

2. **Security Settings**
   - 2FA (TOTP/SMS/Email)
   - Password policy (complexity, expiration)
   - IP whitelist (restrict access by IP range)
   - Session management (timeout, concurrent sessions)

3. **Module Configuration**
   - Enable/disable medical specializations
   - Configure AI models per specialty
   - Set RAG data sources
   - Customize diagnostic workflows

4. **User & Role Management**
   - Create hospital staff accounts
   - Assign roles (Admin, Doctor, Nurse, Receptionist)
   - Configure permissions per role
   - Track user activity logs

---

### **Layer 3: Medical AI Services (Shared)**
```
┌─────────────────────────────────────────────────┐
│         SHARED AI SERVICES LAYER                │
├─────────────────────────────────────────────────┤
│  🤖 Firildak AI Engine   (all hospitals)        │
│  🏥 Health Data Services (8 specializations)    │
│  🌍 Multi-Language AI    (8 languages)          │
│  📚 RAG System           (PubMed, SNOMED, ICD)  │
│  🖼️  Medical Imaging AI  (Azure Computer Vision)│
└─────────────────────────────────────────────────┘
```

**Hospital-Specific AI Context:**
- Each request tagged with `hospital_id`
- AI responses customized per hospital settings
- Hospital-specific medical knowledge base
- Firildak AI adapts to hospital preferences

---

### **Layer 4: Patient Interface**
```
┌─────────────────────────────────────────────────┐
│       PATIENT-FACING MEDICAL INTERFACE          │
├─────────────────────────────────────────────────┤
│  🏥 [Hospital Logo/Branding]                    │
│  ├─ General Medicine     ├─ Cardiology          │
│  ├─ Neurology           ├─ Radiology            │
│  ├─ Oncology            ├─ Pediatrics           │
│  ├─ Psychiatry          ├─ Orthopedics          │
│  └─ Emergency Numbers (country-specific)        │
└─────────────────────────────────────────────────┘
```

**Patient Features:**
- AI consultation (all 8 specializations)
- Upload medical reports/images
- View diagnostic results
- Multi-language support
- Emergency contact (auto-detect country)

---

## 🗄️ DATABASE SCHEMA

### **1. Hospitals Table**
```sql
CREATE TABLE hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,  -- e.g., "istanbul-memorial"
  name VARCHAR(255) NOT NULL,
  country_code CHAR(2) NOT NULL,      -- ISO 3166-1 alpha-2
  city VARCHAR(100),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),

  -- Branding
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#0066cc',
  secondary_color VARCHAR(7) DEFAULT '#00aaff',

  -- Configuration
  enabled_specializations JSONB DEFAULT '["general-medicine"]',
  enabled_ai_models JSONB DEFAULT '["claude", "gpt-4"]',

  -- Security
  ip_whitelist JSONB DEFAULT '[]',      -- ["192.168.1.0/24"]
  require_2fa BOOLEAN DEFAULT false,
  password_policy JSONB,

  -- Subscription
  plan VARCHAR(50) DEFAULT 'basic',     -- basic, pro, enterprise
  max_users INTEGER DEFAULT 10,
  max_patients INTEGER DEFAULT 1000,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **2. Users Table (Hospital Staff)**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,

  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  role VARCHAR(50) NOT NULL,  -- ADMIN, DOCTOR, NURSE, RECEPTIONIST

  -- 2FA
  totp_secret VARCHAR(32),
  totp_enabled BOOLEAN DEFAULT false,

  -- Profile
  full_name VARCHAR(255),
  specialization VARCHAR(100),  -- For doctors
  license_number VARCHAR(100),

  -- Security
  last_login TIMESTAMP,
  last_ip VARCHAR(45),
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **3. Patients Table**
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,

  -- Identity
  patient_number VARCHAR(50) UNIQUE NOT NULL,  -- Hospital-specific ID
  national_id VARCHAR(50),  -- Country-specific ID (encrypted)

  -- Demographics
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10),
  blood_type VARCHAR(5),

  -- Contact
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,

  -- Emergency Contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **4. Medical Records Table**
```sql
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,

  specialty VARCHAR(100) NOT NULL,  -- cardiology, neurology, etc.

  -- Consultation Data
  symptoms JSONB,
  vital_signs JSONB,
  diagnosis TEXT,
  treatment_plan TEXT,

  -- AI Analysis
  ai_provider VARCHAR(50),  -- claude, gpt-4, gemini
  ai_confidence_score DECIMAL(3,2),
  ai_raw_response JSONB,

  -- Attachments
  images JSONB DEFAULT '[]',  -- [{url, type, analysis}]
  documents JSONB DEFAULT '[]',

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **5. Audit Logs Table**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  action VARCHAR(100) NOT NULL,  -- LOGIN, LOGOUT, CREATE_PATIENT, etc.
  resource_type VARCHAR(50),     -- patient, medical_record, user
  resource_id UUID,

  ip_address VARCHAR(45),
  user_agent TEXT,

  details JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 SECURITY ARCHITECTURE

### **1. Authentication Flow**
```
┌─────────────────────────────────────────────────┐
│  1. User enters email + password                │
│  2. System validates credentials                │
│  3. If 2FA enabled → send TOTP/SMS code         │
│  4. User enters 2FA code                        │
│  5. System validates 2FA                        │
│  6. Check IP whitelist (if configured)          │
│  7. Generate JWT token (hospital_id + user_id)  │
│  8. Set secure HTTP-only cookie                 │
└─────────────────────────────────────────────────┘
```

### **2. Authorization (RBAC)**
```javascript
ROLES = {
  SUPER_ADMIN: {
    permissions: ['*']  // Full system access
  },
  HOSPITAL_ADMIN: {
    permissions: [
      'hospital:update',
      'users:create', 'users:read', 'users:update', 'users:delete',
      'patients:*',
      'medical_records:*',
      'settings:*',
      'audit_logs:read'
    ]
  },
  DOCTOR: {
    permissions: [
      'patients:create', 'patients:read', 'patients:update',
      'medical_records:create', 'medical_records:read', 'medical_records:update',
      'ai:consult'
    ]
  },
  NURSE: {
    permissions: [
      'patients:read', 'patients:update',
      'medical_records:read',
      'vital_signs:record'
    ]
  },
  RECEPTIONIST: {
    permissions: [
      'patients:create', 'patients:read',
      'appointments:*'
    ]
  }
};
```

### **3. IP Whitelist Enforcement**
```javascript
// Middleware: Check if user's IP is whitelisted
function enforceIPWhitelist(req, res, next) {
  const hospital = req.hospital;  // From JWT
  const userIP = req.ip;

  if (hospital.ip_whitelist && hospital.ip_whitelist.length > 0) {
    const isAllowed = hospital.ip_whitelist.some(range => {
      return ipRangeCheck(userIP, range);
    });

    if (!isAllowed) {
      auditLog({
        action: 'IP_BLOCKED',
        hospital_id: hospital.id,
        ip_address: userIP
      });
      return res.status(403).json({ error: 'Access denied: IP not whitelisted' });
    }
  }

  next();
}
```

### **4. 2FA (TOTP)**
```javascript
// Setup 2FA
const secret = speakeasy.generateSecret({ name: 'Ailydian Medical' });
const qrCode = await QRCode.toDataURL(secret.otpauth_url);

// Verify 2FA
const verified = speakeasy.totp.verify({
  secret: user.totp_secret,
  encoding: 'base32',
  token: userProvidedCode,
  window: 2  // Allow ±2 time steps (60 seconds)
});
```

---

## 🎨 HOSPITAL BRANDING SYSTEM

Each hospital customizes:
- **Logo** (uploaded to Azure Blob Storage)
- **Primary/Secondary Colors** (CSS variables)
- **Custom Domain** (optional: hospital.ailydian.com)
- **Welcome Message** (multi-language)
- **Emergency Numbers** (auto-detect or custom)

**CSS Variable Injection:**
```css
:root {
  --hospital-primary: #0066cc;    /* From hospital config */
  --hospital-secondary: #00aaff;  /* From hospital config */
  --hospital-logo: url('https://cdn.ailydian.com/hospitals/{hospital_id}/logo.png');
}
```

---

## 🌍 MULTI-TENANT ROUTING

### **Subdomain-based Tenants**
```
https://istanbul-memorial.ailydian.com  → Hospital ID: abc123
https://ankara-city.ailydian.com        → Hospital ID: def456
https://izmir-medical.ailydian.com      → Hospital ID: ghi789
```

### **Path-based Tenants (Alternative)**
```
https://ailydian.com/hospitals/istanbul-memorial  → Hospital ID: abc123
https://ailydian.com/hospitals/ankara-city        → Hospital ID: def456
```

### **Tenant Resolution Middleware**
```javascript
function resolveTenant(req, res, next) {
  const subdomain = req.hostname.split('.')[0];  // "istanbul-memorial"

  const hospital = await Hospital.findOne({ slug: subdomain });

  if (!hospital) {
    return res.status(404).json({ error: 'Hospital not found' });
  }

  req.hospital = hospital;  // Attach to request
  next();
}
```

---

## 📊 HOSPITAL DASHBOARD MODULES

### **1. Analytics Dashboard**
```javascript
{
  "patients_today": 42,
  "consultations_today": 67,
  "ai_consultations": 45,
  "emergency_cases": 3,
  "top_specializations": [
    { "name": "Cardiology", "count": 18 },
    { "name": "Neurology", "count": 12 }
  ],
  "ai_usage_by_model": {
    "claude": 25,
    "gpt-4": 15,
    "gemini": 5
  }
}
```

### **2. User Management**
- Create/Edit/Delete hospital staff
- Assign roles and permissions
- View login history
- Lock/unlock accounts
- Reset passwords

### **3. Patient Management**
- Register new patients
- Search/filter patients
- View medical history
- Upload documents/images
- Track appointments

### **4. Settings**
- **General:** Hospital info, branding
- **Security:** 2FA, IP whitelist, password policy
- **Modules:** Enable/disable specializations, AI models
- **Integrations:** FHIR, HL7, external systems
- **Billing:** Subscription plan, usage limits

---

## 🚀 FIRILDAK AI INTEGRATION

**Firildak AI** adapts to each hospital:

```javascript
// Hospital-specific AI context
const firildakContext = {
  hospital_id: hospital.id,
  hospital_name: hospital.name,
  enabled_specializations: hospital.enabled_specializations,
  preferred_ai_models: hospital.enabled_ai_models,

  // Hospital-specific medical knowledge
  custom_protocols: hospital.medical_protocols,
  drug_formulary: hospital.drug_list,

  // Language preference
  default_language: hospital.country_code === 'TR' ? 'tr' : 'en'
};

// Firildak processes request with hospital context
const response = await FirildakAI.process({
  ...firildakContext,
  patient_data: patientData,
  query: medicalQuery
});
```

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] **Database:** Create PostgreSQL multi-tenant schema
- [ ] **Backend:** Hospital API (CRUD, config, security)
- [ ] **Frontend:** Hospital Admin Dashboard
- [ ] **Authentication:** JWT + 2FA + IP whitelist
- [ ] **Authorization:** RBAC middleware
- [ ] **Tenant Resolution:** Subdomain/path-based routing
- [ ] **Branding System:** Logo upload, color customization
- [ ] **Patient Portal:** Multi-tenant medical interface
- [ ] **Firildak Integration:** Hospital-specific AI context
- [ ] **Audit Logging:** Track all admin actions
- [ ] **Testing:** End-to-end multi-tenant tests
- [ ] **Deployment:** Production-ready with zero errors

---

## 🎯 SUCCESS CRITERIA

✅ **Each hospital operates independently** (full data isolation)
✅ **Shared AI/Medical services** (cost-effective, consistent quality)
✅ **Enterprise security** (2FA, IP whitelist, audit logs)
✅ **Real data only** (no mock/demo mode)
✅ **Scalable architecture** (supports 1000+ hospitals)
✅ **White-hat compliant** (HIPAA considerations, security best practices)

---

**ARCHITECTURE DESIGN: COMPLETE ✅**

**Next Steps:**
1. Implement multi-tenant database schema
2. Create Hospital Admin Panel API
3. Build Hospital Admin Dashboard UI
4. Integrate Firildak AI with hospital context
5. Deploy and test with 2-3 pilot hospitals
