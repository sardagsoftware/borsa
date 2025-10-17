// LCI API - E2E Tests: Complaints
// White-hat: Comprehensive complaint workflow testing

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Complaints E2E', () => {
  let app: INestApplication;
  let userToken: string;
  let userId: string;
  let brandId: string;
  let complaintId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Register and login user
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'complainant@example.com',
        password: 'Test1234!',
        locale: 'tr',
      });

    userToken = registerRes.body.token;
    userId = registerRes.body.user.id;

    // Get first brand from seed data
    // Note: This assumes seed data has been loaded
    brandId = 'seed-brand-id'; // Replace with actual seed brand ID
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /complaints', () => {
    it('should create a complaint in DRAFT state', () => {
      return request(app.getHttpServer())
        .post('/complaints')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId,
          title: 'Ürün hasarlı geldi',
          body: 'Sipariş ettiğim ürün hasarlı olarak teslim edildi. Kargo görevlisi dikkatli olmamış.',
          severity: 'MEDIUM',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.state).toBe('DRAFT');
          expect(res.body.title).toBe('Ürün hasarlı geldi');
          expect(res.body.severity).toBe('MEDIUM');
          expect(res.body.userId).toBe(userId);
          complaintId = res.body.id;
        });
    });

    it('should reject complaint without authentication', () => {
      return request(app.getHttpServer())
        .post('/complaints')
        .send({
          brandId,
          title: 'Test complaint',
          body: 'Test body',
          severity: 'LOW',
        })
        .expect(401);
    });

    it('should reject complaint with invalid brand', () => {
      return request(app.getHttpServer())
        .post('/complaints')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId: 'invalid-brand-id',
          title: 'Test complaint',
          body: 'Test body',
          severity: 'LOW',
        })
        .expect(404);
    });

    it('should reject complaint with short title', () => {
      return request(app.getHttpServer())
        .post('/complaints')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId,
          title: 'Short',
          body: 'This is a test complaint body with sufficient length.',
          severity: 'LOW',
        })
        .expect(400);
    });
  });

  describe('GET /complaints/:id', () => {
    it('should get complaint by ID', () => {
      return request(app.getHttpServer())
        .get(`/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(complaintId);
          expect(res.body.title).toBe('Ürün hasarlı geldi');
        });
    });

    it('should reject access to non-existent complaint', () => {
      return request(app.getHttpServer())
        .get('/complaints/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('PATCH /complaints/:id', () => {
    it('should update complaint in DRAFT state', () => {
      return request(app.getHttpServer())
        .patch(`/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Ürün hasarlı geldi - güncellendi',
          body: 'Güncelleme: Ürün tamamen kullanılamaz durumda.',
          severity: 'HIGH',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Ürün hasarlı geldi - güncellendi');
          expect(res.body.severity).toBe('HIGH');
        });
    });

    it('should reject update by non-owner', async () => {
      // Create another user
      const otherUserRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other@example.com',
          password: 'Test1234!',
          locale: 'tr',
        });

      return request(app.getHttpServer())
        .patch(`/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${otherUserRes.body.token}`)
        .send({
          title: 'Hacked title',
        })
        .expect(403);
    });
  });

  describe('POST /complaints/:id/transition', () => {
    it('should transition DRAFT to OPEN (publish)', () => {
      return request(app.getHttpServer())
        .post(`/complaints/${complaintId}/transition`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          newState: 'OPEN',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.state).toBe('OPEN');
          expect(res.body.publishedAt).not.toBeNull();
        });
    });

    it('should reject invalid state transition', () => {
      return request(app.getHttpServer())
        .post(`/complaints/${complaintId}/transition`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          newState: 'RESOLVED', // Cannot go directly from OPEN to RESOLVED
        })
        .expect(400);
    });

    it('should allow MODERATOR to escalate complaint', async () => {
      // Login as moderator (from seed data)
      const modRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'moderator@lci.lydian.ai',
          password: 'Demo1234!',
        });

      return request(app.getHttpServer())
        .post(`/complaints/${complaintId}/transition`)
        .set('Authorization', `Bearer ${modRes.body.token}`)
        .send({
          newState: 'ESCALATED',
          reason: 'Requires urgent attention',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.state).toBe('ESCALATED');
        });
    });
  });

  describe('GET /complaints', () => {
    it('should list user complaints', () => {
      return request(app.getHttpServer())
        .get('/complaints')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('title');
        });
    });

    it('should filter complaints by state', () => {
      return request(app.getHttpServer())
        .get('/complaints?state=ESCALATED')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0].state).toBe('ESCALATED');
          }
        });
    });
  });

  describe('DELETE /complaints/:id', () => {
    it('should delete complaint in DRAFT state', async () => {
      // Create a new draft complaint
      const draftRes = await request(app.getHttpServer())
        .post('/complaints')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId,
          title: 'Complaint to be deleted',
          body: 'This complaint will be deleted as a test.',
          severity: 'LOW',
        });

      const draftId = draftRes.body.id;

      return request(app.getHttpServer())
        .delete(`/complaints/${draftId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });

    it('should reject deletion of published complaint', () => {
      return request(app.getHttpServer())
        .delete(`/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400); // Cannot delete published complaints
    });
  });

  describe('PII Moderation', () => {
    it('should automatically mask Turkish ID in complaint body', async () => {
      const res = await request(app.getHttpServer())
        .post('/complaints')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId,
          title: 'TC kimlik numarası ifşa edildi',
          body: 'Müşteri hizmetleri TC kimlik numaram 12345678901 olan kişiye bilgi vermiş. Bu ciddi bir güvenlik ihlalidir.',
          severity: 'CRITICAL',
        });

      expect(res.body.body).not.toContain('12345678901');
      expect(res.body.body).toContain('TC****');
    });

    it('should automatically mask email in complaint body', async () => {
      const res = await request(app.getHttpServer())
        .post('/complaints')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId,
          title: 'Email adresi sızdırıldı',
          body: 'Şirket my.private.email@example.com adresime reklam gönderiyor. İzin vermedim.',
          severity: 'MEDIUM',
        });

      expect(res.body.body).not.toContain('my.private.email@example.com');
      expect(res.body.body).toContain('[EMAIL_MASKED]');
    });

    it('should automatically mask phone number in complaint body', async () => {
      const res = await request(app.getHttpServer())
        .post('/complaints')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          brandId,
          title: 'Telefon numarası paylaşıldı',
          body: 'Müşteri hizmetleri telefon numaram 0532 123 45 67 olan kişiye bilgi verdi.',
          severity: 'HIGH',
        });

      expect(res.body.body).not.toContain('0532 123 45 67');
      expect(res.body.body).toContain('[PHONE_MASKED]');
    });
  });
});
