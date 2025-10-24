/**
 * 🗄️ NEO4J KNOWLEDGE GRAPH SERVICE
 * =================================
 * LyDian Hukuk AI - Legal Knowledge Graph
 *
 * Features:
 * - Legal article relationships
 * - Case precedent mapping
 * - Semantic search
 * - Multi-Graph RAG
 */

require('dotenv').config();
const neo4j = require('neo4j-driver');

class Neo4jKnowledgeGraph {
  constructor() {
    const neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const neo4jUser = process.env.NEO4J_USERNAME || 'neo4j';
    const neo4jPass = process.env.NEO4J_PASSWORD || 'password';
    this.driver = neo4j.driver(
      neo4jUri,
      neo4j.auth.basic(neo4jUser, neo4jPass)
    );
  }

  /**
   * 🔍 Emsal dava ara (Knowledge Graph Search)
   */
  async searchPrecedents(lawArticle) {
    const session = this.driver.session();

    try {
      const result = await session.run(`
        MATCH (m:HukukMaddesi {kod: $kod})-[:EMSAL_KARAR]->(d:EmsalDava)
        RETURN d.karar_no AS karar_no, d.mahkeme AS mahkeme,
               d.tarih AS tarih, d.sonuc AS sonuc, d.ozet AS ozet
        ORDER BY d.tarih DESC
        LIMIT 10
      `, { kod: lawArticle });

      return result.records.map(record => ({
        karar_no: record.get('karar_no'),
        mahkeme: record.get('mahkeme'),
        tarih: record.get('tarih'),
        sonuc: record.get('sonuc'),
        ozet: record.get('ozet')
      }));

    } finally {
      await session.close();
    }
  }

  /**
   * 📊 İlişkili hukuk maddeleri bul
   */
  async findRelatedArticles(lawArticle) {
    const session = this.driver.session();

    try {
      const result = await session.run(`
        MATCH (m1:HukukMaddesi {kod: $kod})-[:ILISKILI_MADDE]-(m2:HukukMaddesi)
        RETURN m2.kod AS kod, m2.baslik AS baslik, m2.kategori AS kategori
        LIMIT 5
      `, { kod: lawArticle });

      return result.records.map(record => ({
        kod: record.get('kod'),
        baslik: record.get('baslik'),
        kategori: record.get('kategori')
      }));

    } finally {
      await session.close();
    }
  }

  /**
   * 💾 Hukuk maddesi ekle/güncelle
   */
  async upsertLawArticle(data) {
    const session = this.driver.session();

    try {
      const result = await session.run(`
        MERGE (m:HukukMaddesi {kod: $kod})
        SET m.baslik = $baslik,
            m.kategori = $kategori,
            m.icerik = $icerik,
            m.ceza = $ceza,
            m.updated_at = datetime()
        RETURN m
      `, data);

      return result.records[0].get('m').properties;

    } finally {
      await session.close();
    }
  }

  /**
   * ⚖️ Emsal dava ekle
   */
  async addPrecedent(lawArticle, precedentData) {
    const session = this.driver.session();

    try {
      const result = await session.run(`
        MATCH (m:HukukMaddesi {kod: $kod})
        CREATE (d:EmsalDava {
          karar_no: $karar_no,
          mahkeme: $mahkeme,
          tarih: date($tarih),
          sonuc: $sonuc,
          ozet: $ozet,
          created_at: datetime()
        })
        CREATE (m)-[:EMSAL_KARAR]->(d)
        RETURN d
      `, { kod: lawArticle, ...precedentData });

      return result.records[0].get('d').properties;

    } finally {
      await session.close();
    }
  }

  /**
   * 🔗 Madde ilişkisi kur
   */
  async linkArticles(article1, article2, relationType = 'ILISKILI_MADDE') {
    const session = this.driver.session();

    try {
      await session.run(`
        MATCH (m1:HukukMaddesi {kod: $kod1})
        MATCH (m2:HukukMaddesi {kod: $kod2})
        MERGE (m1)-[:${relationType}]->(m2)
      `, { kod1: article1, kod2: article2 });

      return { success: true };

    } finally {
      await session.close();
    }
  }

  /**
   * 🧠 RAG için context oluştur
   */
  async buildRAGContext(userQuery) {
    const session = this.driver.session();

    try {
      // Sorguya en yakın hukuk maddelerini bul
      const result = await session.run(`
        MATCH (m:HukukMaddesi)
        WHERE m.baslik CONTAINS $query OR m.icerik CONTAINS $query
        OPTIONAL MATCH (m)-[:EMSAL_KARAR]->(d:EmsalDava)
        RETURN m, collect(d) AS emsaller
        LIMIT 3
      `, { query: userQuery });

      const context = result.records.map(record => {
        const madde = record.get('m').properties;
        const emsaller = record.get('emsaller').map(e => e?.properties).filter(Boolean);

        return {
          madde,
          emsal_sayisi: emsaller.length,
          emsaller: emsaller.slice(0, 2) // İlk 2 emsal
        };
      });

      return context;

    } finally {
      await session.close();
    }
  }

  /**
   * 🌐 Graph istatistikleri
   */
  async getStats() {
    const session = this.driver.session();

    try {
      const result = await session.run(`
        MATCH (n)
        WITH labels(n)[0] AS tip, count(*) AS adet
        RETURN tip, adet
        ORDER BY adet DESC
      `);

      return result.records.map(record => ({
        tip: record.get('tip'),
        adet: record.get('adet').toNumber()
      }));

    } finally {
      await session.close();
    }
  }

  /**
   * 🔌 Bağlantıyı kapat
   */
  async close() {
    await this.driver.close();
  }
}

module.exports = new Neo4jKnowledgeGraph();
