import { Plus, Dumbbell, UserCheck, Coffee, RefreshCw, ShoppingCart } from 'lucide-react';
import type { UserRole } from '../types';

interface QuickAddProps {
  role: UserRole;
  onAddPreset: (preset: {
    amount: number;
    type: 'income' | 'expense';
    category: string;
    notes: string;
    memberName?: string;
    payee?: string;
  }) => void;
}

export const QuickAdd = ({ role, onAddPreset }: QuickAddProps) => {
  if (role !== 'receptionist') return null;

  const incomePresets = [
    {
      label: 'Guest Pass',
      amount: 10,
      category: 'Guest Pass',
      icon: <UserCheck className="quick-add-btn-icon" />,
      notes: 'Daily guest walk-in pass',
    },
    {
      label: 'Monthly Gym',
      amount: 50,
      category: 'Membership',
      icon: <Dumbbell className="quick-add-btn-icon" />,
      notes: 'Standard 1-Month Membership',
    },
    {
      label: 'PT Session',
      amount: 75,
      category: 'Personal Training',
      icon: <RefreshCw className="quick-add-btn-icon" />,
      notes: '1-Hour personal training session',
    },
    {
      label: 'Cafe Shake',
      amount: 5,
      category: 'Cafe/Merchandise',
      icon: <Coffee className="quick-add-btn-icon" />,
      notes: 'Post-workout protein shake',
    },
  ];

  const expensePresets = [
    {
      label: 'Water Refill',
      amount: 15,
      category: 'Utilities',
      icon: <Plus className="quick-add-btn-icon" />,
      notes: 'Water dispenser refill bottles',
    },
    {
      label: 'Towels Wash',
      amount: 25,
      category: 'Cleaning Supplies',
      icon: <ShoppingCart className="quick-add-btn-icon" />,
      notes: 'Laundry service for gym towels',
    },
    {
      label: 'Gym Chalk',
      amount: 12,
      category: 'Equipment Maintenance',
      icon: <Dumbbell className="quick-add-btn-icon" />,
      notes: 'Replacement chalk blocks for lifting platform',
    },
  ];

  return (
    <div className="glass-panel quick-add-container">
      <h3>Quick Reception Presets</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-income)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Quick Income Entries
          </p>
          <div className="quick-add-grid">
            {incomePresets.map((preset, index) => (
              <button
                key={`inc-${index}`}
                onClick={() =>
                  onAddPreset({
                    amount: preset.amount,
                    type: 'income',
                    category: preset.category,
                    notes: preset.notes,
                    memberName: 'Walk-in Guest',
                  })
                }
                className="quick-add-btn income-preset"
              >
                {preset.icon}
                <span>{preset.label}</span>
                <span className="quick-price">${preset.amount}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-expense)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Quick Expense Entries
          </p>
          <div className="quick-add-grid">
            {expensePresets.map((preset, index) => (
              <button
                key={`exp-${index}`}
                onClick={() =>
                  onAddPreset({
                    amount: preset.amount,
                    type: 'expense',
                    category: preset.category,
                    notes: preset.notes,
                    payee: 'Local Vendor',
                  })
                }
                className="quick-add-btn expense-preset"
              >
                {preset.icon}
                <span>{preset.label}</span>
                <span className="quick-price">${preset.amount}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
