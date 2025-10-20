/**
 * ⚖️ LyDian AI - Azure Computer Vision Service
 * Document Image Analysis & Evidence Photo Processing
 *
 * Features:
 * - Document Image Analysis (Scanned legal documents)
 * - OCR (Optical Character Recognition)
 * - Evidence Photo Analysis (Crime scenes, documents)
 * - Handwriting Recognition (Signatures, notes)
 *
 * White-Hat Security: Active
 */

const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { ApiKeyCredentials } = require('@azure/ms-rest-js');
const { AZURE_CONFIG } = require('./azure-ai-config');

class AzureVisionService {
  constructor() {
    this.config = AZURE_CONFIG.computerVision;
    this.client = null;
    this.initialized = false;
  }

  /**
   * Initialize Azure Computer Vision Client
   */
  async initialize() {
    try {
      if (!this.config.apiKey || this.config.apiKey === '') {
        console.warn('⚠️  Azure Computer Vision API key not configured');
        return false;
      }

      const credentials = new ApiKeyCredentials({
        inHeader: { 'Ocp-Apim-Subscription-Key': this.config.apiKey }
      });

      this.client = new ComputerVisionClient(credentials, this.config.endpoint);

      this.initialized = true;
      console.log('✅ Azure Computer Vision Service initialized');
      return true;
    } catch (error) {
      console.error('❌ Azure Computer Vision initialization failed:', error.message);
      return false;
    }
  }

  /**
   * Analyze Legal Document Image
   * Use case: Scanned contracts, court decisions, petitions
   */
  async analyzeDocumentImage(imageUrl, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized) {
      return this._getMockDocumentAnalysis(imageUrl);
    }

