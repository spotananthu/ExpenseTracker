const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Generate unique idempotency key
export const generateIdempotencyKey = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Create expense
export const createExpense = async (expense, idempotencyKey) => {
  const response = await fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(expense),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create expense');
  }

  return response.json();
};

// Get expenses with optional filters
export const getExpenses = async (category = '', sort = 'date_desc') => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (sort) params.append('sort', sort);

  const url = `${API_URL}/expenses${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch expenses');
  }

  return response.json();
};

// Get categories
export const getCategories = async () => {
  const response = await fetch(`${API_URL}/categories`);

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
};
