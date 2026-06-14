const express = require('express');
const cors = require('cors');
const { initDb, getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize database and start server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// --- API ROUTES ---

// 1. Transactions API

// Get all transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const db = await getDb();
    const transactions = await db.all('SELECT * FROM transactions ORDER BY date DESC, timestamp DESC');
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

// Add a transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const db = await getDb();
    const { id, amount, type, category, date, paymentMethod, notes, memberName, payee, addedBy, timestamp } = req.body;
    
    if (!id || !amount || !type || !category || !date || !paymentMethod || !addedBy) {
      return res.status(400).json({ error: 'Missing required transaction fields' });
    }

    await db.run(
      `INSERT INTO transactions (id, amount, type, category, date, paymentMethod, notes, memberName, payee, addedBy, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, amount, type, category, date, paymentMethod, notes, memberName, payee, addedBy, timestamp]
    );

    const newTx = await db.get('SELECT * FROM transactions WHERE id = ?', id);
    res.status(201).json(newTx);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// Edit a transaction
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { amount, type, category, date, paymentMethod, notes, memberName, payee } = req.body;

    if (!amount || !type || !category || !date || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required update fields' });
    }

    const txExists = await db.get('SELECT * FROM transactions WHERE id = ?', id);
    if (!txExists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await db.run(
      `UPDATE transactions 
       SET amount = ?, type = ?, category = ?, date = ?, paymentMethod = ?, notes = ?, memberName = ?, payee = ?
       WHERE id = ?`,
      [amount, type, category, date, paymentMethod, notes, memberName, payee, id]
    );

    const updatedTx = await db.get('SELECT * FROM transactions WHERE id = ?', id);
    res.json(updatedTx);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Delete a transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const txExists = await db.get('SELECT * FROM transactions WHERE id = ?', id);
    if (!txExists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await db.run('DELETE FROM transactions WHERE id = ?', id);
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});


// 2. Categories API

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const db = await getDb();
    const categoriesList = await db.all('SELECT * FROM categories');
    
    // Group categories by type
    const categories = {
      income: categoriesList.filter((c) => c.type === 'income').map((c) => c.name),
      expense: categoriesList.filter((c) => c.type === 'expense').map((c) => c.name),
    };
    
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// Add a category
app.post('/api/categories', async (req, res) => {
  try {
    const db = await getDb();
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Missing name or type' });
    }

    // Check if category already exists
    const exists = await db.get('SELECT * FROM categories WHERE name = ? AND type = ?', [name, type]);
    if (exists) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    await db.run('INSERT INTO categories (name, type) VALUES (?, ?)', [name, type]);
    res.status(201).json({ success: true, name, type });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add category' });
  }
});

// Delete a category
app.delete('/api/categories/:type/:name', async (req, res) => {
  try {
    const db = await getDb();
    const { type, name } = req.params;

    if (!type || !name) {
      return res.status(400).json({ error: 'Missing type or name parameters' });
    }

    const exists = await db.get('SELECT * FROM categories WHERE name = ? AND type = ?', [name, type]);
    if (!exists) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await db.run('DELETE FROM categories WHERE name = ? AND type = ?', [name, type]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});


// 3. Audit Logs API

// Get all audit logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const db = await getDb();
    const logs = await db.all('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50');
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

// Add an audit log
app.post('/api/audit-logs', async (req, res) => {
  try {
    const db = await getDb();
    const { id, action, role, timestamp } = req.body;

    if (!id || !action || !role || !timestamp) {
      return res.status(400).json({ error: 'Missing log fields' });
    }

    await db.run(
      'INSERT INTO audit_logs (id, action, role, timestamp) VALUES (?, ?, ?, ?)',
      [id, action, role, timestamp]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add audit log' });
  }
});