    try {
      const {
        visualFeatures = ['Objects', 'Tags', 'Description', 'Text'],
        details = [],
        language = 'tr'
      } = options;

      const analysis = await this.client.analyzeImage(imageUrl, {
        visualFeatures,
        details,
        language
      });

      return {
        success: true,
        analysis: {
          description: analysis.description.captions[0]?.text || 'No description',
          confidence: analysis.description.captions[0]?.confidence || 0,
          tags: analysis.tags.map(tag => ({ name: tag.name, confidence: tag.confidence })),
          objects: analysis.objects?.map(obj => ({
            type: obj.object,
            confidence: obj.confidence,
            rectangle: obj.rectangle
          })) || [],
          text: analysis.description.tags || [],
          metadata: {
            width: analysis.metadata?.width,
            height: analysis.metadata?.height,
            format: analysis.metadata?.format
          }
        },
        imageUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Document image analysis error:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: this._getMockDocumentAnalysis(imageUrl)
      };
    }
  }

  /**
   * OCR: Extract text from legal documents
   * Use case: Scanned court documents, old records, evidence photos
   */
  async extractTextOCR(imageUrl, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized) {
      return this._getMockOCR(imageUrl);
    }

    try {
      const { language = 'tr', detectOrientation = true } = options;

      // Start OCR operation
      const result = await this.client.read(imageUrl, { language });

      // Get operation ID
      const operationId = result.operationLocation.split('/').slice(-1)[0];

      // Wait for result
      let ocrResult;
      while (true) {
        ocrResult = await this.client.getReadResult(operationId);
        if (ocrResult.status !== 'running' && ocrResult.status !== 'notStarted') {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (ocrResult.status === 'failed') {
        throw new Error('OCR operation failed');
      }

      // Extract text
      const pages = ocrResult.analyzeResult.readResults.map(page => ({
        pageNumber: page.page,
        angle: page.angle,
        width: page.width,
        height: page.height,
        unit: page.unit,
        lines: page.lines.map(line => ({
          text: line.text,
          boundingBox: line.boundingBox,
          words: line.words.map(word => ({
            text: word.text,
            confidence: word.confidence,
            boundingBox: word.boundingBox
          }))
        }))
      }));

      const fullText = pages
        .map(page => page.lines.map(line => line.text).join('\n'))
        .join('\n\n');

      return {
        success: true,
        pages,
        fullText,
        totalPages: pages.length,
        language,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ OCR extraction error:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: this._getMockOCR(imageUrl)
      };
    }
  }

  /**
   * Analyze Evidence Photo
   * Use case: Crime scene photos, accident photos, physical evidence
   */
  async analyzeEvidencePhoto(imageUrl, caseType = 'general') {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.initialized) {
      return this._getMockEvidenceAnalysis(imageUrl, caseType);
    }

    try {
      // Comprehensive analysis for evidence
      const analysis = await this.client.analyzeImage(imageUrl, {
        visualFeatures: [
          'Objects',
          'Tags',
          'Description',
          'Faces',
          'ImageType',
          'Color',
          'Adult'
        ],
        details: ['Landmarks', 'Celebrities']
      });

      // Legal context analysis
      const legalContext = this._analyzeLegalContext(analysis, caseType);

      return {
        success: true,
        evidence: {
          description: analysis.description.captions[0]?.text,
          confidence: analysis.description.captions[0]?.confidence,
          tags: analysis.tags.slice(0, 10).map(tag => tag.name),
          objects: analysis.objects?.map(obj => ({
            object: obj.object,
            confidence: obj.confidence,
            location: obj.rectangle
          })) || [],
          faces: analysis.faces?.map(face => ({
            age: face.age,
            gender: face.gender,
            location: face.faceRectangle
          })) || [],
          colors: {
            dominant: analysis.color?.dominantColorForeground,
            background: analysis.color?.dominantColorBackground,
            accent: analysis.color?.accentColor
          },
          contentFlags: {
            isAdultContent: analysis.adult?.isAdultContent || false,
            isRacyContent: analysis.adult?.isRacyContent || false,
            isGoryContent: analysis.adult?.isGoryContent || false
          },
          legalContext
        },
        caseType,
        imageUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Evidence photo analysis error:', error.message);
      return {
        success: false,
        error: error.message,
        fallback: this._getMockEvidenceAnalysis(imageUrl, caseType)
      };
    }
  }

  /**
   * Detect Handwriting & Signatures
   * Use case: Legal signatures, handwritten notes, wills
   */
  async detectHandwriting(imageUrl) {
    // Uses same OCR endpoint but with handwriting detection
    return await this.extractTextOCR(imageUrl, {
      language: 'tr',
      detectOrientation: true
    });
  }

  /**
   * Batch Process Legal Documents
   * Process multiple document images
   */
  async batchProcessDocuments(imageUrls, options = {}) {
    const results = [];

    for (const url of imageUrls) {
      const result = await this.extractTextOCR(url, options);
      results.push({
        url,
        result,
        processedAt: new Date().toISOString()
      });

      // Rate limiting: Wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: true,
      totalProcessed: results.length,
      results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Analyze legal context from image analysis
   */
  _analyzeLegalContext(analysis, caseType) {
    const context = {
      relevantObjects: [],
      potentialEvidence: [],
      warnings: [],
      notes: []
    };

    // Identify legally relevant objects
    const legallyRelevant = ['person', 'car', 'weapon', 'document', 'money', 'computer', 'phone'];
    context.relevantObjects = (analysis.objects || [])
      .filter(obj => legallyRelevant.some(item => obj.object.toLowerCase().includes(item)))
      .map(obj => obj.object);

    // Case-specific analysis
    switch (caseType) {
      case 'traffic_accident':
        context.notes.push('Trafik kazası analizi: Araç hasarları, konum belirleyiciler aranıyor');
        break;
      case 'property_dispute':
        context.notes.push('Mülk anlaşmazlığı: Sınır işaretleri, yapı özellikleri değerlendiriliyor');
        break;
      case 'criminal':
        context.notes.push('Ceza davası: Delil niteliği taşıyabilecek objeler tespit ediliyor');
        break;
      default:
        context.notes.push('Genel hukuki değerlendirme yapılıyor');
    }

    // Warnings for sensitive content
    if (analysis.adult?.isGoryContent) {
      context.warnings.push('⚠️  Rahatsız edici içerik tespit edildi');
    }

    return context;
  }

  /**
   * Mock document analysis
   */
  _getMockDocumentAnalysis(imageUrl) {
    return {
      success: true,
      analysis: {
        description: 'Yasal belge - sözleşme veya dilekçe içeriyor olabilir',
        confidence: 0.85,
        tags: [
          { name: 'text', confidence: 0.95 },
          { name: 'document', confidence: 0.90 },
          { name: 'paper', confidence: 0.88 },
          { name: 'legal', confidence: 0.75 }
        ],
        objects: [
          {
            type: 'document',
            confidence: 0.92,
            rectangle: { x: 10, y: 10, w: 800, h: 1100 }
          }
        ],
        text: ['legal', 'document', 'signature', 'date'],
        metadata: {
          width: 1200,
          height: 1600,
          format: 'Jpeg'
        }
      },
      imageUrl,
      timestamp: new Date().toISOString(),
      mode: 'DEMO - Requires Azure Computer Vision API key'
    };
  }

  /**
   * Mock OCR result
   */
  _getMockOCR(imageUrl) {
    return {
      success: true,
      pages: [
        {
          pageNumber: 1,
          angle: 0,
          width: 1200,
          height: 1600,
          unit: 'pixel',
          lines: [
            {
              text: 'TÜRKİYE CUMHURİYETİ',
              boundingBox: [100, 50, 500, 50, 500, 80, 100, 80],
              words: [
                { text: 'TÜRKİYE', confidence: 0.98, boundingBox: [100, 50, 250, 50, 250, 80, 100, 80] },
                { text: 'CUMHURİYETİ', confidence: 0.97, boundingBox: [260, 50, 500, 50, 500, 80, 260, 80] }
              ]
            },
            {
              text: 'ANKARA 12. AİLE MAHKEMESİ',
              boundingBox: [100, 100, 600, 100, 600, 130, 100, 130],
              words: [
                { text: 'ANKARA', confidence: 0.99, boundingBox: [100, 100, 200, 100, 200, 130, 100, 130] },
                { text: '12.', confidence: 0.95, boundingBox: [210, 100, 250, 100, 250, 130, 210, 130] },
                { text: 'AİLE', confidence: 0.98, boundingBox: [260, 100, 340, 100, 340, 130, 260, 130] },
                { text: 'MAHKEMESİ', confidence: 0.97, boundingBox: [350, 100, 600, 100, 600, 130, 350, 130] }
              ]
            },
            {
              text: 'ESAS NO: 2024/1234',
              boundingBox: [100, 150, 400, 150, 400, 180, 100, 180],
              words: [
                { text: 'ESAS', confidence: 0.99, boundingBox: [100, 150, 180, 150, 180, 180, 100, 180] },
                { text: 'NO:', confidence: 0.98, boundingBox: [190, 150, 240, 150, 240, 180, 190, 180] },
                { text: '2024/1234', confidence: 0.99, boundingBox: [250, 150, 400, 150, 400, 180, 250, 180] }
              ]
            }
          ]
        }
      ],
      fullText: `TÜRKİYE CUMHURİYETİ
ANKARA 12. AİLE MAHKEMESİ
ESAS NO: 2024/1234

[Demo OCR - Gerçek Azure Computer Vision için API anahtarı gerekli]`,
      totalPages: 1,
      language: 'tr',
      timestamp: new Date().toISOString(),
      mode: 'DEMO'
    };
  }

  /**
   * Mock evidence analysis
   */
  _getMockEvidenceAnalysis(imageUrl, caseType) {
    return {
      success: true,
      evidence: {
        description: 'Delil fotoğrafı - yasal süreçte kullanılabilir',
        confidence: 0.82,
        tags: ['evidence', 'photo', 'legal', 'document', 'scene'],
        objects: [
          { object: 'document', confidence: 0.88, location: { x: 50, y: 50, w: 300, h: 200 } },
          { object: 'person', confidence: 0.75, location: { x: 400, y: 100, w: 150, h: 300 } }
        ],
        faces: [
          { age: 35, gender: 'Male', location: { left: 420, top: 120, width: 80, height: 100 } }
        ],
        colors: {
          dominant: 'Black',
          background: 'White',
          accent: 'Red'
        },
        contentFlags: {
          isAdultContent: false,
          isRacyContent: false,
          isGoryContent: false
        },
        legalContext: {
          relevantObjects: ['document', 'person'],
          potentialEvidence: ['Fotoğraftaki belge delil olabilir', 'Kimlik tespiti yapılabilir'],
          warnings: [],
          notes: [`${caseType} için görsel analiz tamamlandı`]
        }
      },
      caseType,
      imageUrl,
      timestamp: new Date().toISOString(),
      mode: 'DEMO - Requires Azure Computer Vision API key'
    };
  }
}

// Export singleton instance
const azureVisionService = new AzureVisionService();
module.exports = azureVisionService;
