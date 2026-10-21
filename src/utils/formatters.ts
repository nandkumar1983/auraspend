import { CategoryDef, CategoryId } from '../types/expense';

export const CATEGORIES: Record<CategoryId, CategoryDef> = {
  groceries: { id: 'groceries', name: 'Groceries & Mart', icon: 'ShoppingCart', color: '#0EA5E9', type: 'expense' },
  dining: { id: 'dining', name: 'Dining & Cafes', icon: 'Utensils', color: '#F59E0B', type: 'expense' },
  shopping: { id: 'shopping', name: 'Shopping & Retail', icon: 'ShoppingBag', color: '#EC4899', type: 'expense' },
  transport: { id: 'transport', name: 'Transportation', icon: 'Car', color: '#3B82F6', type: 'expense' },
  utilities: { id: 'utilities', name: 'Bills & Utilities', icon: 'Zap', color: '#8B5CF6', type: 'expense' },
  housing: { id: 'housing', name: 'Housing & Rent', icon: 'Home', color: '#6366F1', type: 'expense' },
  entertainment: { id: 'entertainment', name: 'Entertainment', icon: 'Film', color: '#F43F5E', type: 'expense' },
  health: { id: 'health', name: 'Health & Pharmacy', icon: 'Activity', color: '#06B6D4', type: 'expense' },
  salary: { id: 'salary', name: 'Salary & Wages', icon: 'Briefcase', color: '#2563EB', type: 'income' },
  freelance: { id: 'freelance', name: 'Freelance & Bonus', icon: 'Award', color: '#4F46E5', type: 'income' },
  investment: { id: 'investment', name: 'Investment & Divs', icon: 'TrendingUp', color: '#0284C7', type: 'income' },
  transfer: { id: 'transfer', name: 'Account Transfer', icon: 'Repeat', color: '#64748B', type: 'both' },
  other: { id: 'other', name: 'General / Misc', icon: 'MoreHorizontal', color: '#94A3B8', type: 'both' },
};

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function formatDateFull(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
