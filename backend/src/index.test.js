const request = require('supertest');
const app = require('./index');

describe('Expense API', () => {
  
  // Health check test
  describe('GET /health', () => {
    it('should return status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  // Validation tests
  describe('POST /expenses - Validation', () => {
    it('should reject missing amount', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({ category: 'Food', date: '2026-04-20' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Amount is required');
    });

    it('should reject missing category', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({ amount: 100, date: '2026-04-20' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Category is required');
    });

    it('should reject empty category', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({ amount: 100, category: '   ', date: '2026-04-20' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Category is required');
    });

    it('should reject missing date', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({ amount: 100, category: 'Food' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Date is required');
    });

    it('should reject future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const dateStr = futureDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/expenses')
        .send({ amount: 100, category: 'Food', date: dateStr });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Date cannot be in the future');
    });

    it('should reject negative amount', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({ amount: -50, category: 'Food', date: '2026-04-20' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Amount must be a non-negative number');
    });
  });

  // Integration test - Create expense successfully
  describe('POST /expenses - Success', () => {
    it('should create expense with valid data', async () => {
      const idempotencyKey = `test-${Date.now()}-${Math.random()}`;
      
      const res = await request(app)
        .post('/expenses')
        .set('X-Idempotency-Key', idempotencyKey)
        .send({
          amount: 150.50,
          category: 'Food',
          description: 'Test lunch',
          date: '2026-04-20'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.amount).toBe(150.50);
      expect(res.body.category).toBe('Food');
      expect(res.body.description).toBe('Test lunch');
      expect(res.body.id).toBeDefined();
    });

    it('should return same expense for duplicate idempotency key', async () => {
      const idempotencyKey = `test-idem-${Date.now()}`;
      
      // First request
      const res1 = await request(app)
        .post('/expenses')
        .set('X-Idempotency-Key', idempotencyKey)
        .send({
          amount: 250,
          category: 'Transport',
          description: 'Idempotency test',
          date: '2026-04-20'
        });
      
      expect(res1.statusCode).toBe(201);
      
      // Duplicate request with same key
      const res2 = await request(app)
        .post('/expenses')
        .set('X-Idempotency-Key', idempotencyKey)
        .send({
          amount: 250,
          category: 'Transport',
          description: 'Idempotency test',
          date: '2026-04-20'
        });
      
      expect(res2.statusCode).toBe(200);
      expect(res2.body.duplicate).toBe(true);
      expect(res2.body.id).toBe(res1.body.id);
    });
  });

  // GET expenses
  describe('GET /expenses', () => {
    it('should return list of expenses', async () => {
      const res = await request(app).get('/expenses');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by category', async () => {
      const res = await request(app).get('/expenses?category=Food');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(expense => {
        expect(expense.category).toBe('Food');
      });
    });
  });

  // GET categories
  describe('GET /categories', () => {
    it('should return list of categories', async () => {
      const res = await request(app).get('/categories');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
