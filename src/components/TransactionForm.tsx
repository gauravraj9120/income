import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { PlusCircle, Edit3, X } from 'lucide-react';
import type { Transaction, TransactionType } from '../types';

interface TransactionFormProps {
  onSubmit: (transactionData: {
    amount: number;
    type: TransactionType;
    category: string;
    date: string;
    paymentMethod: string;
    notes: string;
    memberName?: string;
    payee?: string;
  }) => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
  categories: { income: string[]; expense: string[] };
}

export const TransactionForm = ({
  onSubmit,
  editingTransaction,
  onCancelEdit,
  categories,
}: TransactionFormProps) => {
  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [notes, setNotes] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  const [payee, setPayee] = useState<string>('');

  // Sync state if editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setNotes(editingTransaction.notes || '');
      setMemberName(editingTransaction.memberName || '');
      setPayee(editingTransaction.payee || '');
    } else {
      resetForm();
    }
  }, [editingTransaction]);

  // Reset category dropdown when type changes
  useEffect(() => {
    if (!editingTransaction) {
      const currentList = type === 'income' ? categories.income : categories.expense;
      setCategory(currentList[0] || 'Other');
    }
  }, [type, categories, editingTransaction]);

  const resetForm = () => {
    setAmount('');
    const currentList = type === 'income' ? categories.income : categories.expense;
    setCategory(currentList[0] || 'Other');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('UPI');
    setNotes('');
    setMemberName('');
    setPayee('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    onSubmit({
      amount: Number(amount),
      type,
      category,
      date,
      paymentMethod,
      notes,
      ...(type === 'income' ? { memberName: memberName || 'Walk-in Guest' } : { payee: payee || 'General Vendor' }),
    });

    if (!editingTransaction) {
      resetForm();
    }
  };

  const currentCategories = type === 'income' ? categories.income : categories.expense;

  return (
    <div className="glass-panel form-container">
      <div className="form-header">
        <h2>
          {editingTransaction ? (
            <>
              <Edit3 size={20} className="text-primary" /> Edit Transaction
            </>
          ) : (
            <>
              <PlusCircle size={20} className="text-primary" /> Add Transaction
            </>
          )}
        </h2>

        {!editingTransaction && (
          <div className="form-toggle">
            <button
              type="button"
              className={`toggle-option ${type === 'income' ? 'active-income' : ''}`}
              onClick={() => setType('income')}
            >
              Income
            </button>
            <button
              type="button"
              className={`toggle-option ${type === 'expense' ? 'active-expense' : ''}`}
              onClick={() => setType('expense')}
            >
              Expense
            </button>
          </div>
        )}

        {editingTransaction && onCancelEdit && (
          <button onClick={onCancelEdit} className="action-btn delete" title="Cancel Editing">
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-group">
          <label>Amount ($)</label>
          <input
            type="number"
            step="0.01"
            required
            className="form-input"
            placeholder="e.g. 50.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {currentCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {type === 'income' ? (
          <div className="form-group">
            <label>Member / Client Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Gaurav Rajput"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            />
          </div>
        ) : (
          <div className="form-group">
            <label>Vendor / Payee</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Powerhouse Equipment"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label>Payment Method</label>
          <select
            className="form-select"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="UPI">UPI / QR Scan</option>
            <option value="Cash">Cash Drawer</option>
            <option value="Card">Credit/Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            required
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-group full-width">
          <label>Description / Notes</label>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button type="submit" className="submit-btn full-width">
          {editingTransaction ? 'Update Transaction' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
        </button>
      </form>
    </div>
  );
};
