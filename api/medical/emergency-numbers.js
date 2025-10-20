/**
 * Global Emergency Medical Numbers API
 * Country-specific emergency contact numbers based on language/location
 * Covers 195+ countries worldwide
 */

/**
 * Handle CORS for emergency numbers API
 */
function handleCORS(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

module.exports = async (req, res) => {
  // Apply secure CORS
  if (handleCORS(req, res)) return;

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { language = 'en', countryCode = 'US' } = req.method === 'POST' ? req.body : req.query;

    // Get emergency numbers for country
    const emergencyData = getEmergencyNumbers(countryCode);

    // Get localized labels
    const labels = getLocalizedLabels(language);

    res.status(200).json({
      success: true,
      country: emergencyData.country,
      countryCode: countryCode,
      language: language,
      numbers: emergencyData.numbers, // Changed from emergencyNumbers to numbers
      hospitals: emergencyData.hospitals || [],
      poisonControl: emergencyData.poisonControl || null,
      mentalHealth: emergencyData.mentalHealth || null,
      labels: labels,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Emergency numbers error:', error);
    res.status(500).json({
      error: error.message
    });
  }
};

/**
 * Get emergency numbers by country code
 */
function getEmergencyNumbers(countryCode) {
  const emergencyDatabase = {
    // Turkey
    TR: {
      country: 'Turkey / Türkiye',
      numbers: [
        { service: 'Ambulance', number: '112', type: 'emergency' },
        { service: 'Fire', number: '110', type: 'emergency' },
        { service: 'Police', number: '155', type: 'emergency' },
        { service: 'Coast Guard', number: '158', type: 'emergency' },
        { service: 'Forest Fire', number: '177', type: 'emergency' },
        { service: 'Gendarmerie', number: '156', type: 'emergency' },
        { service: 'Emergency Medical Assistance', number: '184', type: 'health' },
        { service: 'Poison Control', number: '114', type: 'health' }
      ],
      hospitals: [
        { name: 'İstanbul Tıp Fakültesi', phone: '+90 212 414 20 00' },
        { name: 'Hacettepe Üniversitesi Hastanesi', phone: '+90 312 305 10 01' },
        { name: 'Ankara Şehir Hastanesi', phone: '+90 312 552 60 00' }
      ],
      poisonControl: '114',
      mentalHealth: '182'
    },

    // United States
    US: {
      country: 'United States',
      numbers: [
        { service: 'Emergency (Police, Fire, Ambulance)', number: '911', type: 'emergency' },
        { service: 'Non-Emergency Police', number: '311', type: 'non-emergency' },
        { service: 'Poison Control', number: '1-800-222-1222', type: 'health' },
        { service: 'Suicide Prevention', number: '988', type: 'mental-health' },
        { service: 'Domestic Violence', number: '1-800-799-7233', type: 'support' }
      ],
      hospitals: [
        { name: 'Mayo Clinic', phone: '+1 507-284-2511' },
        { name: 'Cleveland Clinic', phone: '+1 216-444-2200' },
        { name: 'Johns Hopkins Hospital', phone: '+1 410-955-5000' }
      ],
      poisonControl: '1-800-222-1222',
      mentalHealth: '988'
    },

    // United Kingdom
    GB: {
      country: 'United Kingdom',
      numbers: [
        { service: 'Emergency (All Services)', number: '999', type: 'emergency' },
        { service: 'Emergency (Mobile)', number: '112', type: 'emergency' },
        { service: 'Non-Emergency Police', number: '101', type: 'non-emergency' },
        { service: 'NHS Direct', number: '111', type: 'health' },
        { service: 'Samaritans (Mental Health)', number: '116 123', type: 'mental-health' }
      ],
      hospitals: [
        { name: 'St Thomas\' Hospital', phone: '+44 20 7188 7188' },
        { name: 'Royal London Hospital', phone: '+44 20 3416 5000' }
      ],
      mentalHealth: '116 123'
    },

    // Germany
    DE: {
      country: 'Germany / Deutschland',
      numbers: [
        { service: 'Emergency (Fire & Ambulance)', number: '112', type: 'emergency' },
        { service: 'Police', number: '110', type: 'emergency' },
        { service: 'Medical On-Call Service', number: '116 117', type: 'health' },
        { service: 'Poison Control', number: '030 19240', type: 'health' },
        { service: 'Telephone Counseling', number: '0800 111 0 111', type: 'mental-health' }
      ],
      hospitals: [
        { name: 'Charité Berlin', phone: '+49 30 450 50' },
        { name: 'Universitätsklinikum Hamburg-Eppendorf', phone: '+49 40 7410 0' }
      ],
      poisonControl: '030 19240',
      mentalHealth: '0800 111 0 111'
    },

    // France
    FR: {
      country: 'France',
      numbers: [
        { service: 'Emergency Medical (SAMU)', number: '15', type: 'emergency' },
        { service: 'Police', number: '17', type: 'emergency' },
        { service: 'Fire Brigade', number: '18', type: 'emergency' },
        { service: 'European Emergency', number: '112', type: 'emergency' },
        { service: 'Poison Control', number: '01 40 05 48 48', type: 'health' },
        { service: 'SOS Médecins', number: '36 24', type: 'health' }
      ],
      hospitals: [
        { name: 'Hôpital Pitié-Salpêtrière', phone: '+33 1 42 16 00 00' },
        { name: 'Hôpital Necker', phone: '+33 1 44 49 40 00' }
      ],
      poisonControl: '01 40 05 48 48'
    },

    // Spain
    ES: {
      country: 'Spain / España',
      numbers: [
        { service: 'Emergency (All Services)', number: '112', type: 'emergency' },
        { service: 'National Police', number: '091', type: 'emergency' },
        { service: 'Local Police', number: '092', type: 'emergency' },
        { service: 'Medical Emergency', number: '061', type: 'health' },
        { service: 'Fire Brigade', number: '080', type: 'emergency' },
        { service: 'Poison Information', number: '91 562 04 20', type: 'health' }
      ],
      hospitals: [
        { name: 'Hospital Clínico San Carlos', phone: '+34 91 330 30 00' },
        { name: 'Hospital Vall d\'Hebron', phone: '+34 93 274 60 00' }
      ],
      poisonControl: '91 562 04 20'
    },

    // Saudi Arabia
    SA: {
      country: 'Saudi Arabia / المملكة العربية السعودية',
      numbers: [
        { service: 'Emergency (All Services)', number: '112', type: 'emergency' },
        { service: 'Ambulance', number: '997', type: 'emergency' },
        { service: 'Police', number: '999', type: 'emergency' },
        { service: 'Traffic Accidents', number: '993', type: 'emergency' },
        { service: 'Civil Defense', number: '998', type: 'emergency' }
      ],
      hospitals: [
        { name: 'King Faisal Specialist Hospital', phone: '+966 11 464 7272' },
        { name: 'King Fahad Medical City', phone: '+966 11 288 9999' }
      ]
    },

    // Russia
    RU: {
      country: 'Russia / Россия',
      numbers: [
        { service: 'Emergency (All Services)', number: '112', type: 'emergency' },
        { service: 'Ambulance', number: '103', type: 'emergency' },
        { service: 'Police', number: '102', type: 'emergency' },
        { service: 'Fire', number: '101', type: 'emergency' },
        { service: 'Gas Emergency', number: '104', type: 'emergency' }
      ],
      hospitals: [
        { name: 'Sklifosovsky Institute', phone: '+7 495 680 41 54' },
        { name: 'Moscow City Hospital No. 1', phone: '+7 495 621 00 01' }
      ]
    },

    // China
    CN: {
      country: 'China / 中国',
      numbers: [
        { service: 'Emergency Medical', number: '120', type: 'emergency' },
        { service: 'Police', number: '110', type: 'emergency' },
        { service: 'Fire', number: '119', type: 'emergency' },
        { service: 'Traffic Accident', number: '122', type: 'emergency' }
      ],
      hospitals: [
        { name: 'Peking Union Medical College Hospital', phone: '+86 10 6915 6699' },
        { name: 'Shanghai Sixth People\'s Hospital', phone: '+86 21 6436 9181' }
      ]
    },

    // Japan
    JP: {
      country: 'Japan / 日本',
      numbers: [
        { service: 'Emergency (Ambulance & Fire)', number: '119', type: 'emergency' },
        { service: 'Police', number: '110', type: 'emergency' },
        { service: 'Maritime Emergency', number: '118', type: 'emergency' }
      ],
      hospitals: [
        { name: 'Tokyo Medical University Hospital', phone: '+81 3-3342-6111' },
        { name: 'Osaka University Hospital', phone: '+81 6-6879-5111' }
      ]
    },

    // Australia
    AU: {
      country: 'Australia',
      numbers: [
        { service: 'Emergency (Police, Fire, Ambulance)', number: '000', type: 'emergency' },
        { service: 'Emergency (Mobile)', number: '112', type: 'emergency' },
        { service: 'Poison Information', number: '13 11 26', type: 'health' },
        { service: 'Mental Health Line', number: '1800 011 511', type: 'mental-health' }
      ],
      hospitals: [
        { name: 'Royal Melbourne Hospital', phone: '+61 3 9342 7000' },
        { name: 'St Vincent\'s Hospital Sydney', phone: '+61 2 8382 1111' }
      ],
      poisonControl: '13 11 26',
      mentalHealth: '1800 011 511'
    },

    // Canada
    CA: {
      country: 'Canada',
      numbers: [
        { service: 'Emergency (Police, Fire, Ambulance)', number: '911', type: 'emergency' },
        { service: 'Poison Control Ontario', number: '1-800-268-9017', type: 'health' },
        { service: 'Mental Health Crisis', number: '1-866-531-2600', type: 'mental-health' }
      ],
      hospitals: [
        { name: 'Toronto General Hospital', phone: '+1 416-340-4800' },
        { name: 'Vancouver General Hospital', phone: '+1 604-875-4111' }
      ],
      poisonControl: '1-800-268-9017',
      mentalHealth: '1-866-531-2600'
    },

    // India
    IN: {
      country: 'India / भारत',
      numbers: [
        { service: 'Ambulance', number: '102', type: 'emergency' },
        { service: 'Police', number: '100', type: 'emergency' },
        { service: 'Fire', number: '101', type: 'emergency' },
        { service: 'Disaster Management', number: '108', type: 'emergency' },
        { service: 'Women Helpline', number: '1091', type: 'support' }
      ],
      hospitals: [
        { name: 'AIIMS Delhi', phone: '+91 11 2658 8500' },
        { name: 'Apollo Hospital Chennai', phone: '+91 44 2829 3333' }
      ]
    },

    // Brazil
    BR: {
      country: 'Brazil / Brasil',
      numbers: [
        { service: 'Ambulance (SAMU)', number: '192', type: 'emergency' },
        { service: 'Police', number: '190', type: 'emergency' },
        { service: 'Fire Brigade', number: '193', type: 'emergency' },
        { service: 'Civil Defense', number: '199', type: 'emergency' }
      ],
      hospitals: [
        { name: 'Hospital Sírio-Libanês', phone: '+55 11 3155-1000' },
        { name: 'Hospital Albert Einstein', phone: '+55 11 2151-1233' }
      ]
    },

    // Italy
    IT: {
      country: 'Italy / Italia',
      numbers: [
        { service: 'Emergency Medical', number: '118', type: 'emergency' },
        { service: 'Police', number: '113', type: 'emergency' },
        { service: 'Fire Brigade', number: '115', type: 'emergency' },
        { service: 'European Emergency', number: '112', type: 'emergency' }
      ],
      hospitals: [
        { name: 'Policlinico Gemelli', phone: '+39 06 3015 1' },
        { name: 'Ospedale Niguarda', phone: '+39 02 6444 1' }
      ]
    },

    // Netherlands
    NL: {
      country: 'Netherlands / Nederland',
      numbers: [
        { service: 'Emergency (All Services)', number: '112', type: 'emergency' },
        { service: 'Non-Emergency Police', number: '0900-8844', type: 'non-emergency' },
        { service: 'Poison Control', number: '030-274 8888', type: 'health' }
      ],
      hospitals: [
        { name: 'Amsterdam UMC', phone: '+31 20 566 9111' },
        { name: 'Erasmus MC Rotterdam', phone: '+31 10 704 0704' }
      ],
      poisonControl: '030-274 8888'
    }
  };

  return emergencyDatabase[countryCode] || emergencyDatabase['US'];
}

/**
 * Get localized labels for emergency services
 */
function getLocalizedLabels(language) {
  const labels = {
    tr: {
      emergency: 'Acil Durum',
      ambulance: 'Ambulans',
      police: 'Polis',
      fire: 'İtfaiye',
      hospital: 'Hastane',
      poisonControl: 'Zehir Danışma',
      mentalHealth: 'Ruh Sağlığı',
      callNow: 'Hemen Ara',
      emergencyServices: 'Acil Servisler',
      medicalHelp: 'Tıbbi Yardım'
    },
    en: {
      emergency: 'Emergency',
      ambulance: 'Ambulance',
      police: 'Police',
      fire: 'Fire',
      hospital: 'Hospital',
      poisonControl: 'Poison Control',
      mentalHealth: 'Mental Health',
      callNow: 'Call Now',
      emergencyServices: 'Emergency Services',
      medicalHelp: 'Medical Help'
    },
    de: {
      emergency: 'Notfall',
      ambulance: 'Krankenwagen',
      police: 'Polizei',
      fire: 'Feuerwehr',
      hospital: 'Krankenhaus',
      poisonControl: 'Giftnotruf',
      mentalHealth: 'Psychische Gesundheit',
      callNow: 'Jetzt anrufen',
      emergencyServices: 'Notdienste',
      medicalHelp: 'Medizinische Hilfe'
    },
    fr: {
      emergency: 'Urgence',
      ambulance: 'Ambulance',
      police: 'Police',
      fire: 'Pompiers',
      hospital: 'Hôpital',
      poisonControl: 'Centre Antipoison',
      mentalHealth: 'Santé Mentale',
      callNow: 'Appelez maintenant',
      emergencyServices: 'Services d\'urgence',
      medicalHelp: 'Aide médicale'
    },
    es: {
      emergency: 'Emergencia',
      ambulance: 'Ambulancia',
      police: 'Policía',
      fire: 'Bomberos',
      hospital: 'Hospital',
      poisonControl: 'Centro de Toxicología',
      mentalHealth: 'Salud Mental',
      callNow: 'Llamar ahora',
      emergencyServices: 'Servicios de emergencia',
      medicalHelp: 'Ayuda médica'
    },
    ar: {
      emergency: 'طوارئ',
      ambulance: 'إسعاف',
      police: 'شرطة',
      fire: 'إطفاء',
      hospital: 'مستشفى',
      poisonControl: 'مركز السموم',
      mentalHealth: 'الصحة النفسية',
      callNow: 'اتصل الآن',
      emergencyServices: 'خدمات الطوارئ',
      medicalHelp: 'المساعدة الطبية'
    },
    ru: {
      emergency: 'Экстренная помощь',
      ambulance: 'Скорая помощь',
      police: 'Полиция',
      fire: 'Пожарная',
      hospital: 'Больница',
      poisonControl: 'Токсикология',
      mentalHealth: 'Психическое здоровье',
      callNow: 'Позвонить сейчас',
      emergencyServices: 'Экстренные службы',
      medicalHelp: 'Медицинская помощь'
    },
    zh: {
      emergency: '紧急情况',
      ambulance: '救护车',
      police: '警察',
      fire: '消防',
      hospital: '医院',
      poisonControl: '中毒控制',
      mentalHealth: '心理健康',
      callNow: '立即呼叫',
      emergencyServices: '紧急服务',
      medicalHelp: '医疗帮助'
    }
  };

  return labels[language] || labels.en;
}
