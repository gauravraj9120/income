import { useState, useEffect } from 'react';
import { Shield, Users, Trophy, Dumbbell } from 'lucide-react';
import type { Transaction, UserRole } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { QuickAdd } from './components/QuickAdd';

// Default categories
const DEFAULT_CATEGORIES = {
  income: ['Membership', 'Personal Training', 'Guest Pass', 'Cafe/Merchandise', 'Other'],
  expense: ['Rent', 'Salaries', 'Equipment Maintenance', 'Utilities', 'Marketing', 'Cleaning Supplies', 'Other'],
};

// Seed realistic transactions
const getInitialTransactions = (): Transaction[] => {
  const today = new Date();
  const getPastDateStr = (daysAgo: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'tx-1',
      amount: 1500,
      type: 'income',
      category: 'Membership',
      date: getPastDateStr(4),
      paymentMethod: 'UPI',
      memberName: 'Gaurav Rajput',
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
      addedBy: 'receptionist',
      notes: 'Daily trial pass',
      timestamp: new Date().toISOString(),
    },
  ];
};

const getInitialAuditLogs = () => {
  return [
    { id: 'log-1', action: 'System Database seeded with defaults', role: 'admin' as UserRole, timestamp: '2026-06-13 10:00' },
    { id: 'log-2', action: 'Created membership revenue of $1500', role: 'receptionist' as UserRole, timestamp: '2026-06-13 10:30' },
    { id: 'log-3', action: 'Approved monthly lease rent payment of $850', role: 'admin' as UserRole, timestamp: '2026-06-13 12:35' },
  ];
};

