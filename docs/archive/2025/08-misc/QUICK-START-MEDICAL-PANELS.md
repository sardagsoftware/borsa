# Quick Start Guide - Medical Specialty Panels

## ⚡ Instant Access

1. **Start Server**:
   ```bash
   cd /home/lydian/Desktop/ailydian-ultra-pro
   node server.js
   ```

2. **Open Browser**:
   ```
   http://localhost:3100/medical-expert.html
   ```

3. **Click Any Specialty** in the left sidebar:
   - General Medicine
   - Cardiology
   - Neurology
   - Oncology
   - Pediatrics
   - Psychiatry
   - Orthopedics
   - Radiology

---

## 🎯 Quick Test Examples

### General Medicine
Click **General Medicine** → Fill in:
- Systolic: 120
- Diastolic: 80
- Heart Rate: 70
- Temperature: 37.0
- SpO2: 98
- Respiratory Rate: 16
→ Click **"Assess Vital Signs"**

### Cardiology
Click **Cardiology** → Framingham Risk:
- Age: 55
- Gender: Male
- Total Cholesterol: 200
- HDL: 50
- Systolic BP: 130
- ☑ Smoker
→ Click **"Calculate Risk"**

### Neurology
Click **Neurology** → Glasgow Coma Scale:
- Eye Opening: 4 - Spontaneous
- Verbal Response: 5 - Oriented
- Motor Response: 6 - Obeys commands
→ Click **"Calculate GCS"**

### Oncology
Click **Oncology** → TNM Staging:
- Cancer Type: Breast Cancer
- T Stage: T2
- N Stage: N1
- M Stage: M0
→ Click **"Calculate Stage"**

### Pediatrics
Click **Pediatrics** → Growth Chart:
- Age: 24 (months)
- Gender: Male
- Weight: 12 (kg)
- Height: 85 (cm)
→ Click **"Calculate Percentiles"**

### Psychiatry
Click **Psychiatry** → PHQ-9 Depression:
- Enter scores 0-3 for each of 9 questions
- Example: All 0s = No depression
- Example: All 2s = Moderate depression
→ Click **"Calculate PHQ-9"**

### Orthopedics
Click **Orthopedics** → Ottawa Ankle Rules:
- Check one or more boxes
- Example: Check "Bone tenderness at lateral malleolus"
→ Click **"Apply Ottawa Ankle Rules"**

---

## 🏥 All Available Tools

### General Medicine (3 tools)
1. Vital Signs Assessment
2. BMI Calculator
3. Prescription Formatter

### Cardiology (5 tools)
1. Framingham Risk Score
2. CHA2DS2-VASc Score
3. HAS-BLED Score
4. QTc Calculator
5. Cardiac Output Calculator

### Neurology (4 tools)
1. Glasgow Coma Scale
2. NIH Stroke Scale
3. ABCD2 Score
4. Seizure Classification

### Oncology (4 tools)
1. TNM Staging
2. ECOG Performance Status
3. Karnofsky Performance Status
4. Chemotherapy Dose Calculator

### Pediatrics (3 tools)
1. Growth Chart Calculator
2. APGAR Score
3. Pediatric Dosage Calculator

### Psychiatry (3 tools)
1. PHQ-9 Depression Screening
2. GAD-7 Anxiety Screening
3. MMSE Cognitive Assessment

### Orthopedics (3 tools)
1. Salter-Harris Classification
2. Ottawa Ankle Rules
3. Ottawa Knee Rules

### Radiology
1. DICOM Upload & Analysis

---

## 📊 What You'll See

Each tool displays:
- ✅ **Scores**: Large, color-coded results
- ✅ **Severity**: Normal/Abnormal/Critical status
- ✅ **Interpretation**: Clinical meaning
- ✅ **Recommendations**: Treatment guidance
- ✅ **Details**: Breakdown of calculations

Color Coding:
- 🟢 **Green** = Normal/Good
- 🟡 **Yellow** = Borderline/Moderate
- 🔴 **Red** = Abnormal/Critical

---

## 🔧 Troubleshooting

**Problem**: "Failed to fetch" errors
**Solution**: Make sure server is running on port 3100

**Problem**: Modal doesn't open
**Solution**: Check browser console for JavaScript errors

**Problem**: Results not displaying
**Solution**: Ensure all required fields are filled

**Problem**: API timeout
**Solution**: Check server logs, restart server if needed

---

## 📱 Mobile Access

All panels are mobile-responsive:
- Touch-friendly buttons
- Scrollable modals
- Optimized layouts

---

## 🎓 Medical Accuracy

All calculations use:
- ✅ Evidence-based medical formulas
- ✅ International clinical guidelines
- ✅ Validated scoring systems
- ✅ Real-time backend processing
- ✅ NO mock data

---

## 🚀 Production Ready

Status: **FULLY FUNCTIONAL**
- 40+ API endpoints live
- 25+ clinical calculators active
- Real-time processing
- Professional medical UI
- Complete error handling

---

## 📞 Need Help?

Server not starting?
```bash
npm install
node server.js
```

Check server status:
```bash
curl http://localhost:3100/health
```

View server logs:
```bash
# Server logs show API calls in real-time
```

---

**Enjoy using LyDian Medical AI! 🏥**
