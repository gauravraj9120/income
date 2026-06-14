import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { Search, Edit, Trash2, Calendar, FileText } from 'lucide-react';
import type { Transaction, UserRole } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  role: UserRole;
  categories: { income: string[]; expense: string[] };
}

export const TransactionList = ({
  transactions,
  onEdit,
  onDelete,
  role,
  categories,
}: TransactionListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Filter transactions based on Search, Type, and Category
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.memberName && t.memberName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.payee && t.payee.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || t.type === filterType;
    
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  // Get list of relevant categories to filter by
  const allCategories = [...categories.income, ...categories.expense];

  // Helper to get role badge class
  const getRoleBadgeClass = (addedBy: UserRole) => {
    if (addedBy === 'owner') return 'badge-role-owner';
    if (addedBy === 'receptionist') return 'badge-role-receptionist';
    return 'badge-role-admin';
  };

  return (
    <div className="glass-panel ledger-container">
      <div className="ledger-header">
        <h2>
          <FileText size={20} className="text-primary" /> Transaction Ledger
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing {filteredTransactions.length} of {transactions.length} items
        </span>
      </div>

      {/* Filters Panel */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search by name, notes, category..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div>
          <select
            className="form-select"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value as 'all' | 'income' | 'expense');
              setFilterCategory('all'); // Reset category filter on type toggle
            }}
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>
        </div>

        <div>
          <select
            className="form-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {filterType === 'all'
              ? Array.from(new Set(allCategories)).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))
              : (filterType === 'income' ? categories.income : categories.expense).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-responsive">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <Search className="empty-state-icon" />
            <p>No transactions match your search or filter options.</p>
          </div>
        ) : (
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Participant</th>
                <th>Category</th>
                <th>Method</th>
                <th>Notes</th>
                <th>Added By</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      {t.date}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {t.type === 'income' ? t.memberName : t.payee}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)' }}>{t.category}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '4px' }}>
                      {t.paymentMethod}
                    </span>
                  </td>
                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.notes}>
                    <span style={{ color: 'var(--text-muted)' }}>{t.notes || '—'}</span>
                  </td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(t.addedBy)}`}>
                      {t.addedBy}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <span className={`table-amount ${t.type === 'income' ? 'income' : 'expense'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons" style={{ justifyContent: 'center' }}>
                      <button
                        onClick={() => onEdit(t)}
                        className="action-btn edit"
                        title="Edit transaction"
                      >
                        <Edit size={16} />
                      </button>
                      {(role === 'admin' || role === 'owner') && (
                        <button
                          onClick={() => onDelete(t.id)}
                          className="action-btn delete"
                          title="Delete transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
