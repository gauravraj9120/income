const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'finance.db');

async function getDb() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  return db;
}

const DEFAULT_CATEGORIES = [
  { name: 'Membership', type: 'income' },
  { name: 'Personal Training', type: 'income' },
  { name: 'Guest Pass', type: 'income' },
  { name: 'Cafe/Merchandise', type: 'income' },
  { name: 'Other', type: 'income' },
  
  { name: 'Rent', type: 'expense' },
  { name: 'Salaries', type: 'expense' },
  { name: 'Equipment Maintenance', type: 'expense' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Marketing', type: 'expense' },
  { name: 'Cleaning Supplies', type: 'expense' },
  { name: 'Other', type: 'expense' }
];

const getPastDateStr = (daysAgo) => {
  const today = new Date();
  const d = new Date(today);
  d.setDate(today.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const DEFAULT_TRANSACTIONS = [
  {
    id: 'tx-1',
    amount: 1500,
    type: 'income',
    category: 'Membership',
    date: getPastDateStr(4),
    paymentMethod: 'UPI',
    memberName: 'Gaurav Rajput',
    payee: null,
    addedBy: 'receptionist',
    notes: 'Premium Annual Gold Membership enrollment',
    timestamp: new Date(getPastDateStr(4) + 'T10:00:00Z').toISOString(),
  },
  {
    id: 'tx-2',
    amount: 850,
    type: 'expense',
    category: 'Rent',
    date: getPastDateStr(4),
    paymentMethod: 'Bank Transfer',
    memberName: null,
    payee: 'Prime Heights Realty',
    addedBy: 'admin',
    notes: 'Monthly gym floor rent payment',
    timestamp: new Date(getPastDateStr(4) + 'T12:30:00Z').toISOString(),
  },
  {
    id: 'tx-3',
    amount: 120,
    type: 'income',
    category: 'Personal Training',
    date: getPastDateStr(3),
    paymentMethod: 'UPI',
    memberName: 'Rohan Sharma',
    payee: null,
    addedBy: 'receptionist',
    notes: '3x personal training session package',
    timestamp: new Date(getPastDateStr(3) + 'T14:15:00Z').toISOString(),
  },
  {
    id: 'tx-4',
    amount: 230,
    type: 'expense',
    category: 'Equipment Maintenance',
    date: getPastDateStr(2),
    paymentMethod: 'Card',
    memberName: null,
    payee: 'Fitsmith Gym Servicing',
    addedBy: 'admin',
    notes: 'Treadmill deck replacement & cable lubrication',
    timestamp: new Date(getPastDateStr(2) + 'T11:00:00Z').toISOString(),
  },
  {
    id: 'tx-5',
    amount: 75,
    type: 'income',
    category: 'Cafe/Merchandise',
    date: getPastDateStr(1),
    paymentMethod: 'Cash',
    memberName: 'Nikhil Verma',
    payee: null,
    addedBy: 'receptionist',
    notes: 'Whey Protein Tub (2lbs) & shaker bottle',
    timestamp: new Date(getPastDateStr(1) + 'T18:00:00Z').toISOString(),
  },
  {
    id: 'tx-6',
    amount: 400,
    type: 'expense',
    category: 'Salaries',
    date: getPastDateStr(1),
    paymentMethod: 'Bank Transfer',
    memberName: null,
    payee: 'Trainer Amit (PT commission)',
    addedBy: 'owner',
    notes: 'PT commission payouts for May',
    timestamp: new Date(getPastDateStr(1) + 'T20:10:00Z').toISOString(),
  },
  {
    id: 'tx-7',
    amount: 10,
    type: 'income',
    category: 'Guest Pass',
    date: getPastDateStr(0),
    paymentMethod: 'Cash',
    memberName: 'Walk-in Guest',
    payee: null,
    addedBy: 'receptionist',
    notes: 'Daily trial pass',
    timestamp: new Date().toISOString(),
  }
];

const DEFAULT_AUDIT_LOGS = [
  { id: 'log-1', action: 'System Database seeded with defaults', role: 'admin', timestamp: '2026-06-13 10:00' },
  { id: 'log-2', action: 'Created membership revenue of $1500', role: 'receptionist', timestamp: '2026-06-13 10:30' },
  { id: 'log-3', action: 'Approved monthly lease rent payment of $850', role: 'admin', timestamp: '2026-06-13 12:35' },
];

async function initDb() {
  const db = await getDb();
  
  // 1. Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      paymentMethod TEXT NOT NULL,
      notes TEXT,
      memberName TEXT,
      payee TEXT,
      addedBy TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      UNIQUE(name, type)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      role TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);

  // 2. Seed Default Categories if empty
  const catCount = await db.get('SELECT COUNT(*) as count FROM categories');
  if (catCount.count === 0) {
    console.log('Seeding default categories...');
    const stmt = await db.prepare('INSERT INTO categories (name, type) VALUES (?, ?)');
    for (const cat of DEFAULT_CATEGORIES) {
      await stmt.run(cat.name, cat.type);
    }
    await stmt.finalize();
  }

  // 3. Seed Default Transactions if empty
  const txCount = await db.get('SELECT COUNT(*) as count FROM transactions');
  if (txCount.count === 0) {
    console.log('Seeding default transactions...');
    const stmt = await db.prepare(`
      INSERT INTO transactions (id, amount, type, category, date, paymentMethod, notes, memberName, payee, addedBy, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const tx of DEFAULT_TRANSACTIONS) {
      await stmt.run(
        tx.id,
        tx.amount,
        tx.type,
        tx.category,
        tx.date,
        tx.paymentMethod,
        tx.notes,
        tx.memberName,
        tx.payee,
        tx.addedBy,
        tx.timestamp
      );
    }
    await stmt.finalize();
  }

  // 4. Seed Default Audit Logs if empty
  const logCount = await db.get('SELECT COUNT(*) as count FROM audit_logs');
  if (logCount.count === 0) {
    console.log('Seeding default audit logs...');
    const stmt = await db.prepare('INSERT INTO audit_logs (id, action, role, timestamp) VALUES (?, ?, ?, ?)');
    for (const log of DEFAULT_AUDIT_LOGS) {
      await stmt.run(log.id, log.action, log.role, log.timestamp);
    }
    await stmt.finalize();
  }

  console.log('Database initialized successfully.');
  return db;
}

module.exports = {
  getDb,
  initDb
};
