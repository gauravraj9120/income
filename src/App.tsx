import { useState, useEffect } from 'react';
import { Shield, Users, Trophy, Dumbbell } from 'lucide-react';
import type { Transaction, UserRole } from './types';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { QuickAdd } from './components/QuickAdd';



function App() {
  // Main state hooks
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('gym_finance_role');
    return (saved as UserRole) || 'owner';
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<{ income: string[]; expense: string[] }>({ income: [], expense: [] });
  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; role: UserRole; timestamp: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Sync role to local storage
  useEffect(() => {
    localStorage.setItem('gym_finance_role', role);
  }, [role]);

  // Load database values on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [txRes, catRes, logRes] = await Promise.all([
          fetch('/api/transactions'),
          fetch('/api/categories'),
          fetch('/api/audit-logs'),
        ]);

        if (txRes.ok && catRes.ok && logRes.ok) {
          const txData = await txRes.json();
          const catData = await catRes.json();
          const logData = await logRes.json();

          setTransactions(txData);
          setCategories(catData);
          setAuditLogs(logData);
        }
      } catch (error) {
        console.error('Error fetching initial data from backend:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Logging function
  const addAuditLog = async (action: string, actingRole: UserRole) => {
    const now = new Date();
    const timeStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      action,
      role: actingRole,
      timestamp: timeStr,
    };

    try {
      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      });
      if (response.ok) {
        setAuditLogs((prev) => [newLog, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
  };

  // Handlers
  const handleAddTransaction = async (data: {
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

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
      if (response.ok) {
        const savedTx = await response.json();
        setTransactions((prev) => [savedTx, ...prev]);
        const participant = data.type === 'income' ? data.memberName : data.payee;
        await addAuditLog(
          `Added ${data.type} of $${data.amount.toFixed(2)} (${data.category}) - ${participant}`,
          role
        );
      }
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  const handleEditSubmit = async (data: {
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

    try {
      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const updatedTx = await response.json();
        setTransactions((prev) =>
          prev.map((t) => (t.id === editingTransaction.id ? updatedTx : t))
        );
        const participant = data.type === 'income' ? data.memberName : data.payee;
        await addAuditLog(
          `Edited transaction ${editingTransaction.id}: $${data.amount.toFixed(2)} (${data.category}) - ${participant}`,
          role
        );
        setEditingTransaction(null);
      }
    } catch (err) {
      console.error('Failed to update transaction:', err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    if (window.confirm(`Are you sure you want to delete this $${target.amount.toFixed(2)} transaction?`)) {
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setTransactions((prev) => prev.filter((t) => t.id !== id));
          await addAuditLog(`Deleted transaction ${id}: $${target.amount.toFixed(2)} (${target.category})`, role);
          if (editingTransaction?.id === id) {
            setEditingTransaction(null);
          }
        }
      } catch (err) {
        console.error('Failed to delete transaction:', err);
      }
    }
  };

  // Category additions
  const handleAddCategory = async (type: 'income' | 'expense', catName: string) => {
    if (categories[type].includes(catName)) {
      alert('Category already exists!');
      return;
    }
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, type }),
      });
      if (response.ok) {
        setCategories((prev) => ({
          ...prev,
          [type]: [...prev[type], catName],
        }));
        await addAuditLog(`Added new ${type} category: "${catName}"`, role);
      }
    } catch (err) {
      console.error('Failed to add category:', err);
    }
  };

  const handleRemoveCategory = async (type: 'income' | 'expense', catName: string) => {
    try {
      const response = await fetch(`/api/categories/${type}/${catName}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setCategories((prev) => ({
          ...prev,
          [type]: prev[type].filter((c) => c !== catName),
        }));
        await addAuditLog(`Removed ${type} category: "${catName}"`, role);
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
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

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading IronPulse Database...</p>
      </div>
    );
  }

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