function App() {
  // Main state hooks
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('gym_finance_role');
    return (saved as UserRole) || 'owner';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('gym_finance_transactions');
    return saved ? JSON.parse(saved) : getInitialTransactions();
  });

  const [categories, setCategories] = useState<{ income: string[]; expense: string[] }>(() => {
    const saved = localStorage.getItem('gym_finance_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; role: UserRole; timestamp: string }[]>(() => {
    const saved = localStorage.getItem('gym_finance_audit_logs');
    return saved ? JSON.parse(saved) : getInitialAuditLogs();
  });

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('gym_finance_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('gym_finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('gym_finance_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('gym_finance_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Logging function
  const addAuditLog = (action: string, actingRole: UserRole) => {
    const now = new Date();
    const timeStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      role: actingRole,
      timestamp: timeStr,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Handlers
  const handleAddTransaction = (data: {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    paymentMethod: string;
    notes: string;
    memberName?: string;
    payee?: string;
  }) => {
    const newTx: Transaction = {
      id: 'tx-' + Math.random().toString(36).substr(2, 9),
      ...data,
      addedBy: role,
      timestamp: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    
    const participant = data.type === 'income' ? data.memberName : data.payee;
    addAuditLog(
      `Added ${data.type} of $${data.amount.toFixed(2)} (${data.category}) - ${participant}`,
      role
    );
  };

  const handleEditSubmit = (data: {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: string;
    paymentMethod: string;
    notes: string;
    memberName?: string;
    payee?: string;
  }) => {
    if (!editingTransaction) return;

    setTransactions((prev) =>
      prev.map((t) => (t.id === editingTransaction.id ? { ...t, ...data } : t))
    );

    const participant = data.type === 'income' ? data.memberName : data.payee;
    addAuditLog(
      `Edited transaction ${editingTransaction.id}: $${data.amount.toFixed(2)} (${data.category}) - ${participant}`,
      role
    );
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    if (window.confirm(`Are you sure you want to delete this $${target.amount.toFixed(2)} transaction?`)) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      addAuditLog(`Deleted transaction ${id}: $${target.amount.toFixed(2)} (${target.category})`, role);
      
      // If we are currently editing the deleted item, cancel it
      if (editingTransaction?.id === id) {
        setEditingTransaction(null);
      }
    }
  };

  // Category additions
  const handleAddCategory = (type: 'income' | 'expense', catName: string) => {
    if (categories[type].includes(catName)) {
      alert('Category already exists!');
      return;
    }
    setCategories((prev) => ({
      ...prev,
      [type]: [...prev[type], catName],
    }));
    addAuditLog(`Added new ${type} category: "${catName}"`, role);
  };

  const handleRemoveCategory = (type: 'income' | 'expense', catName: string) => {
    setCategories((prev) => ({
      ...prev,
      [type]: prev[type].filter((c) => c !== catName),
    }));
    addAuditLog(`Removed ${type} category: "${catName}"`, role);
  };

  // Preset Add (receptionist quick tools)
  const handleAddPreset = (preset: {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    notes: string;
    memberName?: string;
    payee?: string;
  }) => {
    handleAddTransaction({
      ...preset,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: preset.type === 'income' ? 'UPI' : 'Cash',
    });
  };

  return (
    <div className="app-container">
      
      {/* Premium Header with Navigation & Role Switcher */}
      <header className="glass-panel app-header">
        <div className="logo-section">
          <div className="logo-icon">
            <Dumbbell size={22} color="#fff" />
          </div>
          <div className="logo-text">
            <h1>IronPulse Finance</h1>
            <p>Gym Revenue & Expense Manager</p>
          </div>
        </div>

        {/* Global Role Toggler */}
        <div className="role-selector">
          <button
            onClick={() => {
              setRole('owner');
              addAuditLog('Switched session view to Owner', 'owner');
            }}
            className={`role-btn ${role === 'owner' ? 'active-owner' : ''}`}
          >
            <Trophy size={14} />
            Owner
          </button>
          
          <button
            onClick={() => {
              setRole('receptionist');
              addAuditLog('Switched session view to Receptionist', 'receptionist');
            }}
            className={`role-btn ${role === 'receptionist' ? 'active-receptionist' : ''}`}
          >
            <Users size={14} />
            Reception
          </button>
          
          <button
            onClick={() => {
              setRole('admin');
              addAuditLog('Switched session view to Admin', 'admin');
            }}
            className={`role-btn ${role === 'admin' ? 'active-admin' : ''}`}
          >
            <Shield size={14} />
            Admin
          </button>
        </div>
      </header>

      {/* Analytics Summary & Charts Block */}
      <Dashboard
        transactions={transactions}
        role={role}
        categories={categories}
        onAddCategory={handleAddCategory}
        onRemoveCategory={handleRemoveCategory}
        auditLogs={auditLogs}
      />

      {/* Main Workspace Layout */}
      <div className="main-layout">
        
        {/* Left Hand: Transaction Ledger with Search/Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <TransactionList
            transactions={transactions}
            onEdit={(t) => setEditingTransaction(t)}
            onDelete={handleDeleteTransaction}
            role={role}
            categories={categories}
          />
        </div>

        {/* Right Hand: Adding/Editing Form + Quick Action presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <TransactionForm
            onSubmit={editingTransaction ? handleEditSubmit : handleAddTransaction}
            editingTransaction={editingTransaction}
            onCancelEdit={() => setEditingTransaction(null)}
            categories={categories}
          />

          <QuickAdd
            role={role}
            onAddPreset={handleAddPreset}
          />

        </div>

      </div>

      {/* App Modal: For clean edit experience on smaller viewports if desired */}
      {editingTransaction && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <TransactionForm
              onSubmit={handleEditSubmit}
              editingTransaction={editingTransaction}
              onCancelEdit={() => setEditingTransaction(null)}
              categories={categories}
            />
          </div>
        </div>
      )}

      {/* Premium Footer */}
      <footer className="app-footer">
        <p>
          IronPulse Finance Dashboard • Developed for <span>Gym Owners, Receptionists & Admins</span>
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginTop: '0.25rem' }}>
          Mock engine powered by local storage. No external API server required.
        </p>
      </footer>

    </div>
  );
}

export default App;
