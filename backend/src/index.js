const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const supabase = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// POST /expenses - Create a new expense
app.post('/expenses', async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;
    const idempotencyKey = req.headers['x-idempotency-key'];

    // Validation
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    if (!category || category.trim() === '') {
      return res.status(400).json({ error: 'Category is required' });
    }
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      return res.status(400).json({ error: 'Amount must be a non-negative number' });
    }

    // Convert to paise (integer) to avoid floating point issues
    const amountInPaise = Math.round(numericAmount * 100);

    // Handle idempotency - if same key was used before, return existing expense
    if (idempotencyKey) {
      const { data: existingKey } = await supabase
        .from('idempotency_keys')
        .select('expense_id')
        .eq('key', idempotencyKey)
        .single();

      if (existingKey) {
        const { data: existingExpense } = await supabase
          .from('expenses')
          .select('*')
          .eq('id', existingKey.expense_id)
          .single();

        if (existingExpense) {
          return res.status(200).json({
            ...existingExpense,
            amount: existingExpense.amount / 100,
            duplicate: true
          });
        }
      }
    }

    // Create new expense
    const id = uuidv4();
    const { data: newExpense, error: insertError } = await supabase
      .from('expenses')
      .insert({
        id,
        amount: amountInPaise,
        category: category.trim(),
        description: description?.trim() || '',
        date
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to create expense' });
    }

    // Store idempotency key
    if (idempotencyKey) {
      await supabase
        .from('idempotency_keys')
        .insert({ key: idempotencyKey, expense_id: id });
    }

    res.status(201).json({
      ...newExpense,
      amount: newExpense.amount / 100
    });

  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// GET /expenses - List expenses with optional filters
app.get('/expenses', async (req, res) => {
  try {
    const { category, sort } = req.query;

    let query = supabase.from('expenses').select('*');

    // Filter by category
    if (category && category.trim() !== '') {
      query = query.eq('category', category.trim());
    }

    // Sort by date (newest first is default)
    query = query.order('date', { ascending: false }).order('created_at', { ascending: false });

    const { data: expenses, error } = await query;

    if (error) {
      console.error('Fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch expenses' });
    }

    // Convert amounts back to rupees
    const result = expenses.map(exp => ({
      ...exp,
      amount: exp.amount / 100
    }));

    res.json(result);

  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /categories - Get unique categories
app.get('/categories', async (req, res) => {
  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('category');

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    const categories = [...new Set(expenses.map(e => e.category))].sort();
    res.json(categories);

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
