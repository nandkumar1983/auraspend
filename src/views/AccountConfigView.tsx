import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  Trash2,
  Edit2,
  Shield,
  ShieldCheck,
  Lock,
  CreditCard,
  PiggyBank,
  Wallet,
  Users,
  Tags,
  User,
  Check,
  AlertCircle,
  Calendar,
  IndianRupee,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Save,
  RotateCcw,
  Fingerprint,
  CheckCircle2,
} from 'lucide-react';
import { BankAccount, CategoryDef, LenderContact, UserConfig } from '../types/expense';
import { formatCurrency } from '../utils/formatters';
import { StorageService } from '../services/storage';
import { BiometricService } from '../services/biometric';

interface AccountConfigViewProps {
  accounts: BankAccount[];
  onAccountsUpdated: (accounts: BankAccount[]) => void;
  savedPin: string;
  onUpdatePin: (newPin: string) => void;
  onLockApp: () => void;
  onRefreshData?: () => void;
}

type ConfigTab = 'accounts' | 'cards' | 'lenders' | 'categories' | 'user' | 'security';

export const AccountConfigView: React.FC<AccountConfigViewProps> = ({
  accounts,
  onAccountsUpdated,
  savedPin,
  onUpdatePin,
  onLockApp,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<ConfigTab>('accounts');
  const [feedback, setFeedback] = useState<string | null>(null);

  // User Config State
  const [userConfig, setUserConfig] = useState<UserConfig>(StorageService.getUserConfig());
  const [isBiometricSupported, setIsBiometricSupported] = useState<boolean>(false);
  const [isBiometricProcessing, setIsBiometricProcessing] = useState<boolean>(false);

  useEffect(() => {
    BiometricService.isAvailable().then(setIsBiometricSupported);
  }, []);

  // Lender Contacts State
  const [lenderContacts, setLenderContacts] = useState<LenderContact[]>(StorageService.getLenderContacts());
  const [isAddingLender, setIsAddingLender] = useState(false);
  const [lenderName, setLenderName] = useState('');
  const [lenderPhone, setLenderPhone] = useState('');
  const [lenderRelation, setLenderRelation] = useState('Friend');
  const [lenderNotes, setLenderNotes] = useState('');

  // Categories State
  const [categories, setCategories] = useState<CategoryDef[]>(StorageService.getCategories());
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#2563EB');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');

  // Bank & Card State
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accName, setAccName] = useState('');
  const [accInstitution, setAccInstitution] = useState('HDFC Bank');
  const [accNumber, setAccNumber] = useState('');
  const [accType, setAccType] = useState<'checking' | 'savings' | 'credit' | 'cash'>('savings');
  const [accBalance, setAccBalance] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [billCycleDay, setBillCycleDay] = useState('15');
  const [paymentDueDay, setPaymentDueDay] = useState('5');

  // PIN security change state
  const [currentPinAttempt, setCurrentPinAttempt] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Bank & Credit Card Handlers
  const bankAccountsList = accounts.filter((a) => a.type !== 'credit');
  const creditCardsList = accounts.filter((a) => a.type === 'credit');

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accName.trim()) {
      showFeedback('Please enter an account name.');
      return;
    }

    const isCredit = accType === 'credit';
    const newAcc: BankAccount = {
      id: editingAccountId || `acc-${Date.now()}`,
      name: accName.trim(),
      institution: accInstitution.trim() || 'Bank',
      accountNumber: accNumber.trim() ? `•••• ${accNumber.slice(-4)}` : '•••• 0000',
      type: accType,
      balance: parseFloat(accBalance) || 0,
      availableLimit: isCredit ? parseFloat(cardLimit) || 0 : undefined,
      billCycleDay: isCredit ? parseInt(billCycleDay, 10) || 15 : undefined,
      paymentDueDate: isCredit ? parseInt(paymentDueDay, 10) || 5 : undefined,
      lastSyncedAt: 'Configured',
      syncStatus: 'connected',
      color: isCredit ? '#C2410C' : accType === 'savings' ? '#0284C7' : accType === 'cash' ? '#059669' : '#2563EB',
      iconName: isCredit ? 'CreditCard' : accType === 'savings' ? 'PiggyBank' : accType === 'cash' ? 'Wallet' : 'Landmark',
      isAutoSyncEnabled: true,
    };

    let updated: BankAccount[];
    if (editingAccountId) {
      updated = accounts.map((a) => (a.id === editingAccountId ? newAcc : a));
    } else {
      updated = [...accounts, newAcc];
    }

    StorageService.saveAccounts(updated);
    onAccountsUpdated(updated);
    setIsAddingAccount(false);
    setEditingAccountId(null);
    setAccName('');
    setAccNumber('');
    setAccBalance('');
    setCardLimit('');
    showFeedback(editingAccountId ? 'Account details updated.' : 'Account added successfully.');
  };

  const handleEditAccount = (acc: BankAccount) => {
    setEditingAccountId(acc.id);
    setAccName(acc.name);
    setAccInstitution(acc.institution);
    setAccNumber(acc.accountNumber.replace(/[^0-9]/g, ''));
    setAccType(acc.type);
    setAccBalance(acc.balance.toString());
    setCardLimit(acc.availableLimit ? acc.availableLimit.toString() : '');
    setBillCycleDay(acc.billCycleDay ? acc.billCycleDay.toString() : '15');
    setPaymentDueDay(acc.paymentDueDate ? acc.paymentDueDate.toString() : '5');
    setIsAddingAccount(true);
  };

  const handleDeleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      showFeedback('At least one account is required in the ledger.');
      return;
    }
    const updated = accounts.filter((a) => a.id !== id);
    StorageService.saveAccounts(updated);
    onAccountsUpdated(updated);
    showFeedback('Account removed.');
  };

  // Lender Contacts Handlers
  const handleSaveLender = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lenderName.trim()) {
      showFeedback('Please enter contact name.');
      return;
    }

    const created = StorageService.addLenderContact({
      name: lenderName.trim(),
      phone: lenderPhone.trim(),
      relationship: lenderRelation,
      notes: lenderNotes.trim(),
    });

    setLenderContacts(StorageService.getLenderContacts());
    setIsAddingLender(false);
    setLenderName('');
    setLenderPhone('');
    setLenderNotes('');
    showFeedback(`Contact ${created.name} added to Lenders list.`);
  };

  const handleDeleteLender = (id: string) => {
    StorageService.deleteLenderContact(id);
    setLenderContacts(StorageService.getLenderContacts());
    showFeedback('Contact removed.');
  };

  // Custom Category Handlers
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showFeedback('Please enter category name.');
      return;
    }

    const id = newCatName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (categories.some((c) => c.id === id)) {
      showFeedback('A category with this name already exists.');
      return;
    }

    const newCat: CategoryDef = {
      id,
      name: newCatName.trim(),
      icon: 'Tags',
      color: newCatColor,
      type: newCatType,
    };

    const updated = [...categories, newCat];
    StorageService.saveCategories(updated);
    setCategories(updated);
    setIsAddingCategory(false);
    setNewCatName('');
    showFeedback(`Category "${newCat.name}" created.`);
  };

  // User Config Save
  const handleSaveUserConfig = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveUserConfig(userConfig);
    showFeedback('User profile & salary configuration saved.');
  };

  // PIN Update Handler (Fixes Security Breach!)
  const handleUpdatePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    // If custom PIN was already set, must verify current PIN
    if (savedPin && savedPin !== '1234') {
      if (currentPinAttempt !== savedPin) {
        setPinError('Incorrect current PIN! Verification failed.');
        return;
      }
    }

    if (!/^\d{4}$/.test(newPin)) {
      setPinError('New PIN must be exactly 4 digits.');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('New PIN and Confirm PIN do not match.');
      return;
    }

    if (newPin === '1234') {
      setPinError('Please choose a secure PIN other than default 1234.');
      return;
    }

    onUpdatePin(newPin);
    setCurrentPinAttempt('');
    setNewPin('');
    setConfirmPin('');
    showFeedback('✓ Security PIN successfully changed! Only your new PIN can unlock the app.');
  };

  // Biometric Unlock Handlers
  const handleToggleBiometric = async () => {
    if (userConfig.enableBiometric) {
      const updated: UserConfig = { ...userConfig, enableBiometric: false };
      setUserConfig(updated);
      StorageService.saveUserConfig(updated);
      showFeedback('Biometric unlock disabled. Access is now secured with PIN only.');
      return;
    }

    setIsBiometricProcessing(true);
    showFeedback('Please authenticate using your device fingerprint or face scanner...');

    const res = await BiometricService.register(userConfig.userName);
    setIsBiometricProcessing(false);

    if (res.success && res.credentialId) {
      const updated: UserConfig = {
        ...userConfig,
        enableBiometric: true,
        biometricCredentialId: res.credentialId,
      };
      setUserConfig(updated);
      StorageService.saveUserConfig(updated);
      showFeedback('✓ Fingerprint / Face Unlock successfully registered and enabled!');
    } else {
      showFeedback(res.error || 'Biometric registration cancelled.');
    }
  };

  const handleTestBiometric = async () => {
    setIsBiometricProcessing(true);
    showFeedback('Scan fingerprint / face to verify...');
    const res = await BiometricService.verify(userConfig.biometricCredentialId);
    setIsBiometricProcessing(false);

    if (res.success) {
      showFeedback('✓ Biometric authenticated successfully! Sensor responded accurately.');
    } else {
      showFeedback(res.error || 'Biometric verification could not be completed.');
    }
  };

  // Clear all data for clean production launch
  const handleClearAllData = () => {
    if (window.confirm('Clear all ledger transactions & debts to start fresh?')) {
      StorageService.clearAllUserData();
      if (onRefreshData) onRefreshData();
      showFeedback('✓ Ledger purged! Clean production slate ready for use.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
      {/* Configuration Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            Configuration & Setup
            <span className="text-[10px] bg-blue-600/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
              Production
            </span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Configure accounts, cards, lenders, expense categories & security
          </p>
        </div>

        <button
          onClick={onLockApp}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold active:scale-95 transition-all shadow-sm"
          title="Lock Screen with PIN"
        >
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          <span>Lock</span>
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-600 text-sky-200 text-xs font-medium flex items-center gap-2 shadow-lg animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Configuration Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'accounts', label: 'Bank Accounts', icon: Landmark, count: bankAccountsList.length },
          { id: 'cards', label: 'Credit Cards', icon: CreditCard, count: creditCardsList.length },
          { id: 'lenders', label: 'Lenders / Debts', icon: Users, count: lenderContacts.length },
          { id: 'categories', label: 'Categories', icon: Tags, count: categories.length },
          { id: 'user', label: 'User & Salary', icon: User },
          { id: 'security', label: 'PIN Security', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ConfigTab);
                setIsAddingAccount(false);
                setEditingAccountId(null);
                setIsAddingLender(false);
                setIsAddingCategory(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-900/40'
                  : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BANK ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Active Bank & Cash Accounts</span>
            <button
              onClick={() => {
                setIsAddingAccount(true);
                setEditingAccountId(null);
                setAccType('savings');
                setAccName('');
                setAccBalance('0');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bank A/C</span>
            </button>
          </div>

          {/* Form to Add or Edit Account */}
          {isAddingAccount && (
            <form onSubmit={handleSaveAccount} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center justify-between">
                <span>{editingAccountId ? 'Edit Bank Account' : 'Add New Bank Account'}</span>
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Account Nickname</label>
                  <input
                    type="text"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    placeholder="e.g. HDFC Salary, SBI Savings"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Bank / Institution</label>
                  <input
                    type="text"
                    value={accInstitution}
                    onChange={(e) => setAccInstitution(e.target.value)}
                    placeholder="e.g. HDFC, SBI, ICICI, Cash"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Account Type</label>
                  <select
                    value={accType}
                    onChange={(e) => setAccType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="savings">Savings A/C</option>
                    <option value="checking">Current / Salary A/C</option>
                    <option value="cash">Cash / Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">A/C Number (Last 4)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={accNumber}
                    onChange={(e) => setAccNumber(e.target.value)}
                    placeholder="4128"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={accBalance}
                    onChange={(e) => setAccBalance(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/40"
                >
                  Save Account
                </button>
              </div>
            </form>
          )}

          {/* List of Bank Accounts */}
          <div className="space-y-2">
            {bankAccountsList.map((acc) => (
              <div
                key={acc.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                    style={{ backgroundColor: acc.color }}
                  >
                    {acc.type === 'cash' ? <Wallet className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      {acc.name}
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {acc.type}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {acc.institution} • {acc.accountNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {formatCurrency(acc.balance)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">Balance</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditAccount(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CREDIT CARDS */}
      {activeTab === 'cards' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300">Credit Card Setup & Billing Cycles</span>
              <p className="text-[10px] text-slate-400">Track limits, outstanding due, and billing dates</p>
            </div>
            <button
              onClick={() => {
                setIsAddingAccount(true);
                setEditingAccountId(null);
                setAccType('credit');
                setAccName('');
                setAccBalance('0');
                setCardLimit('100000');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-900/30 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Credit Card</span>
            </button>
          </div>

          {/* Form to Add Credit Card */}
          {isAddingAccount && accType === 'credit' && (
            <form onSubmit={handleSaveAccount} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center justify-between">
                <span>{editingAccountId ? 'Edit Credit Card' : 'Add New Credit Card'}</span>
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Card Name</label>
                  <input
                    type="text"
                    value={accName}
                    onChange={(e) => setAccName(e.target.value)}
                    placeholder="e.g. HDFC Regalia, ICICI Amazon"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Issuing Bank</label>
                  <input
                    type="text"
                    value={accInstitution}
                    onChange={(e) => setAccInstitution(e.target.value)}
                    placeholder="e.g. HDFC Bank, SBI Card"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Total Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)}
                    placeholder="100000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Current Outstanding Due (₹)</label>
                  <input
                    type="number"
                    value={accBalance}
                    onChange={(e) => setAccBalance(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Card Digits (Last 4)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={accNumber}
                    onChange={(e) => setAccNumber(e.target.value)}
                    placeholder="8902"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Bill Gen Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={billCycleDay}
                    onChange={(e) => setBillCycleDay(e.target.value)}
                    placeholder="15"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Payment Due Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={paymentDueDay}
                    onChange={(e) => setPaymentDueDay(e.target.value)}
                    placeholder="5"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-900/40"
                >
                  Save Credit Card
                </button>
              </div>
            </form>
          )}

          {/* List of Credit Cards */}
          {creditCardsList.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center space-y-2">
              <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">No Credit Cards Configured</p>
              <p className="text-[11px] text-slate-500">Add your credit cards to track billing cycles and limits.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {creditCardsList.map((card) => (
                <div
                  key={card.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center font-bold text-white shadow-md">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{card.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {card.institution} • {card.accountNumber}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span>Cycle: {card.billCycleDay || 15}th</span>
                        <span>•</span>
                        <span>Due: {card.paymentDueDate || 5}th</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-bold font-mono text-rose-400">
                        {formatCurrency(card.balance)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Limit: {formatCurrency(card.availableLimit || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditAccount(card)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(card.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LENDERS & BORROWERS (DEBT CONTACTS) */}
      {activeTab === 'lenders' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300">Lenders & Borrowers Directory</span>
              <p className="text-[10px] text-slate-400">Contacts for tracking loans and borrowed funds</p>
            </div>
            <button
              onClick={() => setIsAddingLender(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </button>
          </div>

          {/* Form to Add Lender Contact */}
          {isAddingLender && (
            <form onSubmit={handleSaveLender} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center justify-between">
                <span>Add Lender / Borrower Contact</span>
                <button
                  type="button"
                  onClick={() => setIsAddingLender(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={lenderPhone}
                    onChange={(e) => setLenderPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Relationship</label>
                  <select
                    value={lenderRelation}
                    onChange={(e) => setLenderRelation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Friend">Friend</option>
                    <option value="Family">Family</option>
                    <option value="Colleague">Colleague</option>
                    <option value="Business">Business / Client</option>
                    <option value="Bank">Bank / NBFC</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Notes / UPI ID</label>
                  <input
                    type="text"
                    value={lenderNotes}
                    onChange={(e) => setLenderNotes(e.target.value)}
                    placeholder="e.g. UPI: ramesh@okhdfc"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingLender(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/40"
                >
                  Save Contact
                </button>
              </div>
            </form>
          )}

          {/* List of Contacts */}
          {lenderContacts.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">No Lender / Borrower Contacts Yet</p>
              <p className="text-[11px] text-slate-500">
                Add frequent contacts here or add them directly in the Debts tab when lending or borrowing.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {lenderContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {contact.name}
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {contact.relationship || 'Contact'}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {contact.phone || 'No phone'} {contact.notes ? `• ${contact.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteLender(contact.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXPENSE CATEGORIES & TYPES */}
      {activeTab === 'categories' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300">Expense & Grocery Categories</span>
              <p className="text-[10px] text-slate-400">Configure expense heads for accurate budgeting</p>
            </div>
            <button
              onClick={() => setIsAddingCategory(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          </div>

          {/* Form to Add Category */}
          {isAddingCategory && (
            <form onSubmit={handleSaveCategory} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center justify-between">
                <span>Add Custom Category</span>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </h4>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">Category Name</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Milk & Dairy, Organic Grocery"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Type</label>
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <label className="text-[11px] text-slate-400">Badge Color:</label>
                <div className="flex items-center gap-2">
                  {['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewCatColor(col)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newCatColor === col ? 'scale-125 ring-2 ring-white' : 'opacity-70'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/40"
                >
                  Save Category
                </button>
              </div>
            </form>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.name.charAt(0)}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white leading-tight">{cat.name}</h5>
                    <span className="text-[9px] uppercase text-slate-400 font-mono">{cat.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: USER CONFIGURATION & SALARY */}
      {activeTab === 'user' && (
        <form onSubmit={handleSaveUserConfig} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-400" />
              User Profile & Monthly Salary Setup
            </span>
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">User Name</label>
              <input
                type="text"
                value={userConfig.userName}
                onChange={(e) => setUserConfig({ ...userConfig, userName: e.target.value })}
                placeholder="Nandkumar"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Monthly Take-Home Salary (₹)</label>
              <input
                type="number"
                value={userConfig.monthlySalary || ''}
                onChange={(e) =>
                  setUserConfig({ ...userConfig, monthlySalary: parseFloat(e.target.value) || 0 })
                }
                placeholder="e.g. 85000"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Salary / Month Start Day</label>
              <select
                value={userConfig.monthStartDay}
                onChange={(e) =>
                  setUserConfig({ ...userConfig, monthStartDay: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500"
              >
                {[1, 5, 10, 15, 20, 25, 28].map((day) => (
                  <option key={day} value={day}>
                    {day}th of every month
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={userConfig.currencySymbol}
                disabled
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300 font-bold"
              />
            </div>
          </div>

          {/* Reset / Purge Ledger Section */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 block">Clear Ledger Data</span>
              <p className="text-[10px] text-slate-500">Purge all transactions & debts to start fresh</p>
            </div>
            <button
              type="button"
              onClick={handleClearAllData}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 text-xs font-semibold active:scale-95 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Ledger</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 6: SECURITY & BIOMETRICS (WEBAUTHN API & PIN) */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* Biometric WebAuthn Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    Biometric Unlock
                    <span className="text-[9px] bg-indigo-600/20 text-indigo-300 font-semibold px-1.5 py-0.2 rounded border border-indigo-500/30">
                      WebAuthn API
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Fingerprint or Face Unlock</p>
                </div>
              </div>

              {/* Biometric Toggle Switch */}
              <button
                type="button"
                onClick={handleToggleBiometric}
                disabled={isBiometricProcessing}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  userConfig.enableBiometric ? 'bg-blue-600' : 'bg-slate-800'
                }`}
                title={userConfig.enableBiometric ? 'Disable Biometric Unlock' : 'Enable Biometric Unlock'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    userConfig.enableBiometric ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Uses the W3C Web Authentication API to authenticate directly with your phone's biometric hardware (fingerprint sensor or Face Unlock). Your biometric credentials stay safely encrypted inside your device.
            </p>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isBiometricSupported ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isBiometricSupported ? 'Biometric hardware supported' : 'Platform authenticator checking...'}
              </span>

              {userConfig.enableBiometric && (
                <button
                  type="button"
                  onClick={handleTestBiometric}
                  disabled={isBiometricProcessing}
                  className="px-2.5 py-1 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-700/60 text-sky-300 text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Fingerprint className="w-3 h-3 text-sky-400" />
                  <span>Test Sensor</span>
                </button>
              )}
            </div>
          </div>

          {/* PIN Security Card */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                PIN Security Configuration
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  savedPin !== '1234'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {savedPin !== '1234' ? '● Custom PIN Active' : '⚠ Factory Default 1234'}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {savedPin !== '1234'
                ? 'Your custom PIN is active. The factory default 1234 has been completely disabled. Only your custom PIN can unlock AuraSpend.'
                : 'Security Warning: You are currently using the factory default PIN (1234). Set your own 4-digit PIN below to secure your financial ledger.'}
            </p>

            <form onSubmit={handleUpdatePinSubmit} className="space-y-3 pt-2">
              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {/* Only prompt for current PIN if custom PIN was already set */}
              {savedPin !== '1234' && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Current PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={currentPinAttempt}
                    onChange={(e) => setCurrentPinAttempt(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">New 4-digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Confirm New PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-900/40 active:scale-98 transition-all"
              >
                Update Security PIN
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
