import { useState } from 'react';
import type { FormEvent } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Percent, Settings, Database, Trash2, ShieldAlert } from 'lucide-react';
import type { Transaction, UserRole } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  role: UserRole;
  categories: { income: string[]; expense: string[] };
  onAddCategory: (type: 'income' | 'expense', category: string) => void;
  onRemoveCategory: (type: 'income' | 'expense', category: string) => void;
  auditLogs: { id: string; action: string; role: UserRole; timestamp: string }[];
}

export const Dashboard = ({
  transactions,
  role,
  categories,
  onAddCategory,
  onRemoveCategory,
  auditLogs,
}: DashboardProps) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('income');

  // Calculations
  const incomeTransactions = transactions.filter((t) => t.type === 'income');
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Today's summary (Useful for Receptionist)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.date === todayStr);
  const todayIncome = todayTransactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);


  // Aggregate data for custom SVG Bar Chart (Last 5 active transaction dates or 5 standard days)
  const getChartData = () => {
    // Get unique dates
    const uniqueDates = Array.from(new Set(transactions.map((t) => t.date))).sort();
    // Take last 5 dates
    const lastDates = uniqueDates.slice(-5);
    
    // If we have less than 3 dates, pad with dummy dates for visual appeal
    if (lastDates.length < 5) {
      const today = new Date();
      for (let i = 4; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        if (!lastDates.includes(dStr)) {
          lastDates.push(dStr);
        }
      }
    }

    lastDates.sort();

    return lastDates.map((date) => {
      const dayTransactions = transactions.filter((t) => t.date === date);
      const inc = dayTransactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const exp = dayTransactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      
      // Extract short date e.g. "Jun 13"
      const dateObj = new Date(date);
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

      return {
        date,
        label,
        income: inc,
        expense: exp,
      };
    });
  };

  const chartData = getChartData();
  const maxVal = Math.max(...chartData.flatMap((d) => [d.income, d.expense]), 100);

  const handleAddCategorySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory(newCatType, newCatName.trim());
    setNewCatName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        
        {/* KPI: Total Income */}
        <div className="glass-panel kpi-card income">
          <div className="kpi-info">
            <p>Total Revenue</p>
            <span className="kpi-value">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="kpi-icon">
            <ArrowUpRight size={24} />
          </div>
        </div>

        {/* KPI: Total Expenses */}
        <div className="glass-panel kpi-card expense">
          <div className="kpi-info">
            <p>Total Expenses</p>
            <span className="kpi-value">${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="kpi-icon">
            <ArrowDownRight size={24} />
          </div>
        </div>

        {/* KPI: Net Profit */}
        <div className="glass-panel kpi-card balance">
          <div className="kpi-info">
            <p>Net Cash Flow</p>
            <span className="kpi-value" style={{ color: netBalance >= 0 ? 'var(--text-primary)' : 'var(--color-expense)' }}>
              {netBalance < 0 ? '-' : ''}${Math.abs(netBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="kpi-icon">
            <DollarSign size={24} />
          </div>
        </div>

        {/* KPI: Profit Margin / Shift Metrics */}
        <div className="glass-panel kpi-card margin">
          <div className="kpi-info">
            {role === 'receptionist' ? (
              <>
                <p>Today's Shift Intake</p>
                <span className="kpi-value" style={{ color: 'var(--color-teal)' }}>
                  +${todayIncome.toFixed(2)}
                </span>
              </>
            ) : (
              <>
                <p>Profit Margin</p>
                <span className="kpi-value" style={{ color: 'var(--color-teal)' }}>
                  {profitMargin.toFixed(1)}%
                </span>
              </>
            )}
          </div>
          <div className="kpi-icon">
            <Percent size={24} />
          </div>
        </div>

      </div>

      {/* Analytics Chart Block */}
      <div className="glass-panel chart-container">
        <div className="chart-header">
          <h3>Recent Cash Flow Trends</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            LAST 5 RECORDED DAYS
          </span>
        </div>

        <div className="custom-chart-wrapper">
          {chartData.map((data, index) => {
            const incHeight = (data.income / maxVal) * 100;
            const expHeight = (data.expense / maxVal) * 100;

            return (
              <div key={index} className="chart-column">
                <div className="chart-bars">
                  {/* Income Bar */}
                  <div 
                    className="chart-bar income" 
                    style={{ height: `${Math.max(incHeight, 5)}%` }}
                  >
                    <div className="chart-bar-tooltip">Income: ${data.income.toFixed(0)}</div>
                  </div>
                  
                  {/* Expense Bar */}
                  <div 
                    className="chart-bar expense" 
                    style={{ height: `${Math.max(expHeight, 5)}%` }}
                  >
                    <div className="chart-bar-tooltip">Expense: ${data.expense.toFixed(0)}</div>
                  </div>
                </div>
                <div className="chart-label">{data.label}</div>
              </div>
            );
          })}
        </div>

        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-dot income"></div>
            <span>Revenue</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot expense"></div>
            <span>Expenses</span>
          </div>
        </div>
      </div>

      {/* Receptionist Cash drawer reconciliation */}
      {role === 'receptionist' && (
        <div className="glass-panel quick-add-container">
          <h3>Daily Cash Drawer & Registers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>TODAY'S CASH DRAWER</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-income)', marginTop: '0.25rem' }}>
                ${(transactions.filter(t => t.date === todayStr && t.paymentMethod === 'Cash' && t.type === 'income').reduce((acc, t) => acc + t.amount, 0) -
                   transactions.filter(t => t.date === todayStr && t.paymentMethod === 'Cash' && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0)).toFixed(2)}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem' }}>Reconcile at end of day shift</p>
            </div>
            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>TODAY'S DIGITAL RECEIPT (UPI/CARD)</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-teal)', marginTop: '0.25rem' }}>
                ${transactions.filter(t => t.date === todayStr && t.paymentMethod !== 'Cash' && t.type === 'income').reduce((acc, t) => acc + t.amount, 0).toFixed(2)}
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem' }}>Deposited directly to Gym accounts</p>
            </div>
          </div>
        </div>
      )}

      {/* Administrator Configuration Panels */}
      {role === 'admin' && (
        <div className="admin-settings" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* Category Configuration */}
          <div className="glass-panel quick-add-container" style={{ gridColumn: 'span 1' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Settings size={16} /> Category Customizer
            </h3>
            
            <form onSubmit={handleAddCategorySubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Category name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{ padding: '0.5rem' }}
              />
              <select
                className="form-select"
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as 'income' | 'expense')}
                style={{ width: '110px', padding: '0.5rem' }}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <button type="submit" className="submit-btn" style={{ padding: '0.5rem 1rem', marginTop: 0, fontSize: '0.85rem' }}>
                Add
              </button>
            </form>

            <div style={{ marginTop: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-income)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Income Categories</p>
              <div className="category-pill-list">
                {categories.income.map((cat) => (
                  <div key={`inc-${cat}`} className="category-pill">
                    <span className="category-dot" style={{ backgroundColor: 'var(--color-income)' }} />
                    {cat}
                    {categories.income.length > 1 && (
                      <button 
                        onClick={() => onRemoveCategory('income', cat)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-expense)', cursor: 'pointer', paddingLeft: '4px' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-expense)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Expense Categories</p>
              <div className="category-pill-list">
                {categories.expense.map((cat) => (
                  <div key={`exp-${cat}`} className="category-pill">
                    <span className="category-dot" style={{ backgroundColor: 'var(--color-expense)' }} />
                    {cat}
                    {categories.expense.length > 1 && (
                      <button 
                        onClick={() => onRemoveCategory('expense', cat)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-expense)', cursor: 'pointer', paddingLeft: '4px' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="glass-panel quick-add-container" style={{ gridColumn: 'span 1' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} /> Audit trail (Simulation)
            </h3>
            
            <div className="audit-log-list" style={{ marginTop: '0.5rem' }}>
              {auditLogs.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ShieldAlert size={20} style={{ marginBottom: '0.5rem' }} />
                  No events logged.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="audit-log-item">
                    <div>
                      <span className={`badge ${log.role === 'owner' ? 'badge-role-owner' : log.role === 'receptionist' ? 'badge-role-receptionist' : 'badge-role-admin'}`} style={{ marginRight: '0.5rem', fontSize: '0.65rem' }}>
                        {log.role}
                      </span>
                      <span>{log.action}</span>
                    </div>
                    <div className="audit-meta">
                      <span className="audit-time">{log.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
