import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateIdempotencyKey, createExpense, getExpenses } from '../api';

describe('API Utilities', () => {
  
  describe('generateIdempotencyKey', () => {
    it('should generate a unique string', () => {
      const key = generateIdempotencyKey();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(10);
    });

    it('should generate different keys on each call', () => {
      const key1 = generateIdempotencyKey();
      const key2 = generateIdempotencyKey();
      expect(key1).not.toBe(key2);
    });

    it('should contain timestamp component', () => {
      const before = Date.now();
      const key = generateIdempotencyKey();
      const after = Date.now();
      
      // Key starts with timestamp
      const timestamp = parseInt(key.split('-')[0], 10);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('createExpense', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('should call fetch with correct parameters', async () => {
      const mockExpense = {
        amount: 100,
        category: 'Food',
        description: 'Lunch',
        date: '2026-04-20'
      };
      const mockKey = 'test-key-123';
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: '1', ...mockExpense }),
        })
      );

      await createExpense(mockExpense, mockKey);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/expenses'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': mockKey,
          },
          body: JSON.stringify(mockExpense),
        })
      );
    });

    it('should throw error on failed request', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Validation failed' }),
        })
      );

      await expect(createExpense({}, 'key')).rejects.toThrow('Validation failed');
    });
  });

  describe('getExpenses', () => {
    beforeEach(() => {
      vi.resetAllMocks();
    });

    it('should fetch all expenses without filter', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

      await getExpenses();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/expenses')
      );
    });

    it('should include category filter in request', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      );

      await getExpenses('Food');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=Food')
      );
    });
  });
});
