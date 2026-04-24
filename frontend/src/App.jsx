import { useState, useEffect, useCallback } from 'react';
import { createExpense, getExpenses, getCategories, generateIdempotencyKey } from './api';

// Predefined categories for convenience
const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other'];

function App() {
  // State
  const [expenses, setExpenses] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]); // For summary (unfiltered)
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey());

  // Fetch expenses
  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExpenses(selectedCategory);
      setExpenses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  // Sort expenses based on sortOrder
  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder === 'date_desc' ? dateB - dateA : dateA - dateB;
  });

  // Fetch all expenses (for summary - unaffected by filters)
  const fetchAllExpenses = async () => {
    try {
      const data = await getExpenses('');
      setAllExpenses(data);
    } catch (err) {
      console.error('Failed to fetch all expenses:', err);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchExpenses();
    fetchAllExpenses();
    fetchCategories();
  }, [fetchExpenses]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setSubmitError('Please enter a valid amount greater than 0');
      return;
    }
    if (!formData.category.trim()) {
      setSubmitError('Please select or enter a category');
      return;
    }
    if (!formData.date) {
      setSubmitError('Please select a date');
      return;
    }

    try {
      setSubmitting(true);
      await createExpense(
        {
          amount: parseFloat(formData.amount),
          category: formData.category.trim(),
          description: formData.description.trim(),
          date: formData.date,
        },
        idempotencyKey
      );

      // Success - reset form and refresh
      setFormData({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setIdempotencyKey(generateIdempotencyKey()); // New key for next submission
      setSubmitSuccess(true);
      fetchExpenses();
      fetchAllExpenses();
      fetchCategories();

      // Clear success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total (from ALL expenses, not filtered)
  const total = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Calculate totals per category (from ALL expenses)
  const categoryTotals = allExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // All available categories (merged default + fetched)
  const allCategories = [...new Set([...DEFAULT_CATEGORIES, ...categories])].sort();

  return (
    <div className="container">
      <header>
        <h1>Expense Tracker</h1>
        <p className="subtitle">Track and manage your personal expenses</p>
      </header>

      {/* Add Expense Form */}
      <section className="card">
        <h2>Add Expense</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount (₹) *</label>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                disabled={submitting}
              >
                <option value="">Select category</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                required
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional note"
                disabled={submitting}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add Expense'}
          </button>
          {submitError && <p className="error-message">{submitError}</p>}
          {submitSuccess && <p className="success-message">Expense added successfully!</p>}
        </form>
      </section>

      {/* Filter & Summary */}
      <section className="card">
        <div className="filter-row">
          <div className="form-group">
            <label htmlFor="filter-category">Filter by Category</label>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="sort-order">Sort by Date</label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
            </select>
          </div>
          <div className="total-display">
            <span className="total-label">Total:</span>
            <span className="total-amount">{formatCurrency(total)}</span>
          </div>
        </div>
      </section>

      {/* Main Content: Expenses + Summary */}
      <div className="main-content">
        {/* Expenses List */}
        <section className="card expenses-panel">
          <h2>Expenses {selectedCategory && `- ${selectedCategory}`}</h2>
          
          {loading ? (
            <div className="loading">Loading expenses...</div>
          ) : error ? (
            <div className="error-message">
              {error}
              <button onClick={fetchExpenses} className="btn-retry">
                Retry
              </button>
            </div>
          ) : expenses.length === 0 ? (
            <p className="empty-state">No expenses found. Add your first expense above!</p>
          ) : (
            <div className="expenses-table-container">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{formatDate(expense.date)}</td>
                      <td>
                        <span className={`category-badge ${expense.category.toLowerCase()}`}>{expense.category}</span>
                      </td>
                      <td>{expense.description || '-'}</td>
                      <td className="text-right amount">{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Category Summary - Right Panel */}
        {Object.keys(categoryTotals).length > 0 && (
          <aside className="card summary-panel">
            <h2>Summary</h2>
            
            {/* Donut Chart */}
            <div className="chart-container">
              <svg viewBox="0 0 100 100" className="donut-chart">
                {(() => {
                  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
                  const colors = {
                    food: '#78716c', transport: '#52525b', shopping: '#a855f7',
                    entertainment: '#8b5cf6', bills: '#ef4444', health: '#22c55e', other: '#6b7280'
                  };
                  const radius = 40;
                  const circumference = 2 * Math.PI * radius; // ~251.33
                  let rotation = -90; // Start from top (12 o'clock)
                  
                  return sortedCategories.map(([category, amount]) => {
                    const percent = (amount / total) * 100;
                    const arcLength = (percent / 100) * circumference;
                    const currentRotation = rotation;
                    rotation += (percent / 100) * 360; // Move to next position
                    
                    return (
                      <circle
                        key={category}
                        cx="50" cy="50" r={radius}
                        fill="none"
                        stroke={colors[category.toLowerCase()] || '#6b7280'}
                        strokeWidth="12"
                        strokeDasharray={`${arcLength} ${circumference}`}
                        transform={`rotate(${currentRotation} 50 50)`}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="chart-center">
                <span className="chart-total">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="summary-divider"></div>
            <h3 className="summary-subtitle">By Category</h3>
            <div className="category-summary">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => (
                  <div key={category} className="summary-row">
                    <div className="summary-category">
                      <span className={`category-badge ${category.toLowerCase()}`}>{category}</span>
                      <span className="summary-percentage">
                        {((amount / total) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <span className="summary-amount">{formatCurrency(amount)}</span>
                  </div>
                ))}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export default App;
