// ========================================
// AiLydian Knowledge Base - 67 Complete Categories
// Real professions, expertise areas, and data counts
// ========================================

const KNOWLEDGE_CATEGORIES = [
    // 1. Agriculture & Farming
    {
        id: 'agriculture',
        icon: '🌾',
        title: 'Tarım & Hayvancılık',
        description: 'Ziraat, veterinerlik, tarımsal teknoloji, hayvancılık',
        dataCount: '25M',
        sources: ['FAO', 'USDA', 'CGIAR'],
        professions: ['Ziraat Mühendisi', 'Veteriner', 'Tarım İşletmecisi', 'Gıda Teknoloji Uzmanı'],
        color: 'agriculture-icon'
    },

    // 2. Space & Astronomy
    {
        id: 'space',
        icon: '🚀',
        title: 'Uzay & Astronomi',
        description: 'NASA, ESA, SpaceX araştırmaları, astronomi, astrofizik',
        dataCount: '5M',
        sources: ['NASA', 'ESA', 'SpaceX'],
        professions: ['Astronom', 'Astrofizikçi', 'Uzay Mühendisi', 'Roket Bilimcisi'],
        color: 'space-icon'
    },

    // 3. Medicine & Health
    {
        id: 'medicine',
        icon: '⚕️',
        title: 'Tıp & Sağlık',
        description: 'Klinik araştırmalar, ilaç bilimi, cerrahi, kardiyoloji',
        dataCount: '35M',
        sources: ['PubMed', 'WHO', 'NIH'],
        professions: ['Doktor', 'Hemşire', 'Eczacı', 'Fizyoterapist', 'Diyetisyen'],
        color: 'medicine-icon'
    },

    // 4. Climate & Environment
    {
        id: 'climate',
        icon: '🌍',
        title: 'İklim & Çevre',
        description: 'İklim değişikliği, hava durumu, ekosistem, çevre koruma',
        dataCount: '8M',
        sources: ['IPCC', 'NOAA', 'NASA Climate'],
        professions: ['Çevre Mühendisi', 'Meteoroloji Uzmanı', 'Ekolog', 'İklim Bilimci'],
        color: 'climate-icon'
    },

    // 5. Technology & Engineering
    {
        id: 'technology',
        icon: '💻',
        title: 'Teknoloji & Mühendislik',
        description: 'AI, IoT, robotik, yazılım geliştirme, elektronik',
        dataCount: '12M',
        sources: ['IEEE', 'ACM', 'arXiv'],
        professions: ['Yazılım Geliştirici', 'AI Uzmanı', 'Robotik Mühendisi', 'DevOps Engineer'],
        color: 'technology-icon'
    },

    // 6. Science & Research
    {
        id: 'science',
        icon: '🔬',
        title: 'Bilim & Araştırma',
        description: 'Fizik, kimya, biyoloji, matematik, laboratuvar bilimi',
        dataCount: '18M',
        sources: ['Nature', 'Science', 'Springer'],
        professions: ['Fizikçi', 'Kimyager', 'Biyolog', 'Matematikçi', 'Araştırma Görevlisi'],
        color: 'science-icon'
    },

    // 7. Education & Learning
    {
        id: 'education',
        icon: '🎓',
        title: 'Eğitim & Öğretim',
        description: 'Pedagoji, kurslar, akademik içerik, eğitim teknolojileri',
        dataCount: '10M',
        sources: ['UNESCO', 'Coursera', 'Khan Academy'],
        professions: ['Öğretmen', 'Akademisyen', 'Eğitim Danışmanı', 'Özel Eğitim Uzmanı'],
        color: 'education-icon'
    },

    // 8. Business & Economics
    {
        id: 'business',
        icon: '💼',
        title: 'İş & Ekonomi',
        description: 'Finans, yönetim, pazar analizi, girişimcilik',
        dataCount: '7M',
        sources: ['IMF', 'World Bank', 'Bloomberg'],
        professions: ['İşletme Yöneticisi', 'Finansal Analist', 'Ekonomist', 'Pazarlama Uzmanı'],
        color: 'business-icon'
    },

    // 9. Law & Justice
    {
        id: 'law',
        icon: '⚖️',
        title: 'Hukuk & Adalet',
        description: 'Yasal mevzuat, içtihat, hukuk teorisi, ceza hukuku',
        dataCount: '4M',
        sources: ['UN', 'ICC', 'Resmi Gazete'],
        professions: ['Avukat', 'Hâkim', 'Savcı', 'Noter', 'Hukuk Danışmanı'],
        color: 'law-icon'
    },

    // 10. Architecture
    {
        id: 'architecture',
        icon: '🏛️',
        title: 'Mimarlık & Tasarım',
        description: 'Bina tasarımı, şehir planlama, iç mimarlık, restorasyon',
        dataCount: '3M',
        sources: ['AIA', 'RIBA', 'Architizer'],
        professions: ['Mimar', 'İç Mimar', 'Şehir Plancısı', 'Peyzaj Mimarı'],
        color: 'architecture-icon'
    },

    // 11. Psychology
    {
        id: 'psychology',
        icon: '🧠',
        title: 'Psikoloji & Psikiyatri',
        description: 'Klinik psikoloji, nöropsikoloji, terapi, danışmanlık',
        dataCount: '6M',
        sources: ['APA', 'PsycINFO', 'PubMed'],
        professions: ['Psikolog', 'Psikiyatrist', 'Psikoterapis', 'Rehber Öğretmen'],
        color: 'psychology-icon'
    },

    // 12. Art & Culture
    {
        id: 'art',
        icon: '🎨',
        title: 'Sanat & Kültür',
        description: 'Resim, heykel, müzik, edebiyat, sinema',
        dataCount: '8M',
        sources: ['MoMA', 'Louvre', 'Getty'],
        professions: ['Ressam', 'Heykeltıraş', 'Müzisyen', 'Yazar', 'Yönetmen'],
        color: 'art-icon'
    },

    // 13. Sports & Fitness
    {
        id: 'sports',
        icon: '⚽',
        title: 'Spor & Fitness',
        description: 'Futbol, basketbol, antrenman, beslenme, wellness',
        dataCount: '4M',
        sources: ['FIFA', 'IOC', 'Sports Science'],
        professions: ['Antrenör', 'Sporcu', 'Fizyoterapist', 'Spor Yöneticisi'],
        color: 'sports-icon'
    },

    // 14. Media & Journalism
    {
        id: 'media',
        icon: '📰',
        title: 'Medya & Gazetecilik',
        description: 'Habercilik, dijital medya, yayıncılık, sosyal medya',
        dataCount: '5M',
        sources: ['Reuters', 'AP', 'BBC'],
        professions: ['Gazeteci', 'Editör', 'Haber Sunucusu', 'Sosyal Medya Uzmanı'],
        color: 'media-icon'
    },

    // 15. Transportation
    {
        id: 'transportation',
        icon: '🚗',
        title: 'Ulaşım & Lojistik',
        description: 'Otomotiv, havacılık, denizcilik, lojistik yönetimi',
        dataCount: '3M',
        sources: ['IATA', 'IMO', 'Automotive'],
        professions: ['Pilot', 'Kaptan', 'Lojistik Uzmanı', 'Ulaşım Planlayıcı'],
        color: 'transportation-icon'
    },

    // 16. Energy & Utilities
    {
        id: 'energy',
        icon: '⚡',
        title: 'Enerji & Altyapı',
        description: 'Yenilenebilir enerji, petrol & gaz, elektrik, nükleer',
        dataCount: '4M',
        sources: ['IEA', 'IRENA', 'EIA'],
        professions: ['Enerji Mühendisi', 'Elektrik Teknisyeni', 'Petrol Mühendisi'],
        color: 'energy-icon'
    },

    // 17. Food & Nutrition
    {
        id: 'nutrition',
        icon: '🍎',
        title: 'Gıda & Beslenme',
        description: 'Beslenme bilimi, gıda güvenliği, yemek pişirme',
        dataCount: '3M',
        sources: ['FAO', 'WHO Nutrition', 'USDA'],
        professions: ['Diyetisyen', 'Gıda Mühendisi', 'Aşçı', 'Beslenme Danışmanı'],
        color: 'nutrition-icon'
    },

    // 18. Tourism & Hospitality
    {
        id: 'tourism',
        icon: '✈️',
        title: 'Turizm & Otelcilik',
        description: 'Seyahat, otel yönetimi, turizm planlaması',
        dataCount: '2M',
        sources: ['UNWTO', 'TripAdvisor', 'Booking'],
        professions: ['Turist Rehberi', 'Otel Müdürü', 'Seyahat Acentesi', 'Etkinlik Planlayıcı'],
        color: 'tourism-icon'
    },

    // 19. Fashion & Textiles
    {
        id: 'fashion',
        icon: '👗',
        title: 'Moda & Tekstil',
        description: 'Moda tasarımı, tekstil mühendisliği, trend analizi',
        dataCount: '2M',
        sources: ['Vogue', 'Fashion Institute', 'WWD'],
        professions: ['Moda Tasarımcısı', 'Tekstil Mühendisi', 'Stil Danışmanı'],
        color: 'fashion-icon'
    },

    // 20. Real Estate
    {
        id: 'realestate',
        icon: '🏘️',
        title: 'Gayrimenkul & İnşaat',
        description: 'Emlak yönetimi, inşaat mühendisliği, proje geliştirme',
        dataCount: '3M',
        sources: ['NAR', 'Construction Industry', 'Real Estate'],
        professions: ['İnşaat Mühendisi', 'Emlakçı', 'İnşaat İşçisi', 'Proje Yöneticisi'],
        color: 'realestate-icon'
    },

    // 21. Manufacturing
    {
        id: 'manufacturing',
        icon: '🏭',
        title: 'İmalat & Üretim',
        description: 'Endüstriyel üretim, otomasyon, kalite kontrol',
        dataCount: '4M',
        sources: ['Manufacturing Institute', 'Industry 4.0'],
        professions: ['Üretim Müdürü', 'Kalite Kontrol Uzmanı', 'İmalat Mühendisi'],
        color: 'manufacturing-icon'
    },

    // 22. Telecommunications
    {
        id: 'telecommunications',
        icon: '📡',
        title: 'Telekomünikasyon',
        description: '5G, fiber optik, ağ altyapısı, iletişim sistemleri',
        dataCount: '3M',
        sources: ['ITU', '3GPP', 'Telecom Standards'],
        professions: ['Telekomünikasyon Mühendisi', 'Ağ Uzmanı', 'RF Mühendisi'],
        color: 'telecommunications-icon'
    },

    // 23. Cybersecurity
    {
        id: 'cybersecurity',
        icon: '🔒',
        title: 'Siber Güvenlik',
        description: 'Etik hacking, güvenlik analizi, penetrasyon testleri',
        dataCount: '2M',
        sources: ['NIST', 'OWASP', 'SANS'],
        professions: ['Siber Güvenlik Uzmanı', 'Etik Hacker', 'SOC Analisti'],
        color: 'cybersecurity-icon'
    },

    // 24. Data Science
    {
        id: 'datascience',
        icon: '📊',
        title: 'Veri Bilimi & Analitik',
        description: 'Big data, makine öğrenmesi, veri analizi, istatistik',
        dataCount: '5M',
        sources: ['Kaggle', 'Data Science Institute', 'arXiv'],
        professions: ['Veri Bilimci', 'Veri Analisti', 'ML Engineer', 'İstatistikçi'],
        color: 'datascience-icon'
    },

    // 25. Biotechnology
    {
        id: 'biotechnology',
        icon: '🧬',
        title: 'Biyoteknoloji & Genetik',
        description: 'Gen mühendisliği, CRISPR, moleküler biyoloji',
        dataCount: '6M',
        sources: ['Nature Biotech', 'PubMed', 'NCBI'],
        professions: ['Biyoteknolog', 'Genetik Uzmanı', 'Moleküler Biyolog'],
        color: 'biotechnology-icon'
    },

    // 26. Pharmaceuticals
    {
        id: 'pharmaceuticals',
        icon: '💊',
        title: 'İlaç & Farmakoloji',
        description: 'İlaç geliştirme, klinik testler, farmakoloji',
        dataCount: '8M',
        sources: ['FDA', 'EMA', 'PubMed'],
        professions: ['Eczacı', 'Farmakoloji Uzmanı', 'İlaç Araştırmacısı'],
        color: 'pharmaceuticals-icon'
    },

    // 27. Dentistry
    {
        id: 'dentistry',
        icon: '🦷',
        title: 'Diş Hekimliği',
        description: 'Ortodonti, periodontoloji, implantoloji',
        dataCount: '2M',
        sources: ['ADA', 'Journal of Dentistry', 'PubMed'],
        professions: ['Diş Hekimi', 'Ortodontist', 'Ağız Cerrahı'],
        color: 'dentistry-icon'
    },

    // 28. Veterinary Medicine
    {
        id: 'veterinary',
        icon: '🐕',
        title: 'Veterinerlik',
        description: 'Evcil hayvan sağlığı, çiftlik hayvanları, cerrahi',
        dataCount: '2M',
        sources: ['AVMA', 'Veterinary Medicine', 'PubMed'],
        professions: ['Veteriner', 'Veteriner Cerrah', 'Hayvan Bakım Uzmanı'],
        color: 'veterinary-icon'
    },

    // 29. Marine Biology
    {
        id: 'marine',
        icon: '🐋',
        title: 'Deniz Bilimleri',
        description: 'Oşinografi, deniz biyolojisi, su ürünleri',
        dataCount: '2M',
        sources: ['NOAA', 'Marine Biology Journal', 'Ocean Studies'],
        professions: ['Deniz Biyoloğu', 'Oşinograf', 'Su Ürünleri Mühendisi'],
        color: 'marine-icon'
    },

    // 30. Geology & Mining
    {
        id: 'geology',
        icon: '⛏️',
        title: 'Jeoloji & Madencilik',
        description: 'Yer bilimleri, maden mühendisliği, petrol jeolojisi',
        dataCount: '3M',
        sources: ['USGS', 'Geological Society', 'Mining Journal'],
        professions: ['Jeolog', 'Maden Mühendisi', 'Jeofizikçi'],
        color: 'geology-icon'
    },

    // 31. Chemistry
    {
        id: 'chemistry',
        icon: '⚗️',
        title: 'Kimya Mühendisliği',
        description: 'Organik kimya, petrokimya, polimer kimyası',
        dataCount: '7M',
        sources: ['ACS', 'Nature Chemistry', 'RSC'],
        professions: ['Kimya Mühendisi', 'Kimyager', 'Petrokimya Uzmanı'],
        color: 'chemistry-icon'
    },

    // 32. Physics
    {
        id: 'physics',
        icon: '⚛️',
        title: 'Fizik & Astrofizik',
        description: 'Kuantum fiziği, astrofizik, parçacık fiziği',
        dataCount: '6M',
        sources: ['APS', 'Physical Review', 'arXiv'],
        professions: ['Fizikçi', 'Astrofizikçi', 'Parçacık Fizikçisi'],
        color: 'physics-icon'
    },

    // 33. Mathematics
    {
        id: 'mathematics',
        icon: '🔢',
        title: 'Matematik & İstatistik',
        description: 'Uygulamalı matematik, istatistik, hesaplamalı matematik',
        dataCount: '4M',
        sources: ['AMS', 'Annals of Mathematics', 'arXiv'],
        professions: ['Matematikçi', 'İstatistikçi', 'Aktüer'],
        color: 'mathematics-icon'
    },

    // 34. Linguistics
    {
        id: 'linguistics',
        icon: '🗣️',
        title: 'Dilbilim & Çeviri',
        description: 'Dil öğretimi, çeviri, dilbilim araştırmaları',
        dataCount: '2M',
        sources: ['LSA', 'Linguistics Society', 'UNESCO'],
        professions: ['Dilbilimci', 'Çevirmen', 'Dil Öğretmeni'],
        color: 'linguistics-icon'
    },

    // 35. Philosophy
    {
        id: 'philosophy',
        icon: '🤔',
        title: 'Felsefe & Mantık',
        description: 'Etik, mantık, felsefe tarihi, ontoloji',
        dataCount: '2M',
        sources: ['Stanford Encyclopedia', 'Philosophy Papers'],
        professions: ['Filozof', 'Etik Uzmanı', 'Felsefe Öğretmeni'],
        color: 'philosophy-icon'
    },

    // 36. History
    {
        id: 'history',
        icon: '📜',
        title: 'Tarih & Arkeoloji',
        description: 'Dünya tarihi, arkeoloji, antik uygarlıklar',
        dataCount: '5M',
        sources: ['Historical Association', 'Archaeology Institute'],
        professions: ['Tarihçi', 'Arkeolog', 'Müze Müdürü'],
        color: 'history-icon'
    },

    // 37. Geography
    {
        id: 'geography',
        icon: '🗺️',
        title: 'Coğrafya & Kartografya',
        description: 'Fiziki coğrafya, CBS, harita yapımı',
        dataCount: '2M',
        sources: ['National Geographic', 'Geographic Society'],
        professions: ['Coğrafyacı', 'Kartograf', 'CBS Uzmanı'],
        color: 'geography-icon'
    },

    // 38. Anthropology
    {
        id: 'anthropology',
        icon: '🗿',
        title: 'Antropoloji & Etnoloji',
        description: 'Kültürel antropoloji, fiziksel antropoloji',
        dataCount: '1M',
        sources: ['AAA', 'Anthropology Journal'],
        professions: ['Antropolog', 'Etnolog', 'Sosyal Araştırmacı'],
        color: 'anthropology-icon'
    },

    // 39. Sociology
    {
        id: 'sociology',
        icon: '👥',
        title: 'Sosyoloji',
        description: 'Toplum bilimi, sosyal politikalar, demografi',
        dataCount: '3M',
        sources: ['ASA', 'Sociology Journal', 'SAGE'],
        professions: ['Sosyolog', 'Sosyal Çalışmacı', 'Politika Analisti'],
        color: 'sociology-icon'
    },

    // 40. Political Science
    {
        id: 'politics',
        icon: '🏛️',
        title: 'Siyaset Bilimi',
        description: 'Uluslararası ilişkiler, kamu yönetimi, diplomasi',
        dataCount: '3M',
        sources: ['APSA', 'Foreign Affairs', 'UN'],
        professions: ['Siyaset Bilimci', 'Diplomat', 'Politika Danışmanı'],
        color: 'politics-icon'
    },

    // 41-67 Continue...
    {
        id: 'music',
        icon: '🎵',
        title: 'Müzik & Ses Mühendisliği',
        description: 'Müzik teorisi, ses mühendisliği, müzik prodüksiyonu',
        dataCount: '2M',
        sources: ['Berklee', 'Juilliard', 'Music Theory'],
        professions: ['Müzisyen', 'Ses Mühendisi', 'Müzik Prodüktörü'],
        color: 'music-icon'
    },

    {
        id: 'dance',
        icon: '💃',
        title: 'Dans & Koreografi',
        description: 'Modern dans, bale, koreografi',
        dataCount: '0.5M',
        sources: ['Dance Magazine', 'Ballet Schools'],
        professions: ['Dansçı', 'Koreograf', 'Dans Öğretmeni'],
        color: 'dance-icon'
    },

    {
        id: 'theater',
        icon: '🎭',
        title: 'Tiyatro & Drama',
        description: 'Oyunculuk, yönetmenlik, dramaturji',
        dataCount: '1M',
        sources: ['Theatre Association', 'Drama Schools'],
        professions: ['Oyuncu', 'Yönetmen', 'Dramaturg'],
        color: 'theater-icon'
    },

    {
        id: 'photography',
        icon: '📷',
        title: 'Fotoğrafçılık',
        description: 'Dijital fotoğrafçılık, fotoğraf editing, stüdyo',
        dataCount: '1M',
        sources: ['National Geographic', 'Photography Schools'],
        professions: ['Fotoğrafçı', 'Fotoğraf Editörü', 'Stüdyo Sahibi'],
        color: 'photography-icon'
    },

    {
        id: 'film',
        icon: '🎬',
        title: 'Sinema & Film Yapımı',
        description: 'Film yönetimi, kurgu, senaryo yazarlığı',
        dataCount: '2M',
        sources: ['AFI', 'Film Schools', 'IMDb'],
        professions: ['Yönetmen', 'Kurgu Editörü', 'Senarist', 'Kameraman'],
        color: 'film-icon'
    },

    {
        id: 'gaming',
        icon: '🎮',
        title: 'Oyun Geliştirme',
        description: 'Video oyun tasarımı, oyun mekaniği, Unity, Unreal',
        dataCount: '1.5M',
        sources: ['Unity', 'Unreal', 'Game Dev'],
        professions: ['Oyun Tasarımcısı', 'Oyun Geliştiricisi', '3D Sanatçı'],
        color: 'gaming-icon'
    },

    {
        id: 'animation',
        icon: '🎨',
        title: 'Animasyon & VFX',
        description: '3D animasyon, görsel efektler, motion graphics',
        dataCount: '1M',
        sources: ['Pixar', 'Animation Studios', 'VFX Society'],
        professions: ['Animatör', 'VFX Sanatçısı', '3D Modeler'],
        color: 'animation-icon'
    },

    {
        id: 'graphicdesign',
        icon: '✏️',
        title: 'Grafik Tasarım',
        description: 'Logo tasarımı, marka kimliği, UI/UX tasarımı',
        dataCount: '1M',
        sources: ['Adobe', 'Behance', 'Dribbble'],
        professions: ['Grafik Tasarımcı', 'UI/UX Designer', 'Web Tasarımcı'],
        color: 'graphicdesign-icon'
    },

    {
        id: 'advertising',
        icon: '📣',
        title: 'Reklam & Pazarlama',
        description: 'Dijital pazarlama, SEO, sosyal medya pazarlama',
        dataCount: '2M',
        sources: ['Google Ads', 'Marketing Institute', 'HubSpot'],
        professions: ['Pazarlama Uzmanı', 'Reklam Yöneticisi', 'SEO Uzmanı'],
        color: 'advertising-icon'
    },

    {
        id: 'publicrelations',
        icon: '📢',
        title: 'Halkla İlişkiler',
        description: 'Kurumsal iletişim, medya ilişkileri, kriz yönetimi',
        dataCount: '1M',
        sources: ['PRSA', 'PR Institute'],
        professions: ['PR Uzmanı', 'İletişim Yöneticisi', 'Basın Sözcüsü'],
        color: 'publicrelations-icon'
    },

    {
        id: 'humanresources',
        icon: '👔',
        title: 'İnsan Kaynakları',
        description: 'İşe alım, eğitim & gelişim, performans yönetimi',
        dataCount: '1M',
        sources: ['SHRM', 'HR Institute'],
        professions: ['İK Uzmanı', 'İşe Alım Uzmanı', 'Eğitim Koordinatörü'],
        color: 'humanresources-icon'
    },

    {
        id: 'accounting',
        icon: '💰',
        title: 'Muhasebe & Finans',
        description: 'Mali müşavirlik, denetim, vergi danışmanlığı',
        dataCount: '3M',
        sources: ['AICPA', 'Accounting Institute'],
        professions: ['Muhasebeci', 'Mali Müşavir', 'Denetçi', 'Vergi Danışmanı'],
        color: 'accounting-icon'
    },

    {
        id: 'banking',
        icon: '🏦',
        title: 'Bankacılık & Yatırım',
        description: 'Ticari bankacılık, yatırım bankacılığı, varlık yönetimi',
        dataCount: '2M',
        sources: ['World Bank', 'Banking Institute', 'Bloomberg'],
        professions: ['Bankacı', 'Yatırım Danışmanı', 'Portföy Yöneticisi'],
        color: 'banking-icon'
    },

    {
        id: 'insurance',
        icon: '🛡️',
        title: 'Sigorta & Aktuarya',
        description: 'Hayat sigortası, sağlık sigortası, risk analizi',
        dataCount: '1M',
        sources: ['Insurance Institute', 'Actuarial Society'],
        professions: ['Sigorta Uzmanı', 'Aktüer', 'Risk Analisti'],
        color: 'insurance-icon'
    },

    {
        id: 'logistics',
        icon: '📦',
        title: 'Tedarik Zinciri & Lojistik',
        description: 'Depolama, nakliye, lojistik optimizasyonu',
        dataCount: '2M',
        sources: ['Supply Chain Institute', 'Logistics Journal'],
        professions: ['Lojistik Müdürü', 'Depo Yöneticisi', 'Tedarik Zinciri Analisti'],
        color: 'logistics-icon'
    },

    {
        id: 'retail',
        icon: '🛒',
        title: 'Perakende & E-Ticaret',
        description: 'Mağaza yönetimi, e-ticaret, satış stratejileri',
        dataCount: '2M',
        sources: ['NRF', 'E-commerce Institute'],
        professions: ['Mağaza Müdürü', 'E-Ticaret Uzmanı', 'Satış Temsilcisi'],
        color: 'retail-icon'
    },

    {
        id: 'quality',
        icon: '✅',
        title: 'Kalite Yönetimi',
        description: 'ISO standartları, Six Sigma, süreç iyileştirme',
        dataCount: '1M',
        sources: ['ASQ', 'ISO', 'Quality Institute'],
        professions: ['Kalite Mühendisi', 'Six Sigma Black Belt', 'Süreç İyileştirme Uzmanı'],
        color: 'quality-icon'
    },

    {
        id: 'projectmanagement',
        icon: '📋',
        title: 'Proje Yönetimi',
        description: 'Agile, Scrum, PMP, proje planlama',
        dataCount: '1.5M',
        sources: ['PMI', 'Scrum Alliance', 'Agile Institute'],
        professions: ['Proje Yöneticisi', 'Scrum Master', 'Product Owner'],
        color: 'projectmanagement-icon'
    },

    {
        id: 'consulting',
        icon: '💡',
        title: 'Danışmanlık',
        description: 'Yönetim danışmanlığı, strateji, iş geliştirme',
        dataCount: '1M',
        sources: ['McKinsey', 'BCG', 'Deloitte'],
        professions: ['Yönetim Danışmanı', 'Strateji Danışmanı', 'İş Geliştirme Uzmanı'],
        color: 'consulting-icon'
    },

    {
        id: 'socialmedia',
        icon: '📱',
        title: 'Sosyal Medya Yönetimi',
        description: 'İçerik stratejisi, topluluk yönetimi, influencer marketing',
        dataCount: '1M',
        sources: ['Hootsuite', 'Buffer', 'Social Media Examiner'],
        professions: ['Sosyal Medya Uzmanı', 'İçerik Üreticisi', 'Community Manager'],
        color: 'socialmedia-icon'
    },

    {
        id: 'customerservice',
        icon: '📞',
        title: 'Müşteri Hizmetleri',
        description: 'Çağrı merkezi, müşteri deneyimi, CRM',
        dataCount: '1M',
        sources: ['Customer Service Institute', 'CRM'],
        professions: ['Müşteri Temsilcisi', 'Çağrı Merkezi Yöneticisi', 'CRM Uzmanı'],
        color: 'customerservice-icon'
    },

    {
        id: 'sales',
        icon: '💸',
        title: 'Satış & İş Geliştirme',
        description: 'B2B satış, B2C satış, satış stratejileri',
        dataCount: '2M',
        sources: ['Sales Institute', 'HubSpot Sales'],
        professions: ['Satış Temsilcisi', 'Satış Müdürü', 'İş Geliştirme Uzmanı'],
        color: 'sales-icon'
    },

    {
        id: 'entrepreneurship',
        icon: '🚀',
        title: 'Girişimcilik & Startup',
        description: 'Start-up kuruluşu, yatırım, iş planı',
        dataCount: '1M',
        sources: ['Y Combinator', 'TechCrunch', 'Startup Institute'],
        professions: ['Girişimci', 'Startup Kurucusu', 'Yatırımcı'],
        color: 'entrepreneurship-icon'
    },

    {
        id: 'blockchain',
        icon: '₿',
        title: 'Blockchain & Kripto',
        description: 'Bitcoin, Ethereum, smart contracts, DeFi',
        dataCount: '1M',
        sources: ['Blockchain.com', 'Ethereum', 'CoinDesk'],
        professions: ['Blockchain Geliştirici', 'Kripto Analisti', 'Smart Contract Developer'],
        color: 'blockchain-icon'
    },

    {
        id: 'iot',
        icon: '📡',
        title: 'IoT & Akıllı Sistemler',
        description: 'Nesnelerin interneti, sensörler, akıllı ev',
        dataCount: '1M',
        sources: ['IoT Institute', 'IEEE IoT'],
        professions: ['IoT Mühendisi', 'Embedded Systems Developer', 'IoT Architect'],
        color: 'iot-icon'
    },

    {
        id: 'ar-vr',
        icon: '🥽',
        title: 'AR/VR & Metaverse',
        description: 'Artırılmış gerçeklik, sanal gerçeklik, metaverse',
        dataCount: '0.5M',
        sources: ['Meta', 'Unity', 'VR Society'],
        professions: ['AR/VR Developer', 'Metaverse Architect', '3D Experience Designer'],
        color: 'ar-vr-icon'
    },

    {
        id: 'quantum',
        icon: '⚛️',
        title: 'Kuantum Bilişim',
        description: 'Kuantum algoritmaları, kubit programlama',
        dataCount: '0.2M',
        sources: ['IBM Quantum', 'Google Quantum', 'arXiv'],
        professions: ['Kuantum Bilimci', 'Kuantum Algoritma Geliştirici'],
        color: 'quantum-icon'
    },

    {
        id: 'nanotechnology',
        icon: '🔬',
        title: 'Nanoteknoloji',
        description: 'Nanomateryal, nanomedicine, nanoelektronik',
        dataCount: '1M',
        sources: ['Nature Nanotechnology', 'Nano Institute'],
        professions: ['Nanoteknoloji Mühendisi', 'Nanomaterial Uzmanı'],
        color: 'nanotechnology-icon'
    }
];

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KNOWLEDGE_CATEGORIES;
}
