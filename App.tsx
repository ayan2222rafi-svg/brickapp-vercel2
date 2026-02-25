
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  PlusCircle,
  History,
  TrendingUp,
  Wallet,
  BrickWall,
  ArrowUpRight,
  ArrowDownRight,
  LogOut,
  Package,
  CircleDollarSign,
  ArrowLeft,
  Users,
  FileText,
  Truck,
  Calendar,
  Layers,
  HardHat,
  Calculator,
  UserPlus,
  Receipt,
  Search,
  Hash,
  User,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  X,
  Printer,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  Info,
  Banknote,
  Check,
  RotateCcw,
  LayoutDashboard,
  BarChart3,
  Database,
  Upload,
  Save,
  Eye,
  CalendarDays,
  Lock,
  UserCheck,
  ShieldAlert,
  KeyRound
} from 'lucide-react';
import html2canvas from 'html2canvas';

// --- Utils ---

/**
 * Returns YYYY-MM-DD format for a local date to avoid timezone offset issues
 * common with new Date().toISOString().split('T')[0]
 */
const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- Types ---

type Role = 'manager' | 'partner' | null;
type ManagerModule = 'HOME' | 'SALES' | 'LABOR' | 'EXPENSES' | 'REPORTS';
type ManagerAction = 'NONE' | 'NEW_MEMO' | 'PARTY_LIST' | 'DUE_REPORT' | 'SALES_INFO' | 'TODAY_SALES' | 'ADD_CONTRACTOR' | 'ADVANCE_ENTRY' | 'WORK_LOG' | 'NEW_EXPENSE' | 'EXPENSE_LEDGER' | 'LIVE_STOCK' | 'DAILY_SUMMARY' | 'PROFIT_LOSS' | 'DATA_BACKUP';

interface SaleItem {
  type: string;
  qty: number;
  rate: number;
}

interface Entry {
  id: string;
  type: 'SALE' | 'EXPENSE' | 'LABOR_ADVANCE' | 'LABOR_WORK' | 'PRODUCTION';
  paymentStatus?: 'CASH' | 'DUE';
  amount: number;
  paidAmount?: number;
  dueAmount?: number;
  isSettled?: boolean;
  description: string;
  category: string;
  items?: SaleItem[];
  challanNo?: number;
  vehicleNo?: string;
  customerName?: string;
  customerAddress?: string;
  contractorId?: string;
  timestamp: Date;
}

interface Customer {
  id: string;
  name: string;
  address: string;
}

const BRICK_TYPES = [
  '১ নং মেশিন',
  '২ নং মেশিন',
  '১ নং বাংলা',
  '২ নং বাংলা',
  'ঘুড়িয়া'
];

// --- Storage Keys ---
const STORAGE_KEYS = {
  ENTRIES: 'kiln_entries_v1',
  CUSTOMERS: 'kiln_customers_v1',
  ROLE: 'kiln_user_role',
  DEMO_START: 'kiln_demo_start_date',
  DEMO_UNLOCKED: 'kiln_demo_unlocked'
};

// --- Components ---

const BrickIcon = () => (
  <div className="grid grid-cols-4 gap-1 w-16 h-16 mb-6 mx-auto">
    {[...Array(16)].map((_, i) => (
      <div key={i} className="bg-red-500 rounded-sm h-2.5"></div>
    ))}
  </div>
);

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<Role>(() => {
    return localStorage.getItem(STORAGE_KEYS.ROLE) as Role || null;
  });
  const [module, setModule] = useState<ManagerModule>('HOME');
  const [action, setAction] = useState<ManagerAction>('NONE');
  const [lastSaved, setLastSaved] = useState<string>('');
  const [showDemoPopup, setShowDemoPopup] = useState(false);

  // Expiry State
  const [isAppExpired, setIsAppExpired] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  
  // Login State
  const [loginRole, setLoginRole] = useState<'manager' | 'partner'>('manager');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // FEATURE: Demo Expiry Logic
  useEffect(() => {
    const checkExpiry = () => {
      // 1. Check if already unlocked permanently
      const isUnlocked = localStorage.getItem(STORAGE_KEYS.DEMO_UNLOCKED) === 'true';
      if (isUnlocked) {
        setIsAppExpired(false);
        return;
      }

      // 2. Check/Set Start Date
      let startDateStr = localStorage.getItem(STORAGE_KEYS.DEMO_START);
      if (!startDateStr) {
        startDateStr = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.DEMO_START, startDateStr);
      }

      const startDate = new Date(startDateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 3. Expiry Check (7 Days)
      if (diffDays > 7) {
        setIsAppExpired(true);
      } else {
        setIsAppExpired(false);
      }
    };

    checkExpiry();
  }, []);

  const handleUnlockApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockPassword === '2145') {
      localStorage.setItem(STORAGE_KEYS.DEMO_UNLOCKED, 'true');
      setIsAppExpired(false);
      setUnlockError('');
    } else {
      setUnlockError('ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।');
    }
  };

  // Persistence Implementation with robust parsing
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map((e: any) => ({
        ...e,
        timestamp: new Date(e.timestamp)
      })) : [];
    } catch (err) {
      console.error("Critical: Failed to load entries", err);
      return [];
    }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Critical: Failed to load customers", err);
      return [];
    }
  });

  // Sync state to local storage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      setLastSaved(new Date().toLocaleTimeString('bn-BD'));
    } catch (e) { console.error("Save entries failed", e); }
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) { console.error("Save customers failed", e); }
  }, [customers]);

  useEffect(() => {
    if (userRole) {
      localStorage.setItem(STORAGE_KEYS.ROLE, userRole);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ROLE);
    }
  }, [userRole]);

  const [printingMemo, setPrintingMemo] = useState<Entry | null>(null);
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<Entry | null>(null);

  const goBack = () => {
    if (action !== 'NONE') {
      setAction('NONE');
    } else if (module !== 'HOME') {
      setModule('HOME');
    } else {
      // Allow going back to login screen from Home
      setUserRole(null);
      localStorage.removeItem(STORAGE_KEYS.ROLE);
    }
  };

  const handleLogout = () => {
    if (window.confirm("আপনি কি লগআউট করতে চান?")) {
      localStorage.removeItem(STORAGE_KEYS.ROLE);
      setUserRole(null);
      setModule('HOME');
      setAction('NONE');
      setUsername('');
      setPassword('');
      setAuthError('');
    }
  };

  const handleExportData = () => {
    const data = {
      entries,
      customers,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiln_backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("রিস্টোর করলে আপনার বর্তমান সব তথ্য মুছে যাবে। আপনি কি নিশ্চিত?")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.entries && Array.isArray(data.entries)) {
          setEntries(data.entries.map((ent: any) => ({ ...ent, timestamp: new Date(ent.timestamp) })));
          setCustomers(data.customers || []);
          alert("তথ্য সফলভাবে রিস্টোর হয়েছে!");
          setAction('NONE');
        } else {
          alert("ভুল ফাইল ফরম্যাট!");
        }
      } catch (err) {
        alert("ফাইল পড়তে সমস্যা হয়েছে।");
      }
    };
    reader.readAsText(file);
  };

  const stats = useMemo(() => {
    const sales = entries.filter(e => e.type === 'SALE').reduce((sum, e) => sum + (e.paidAmount || e.amount), 0);
    const expenses = entries.filter(e => e.type === 'EXPENSE').reduce((sum, e) => sum + e.amount, 0);
    const laborWorks = entries.filter(e => e.type === 'LABOR_WORK').reduce((sum, e) => sum + e.amount, 0);
    const laborAdvances = entries.filter(e => e.type === 'LABOR_ADVANCE').reduce((sum, e) => sum + e.amount, 0);
    
    return {
      totalSales: entries.filter(e => e.type === 'SALE').reduce((sum, e) => sum + e.amount, 0),
      totalExpenses: expenses + laborWorks,
      profit: entries.filter(e => e.type === 'SALE').reduce((sum, e) => sum + e.amount, 0) - (expenses + laborWorks),
      netCash: sales - expenses - laborAdvances
    };
  }, [entries]);

  const nextChallanNo = useMemo(() => {
    const sales = entries.filter(e => e.type === 'SALE');
    if (sales.length === 0) return 1001; 
    const maxChallan = Math.max(...sales.map(s => s.challanNo || 0));
    return maxChallan + 1;
  }, [entries]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (loginRole === 'partner') {
      setUserRole('partner');
      setModule('HOME');
      setAction('NONE');
      setShowDemoPopup(true); 
      return;
    }

    // Manager validation
    if (username === 'asif2222' && password === 'open1234') {
      setUserRole('manager');
      setModule('HOME');
      setAction('NONE');
      setShowDemoPopup(true); 
    } else {
      setAuthError('ইউজারনেম বা পাসওয়ার্ড সঠিক নয়!');
    }
  };

  const handleMarkPaid = (id: string) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        return {
          ...entry,
          isSettled: true,
          dueAmount: 0,
          paymentStatus: 'CASH',
        };
      }
      return entry;
    }));
  };

  const handleUndoPaid = (id: string) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        const originalDue = entry.amount - (entry.paidAmount || 0);
        return {
          ...entry,
          isSettled: false,
          dueAmount: originalDue,
          paymentStatus: originalDue > 0 ? 'DUE' : 'CASH',
        };
      }
      return entry;
    }));
  };

  // FEATURE: Full Screen Lock Expiry UI
  if (isAppExpired) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-6 z-[9999]">
        <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 animate-pulse">
            <ShieldAlert className="w-12 h-12" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-2xl font-black text-slate-800">Demo expired.</h1>
            <p className="text-slate-500 font-bold leading-relaxed">
              আপনার ডেমো ব্যবহারের সময় শেষ হয়ে গেছে। দয়া করে ডেভেলপারের সাথে যোগাযোগ করুন।
            </p>
          </div>

          <form onSubmit={handleUnlockApp} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="password" 
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-50 p-5 pl-12 rounded-2xl text-lg font-mono tracking-widest border-2 border-transparent focus:border-blue-500 outline-none transition-all"
                required
              />
            </div>
            
            {unlockError && (
              <p className="text-red-500 text-sm font-bold animate-shake">{unlockError}</p>
            )}

            <button 
              type="submit"
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
            >
              Unlock App
            </button>
          </form>

          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Hardware ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
          </p>
        </div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 animate-in fade-in zoom-in duration-500 overflow-hidden relative">
          
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-green-500 to-slate-900"></div>

          <div className="text-center mb-8">
            <BrickIcon />
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">ব্রিক ফিল্ড ব্যবস্থাপনা</h1>
            <p className="text-slate-500 text-sm font-medium">সহজ, নিরাপদ ও স্বচ্ছ হিসাব সিস্টেম</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">অ্যাকাউন্ট টাইপ (Select Role)</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => { setLoginRole('manager'); setAuthError(''); }}
                  className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${loginRole === 'manager' ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
                >
                  <HardHat className="w-5 h-5" /> ম্যানেজার
                </button>
                <button 
                  type="button"
                  onClick={() => { setLoginRole('partner'); setAuthError(''); }}
                  className={`py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${loginRole === 'partner' ? 'bg-[#2ecc71] text-white shadow-lg shadow-green-500/20' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}
                >
                  <Users className="w-5 h-5" /> পার্টনার
                </button>
              </div>
            </div>

            {loginRole === 'manager' && (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ইউজারনেম (Username)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="আপনার ইউজারনেম"
                      className="w-full bg-slate-50 p-4 pl-12 rounded-2xl text-sm border-none outline-none focus:ring-2 focus:ring-slate-200 transition-all font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">পাসওয়ার্ড (Password)</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="আপনার পাসওয়ার্ড"
                      className="w-full bg-slate-50 p-4 pl-12 rounded-2xl text-sm border-none outline-none focus:ring-2 focus:ring-slate-200 transition-all font-bold"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {loginRole === 'partner' && (
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100 animate-in fade-in duration-300">
                <p className="text-green-700 text-xs font-bold leading-relaxed flex gap-2">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  পার্টনার হিসেবে লগইন করার জন্য কোনো ইউজারনেম বা পাসওয়ার্ড প্রয়োজন নেই। সরাসরি লগইন বাটনে ক্লিক করুন।
                </p>
              </div>
            )}

            {authError && (
              <p className="text-red-500 text-xs font-black text-center bg-red-50 py-3 rounded-xl animate-bounce">
                {authError}
              </p>
            )}

            <button 
              type="submit" 
              className={`w-full py-5 rounded-2xl text-xl font-bold text-white shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${loginRole === 'manager' ? 'bg-slate-800 shadow-slate-900/20' : 'bg-[#2ecc71] shadow-green-500/20'}`}
            >
              <UserCheck className="w-6 h-6" /> লগইন করুন (Login)
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-4 flex items-center gap-3 shadow-sm">
        <button onClick={goBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900 leading-tight">ব্রিক ফিল্ড ব্যবস্থাপনা</h1>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">
            অ্যাকাউন্ট: {userRole === 'manager' ? 'ম্যানেজার' : 'পার্টনার'}
          </p>
        </div>
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold border border-red-100 active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </header>

      <main className="max-w-xl mx-auto p-6">
        {userRole === 'manager' && module === 'HOME' && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
            <MenuCard title="ইট বিক্রয় (Sales)" icon={Receipt} color="bg-green-50 text-green-600" onClick={() => setModule('SALES')} />
            <MenuCard 
              title={<span>শ্রমিক ও মাঝি হিসাব <span className="text-red-500 font-bold">(Not confirmed)</span></span>} 
              icon={HardHat} 
              color="bg-orange-50 text-orange-600" 
              onClick={() => setModule('LABOR')} 
            />
            <MenuCard 
              title={<span>ব্যয় ও খরচ <span className="text-red-500 font-bold">(Not confirmed)</span></span>} 
              icon={CircleDollarSign} 
              color="bg-red-50 text-red-600" 
              onClick={() => setModule('EXPENSES')} 
            />
            <MenuCard 
              title={<span>স্টক ও রিপোর্ট <span className="text-red-500 font-bold">(Not confirmed)</span></span>} 
              icon={LayoutDashboard} 
              color="bg-blue-50 text-blue-600" 
              onClick={() => setModule('REPORTS')} 
            />
          </div>
        )}

        {userRole === 'partner' && module === 'HOME' && action === 'NONE' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="grid grid-cols-2 gap-4">
                <SummaryItem title="মোট বিক্রি" value={stats.totalSales} color="text-green-600" icon={ArrowUpRight} />
                <SummaryItem title="মোট খরচ" value={stats.totalExpenses} color="text-red-600" icon={ArrowDownRight} />
             </div>
             
             <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl">
                <p className="text-slate-400 text-sm font-medium mb-1">নিট লাভ/ক্ষতি</p>
                <h3 className="text-4xl font-bold">{stats.profit.toLocaleString('bn-BD')} ৳</h3>
                <div className="mt-6 pt-6 border-t border-white/10 flex justify-between">
                   <div>
                      <p className="text-[10px] text-slate-400 uppercase">নগদ তহবিল</p>
                      <p className="font-bold text-green-400">{stats.netCash.toLocaleString('bn-BD')} ৳</p>
                   </div>
                   <TrendingUp className="text-green-400 w-8 h-8 opacity-20" />
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4 mt-6">
                <h4 className="font-bold text-slate-800 text-lg ml-2">তদারকি অপশন</h4>
                <ActionButton title="আজকের বিক্রি (Today's Sales)" icon={Clock} onClick={() => setAction('TODAY_SALES')} />
                <ActionButton title="বকেয়া রিপোর্ট (Due Report)" icon={FileText} onClick={() => setAction('DUE_REPORT')} />
                <ActionButton title="বিক্রি তথ্য (Sales Information)" icon={History} onClick={() => setAction('SALES_INFO')} />
             </div>
          </div>
        )}

        {module === 'SALES' && action === 'NONE' && userRole === 'manager' && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <h2 className="text-xl font-bold mb-4">ইট বিক্রয় (Sales)</h2>
            <ActionButton title="নতুন মেমো (New Memo)" icon={PlusCircle} onClick={() => setAction('NEW_MEMO')} />
            <ActionButton title="আজকের বিক্রি (Today's Sales)" icon={Clock} onClick={() => setAction('TODAY_SALES')} />
            <ActionButton title="বিক্রি তথ্য (Sales Information)" icon={History} onClick={() => setAction('SALES_INFO')} />
            <ActionButton title="পার্টি তালিকা (Party List)" icon={Users} onClick={() => setAction('PARTY_LIST')} />
            <ActionButton title="বকেয়া রিপোর্ট (Due Report)" icon={FileText} onClick={() => setAction('DUE_REPORT')} />
          </div>
        )}

        {action === 'NEW_MEMO' && userRole === 'manager' && <SalesForm 
            nextChallan={nextChallanNo} 
            customers={customers}
            onSave={(e) => { setEntries([e, ...entries]); setAction('NONE'); }}
            onPreview={setPrintingMemo}
        />}
        {action === 'SALES_INFO' && <SalesInformation entries={entries} onViewDetail={setSelectedDetailEntry} />}
        {action === 'TODAY_SALES' && <DailySalesView entries={entries} onViewDetail={setSelectedDetailEntry} />}
        {action === 'PARTY_LIST' && <PartyListView customers={customers} onAddCustomer={(c) => setCustomers([c, ...customers])} />}
        {action === 'DUE_REPORT' && <DueReportView 
          entries={entries} 
          userRole={userRole}
          onViewDetail={setSelectedDetailEntry} 
          onMarkPaid={handleMarkPaid} 
          onUndoPaid={handleUndoPaid} 
        />}

        {userRole === 'manager' && (
          <>
            {module === 'LABOR' && action === 'NONE' && (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                <h2 className="text-xl font-bold mb-4">শ্রমিক ও মাঝি হিসাব</h2>
                <ActionButton title="নতুন মাঝি যোগ করুন (Add Contractor)" icon={UserPlus} onClick={() => setAction('ADD_CONTRACTOR')} />
                <ActionButton title="দাদন/অগ্রিম এন্ট্রি (Advance Entry)" icon={Wallet} onClick={() => setAction('ADVANCE_ENTRY')} />
              </div>
            )}
            {action === 'ADVANCE_ENTRY' && <LaborAdvanceForm onSave={(e) => { setEntries([e, ...entries]); setAction('NONE'); }} />}

            {module === 'EXPENSES' && action === 'NONE' && (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                <h2 className="text-xl font-bold mb-4">ব্যয় ও খরচ (Expenses)</h2>
                <ActionButton title="নতুন খরচ যোগ করুন (New Expense)" icon={PlusCircle} onClick={() => setAction('NEW_EXPENSE')} />
              </div>
            )}
            {action === 'NEW_EXPENSE' && <ExpenseForm onSave={(e) => { setEntries([e, ...entries]); setAction('NONE'); }} />}

            {module === 'REPORTS' && action === 'NONE' && (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                <h2 className="text-xl font-bold mb-4">স্টক ও রিপোর্ট (Stock & Reports)</h2>
                <ActionButton title="আজকের সারসংক্ষেপ (Daily Summary)" icon={TrendingUp} onClick={() => setAction('DAILY_SUMMARY')} />
                <ActionButton title="লাভ-ক্ষতি রিপোর্ট (Profit & Loss)" icon={Calculator} onClick={() => setAction('PROFIT_LOSS')} />
                <ActionButton title="ডেটা ব্যাকআপ ও রিস্টোর (Data Backup)" icon={Database} onClick={() => setAction('DATA_BACKUP')} />
              </div>
            )}

            {action === 'DATA_BACKUP' && (
              <div className="bg-white p-8 rounded-[40px] shadow-lg space-y-8 animate-in slide-in-from-bottom-6">
                <div className="flex items-center gap-4 mb-2">
                   <div className="p-4 bg-blue-50 rounded-2xl text-blue-600"><Database className="w-8 h-8" /></div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight">রিস্টোর পয়েন্ট (Checkpoint)</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">তথ্য নিরাপদ রাখুন</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Save className="w-4 h-4" /></div>
                         <p className="text-sm font-black text-slate-700">বর্তমান তথ্যের ব্যাকআপ নিন</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">আপনার সব এন্ট্রি এবং কাস্টমার তালিকা একটি ফাইলে ডাউনলোড করে রাখুন।</p>
                      <button 
                        onClick={handleExportData}
                        className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                         <Download className="w-5 h-5" /> ব্যাকআপ ডাউনলোড করুন
                      </button>
                   </div>

                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Upload className="w-4 h-4" /></div>
                         <p className="text-sm font-black text-slate-700">পুরানো ব্যাকআপ রিস্টোর করুন</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">আগের কোনো ব্যাকআপ ফাইল সিলেক্ট করে তথ্য ফিরিয়ে আনুন।</p>
                      <label className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
                         <Database className="w-5 h-5" /> ব্যাকআপ ফাইল সিলেক্ট করুন
                         <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                      </label>
                   </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Persistence Status Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 px-6 py-3 flex flex-col items-center justify-center gap-1 z-[100]">
         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ডেটা সংরক্ষিত (Local Storage)</span>
            </div>
            {lastSaved && <span className="text-slate-300">•</span>}
            {lastSaved && <span>সর্বশেষ সেভ: {lastSaved}</span>}
         </div>
         {/* FEATURE 2: Demo Watermark */}
         <div className="text-[10px] text-slate-300 font-medium select-none">
            Demo version – Testing only
         </div>
      </footer>

      {/* FEATURE 1: Demo Popup Dialog */}
      {showDemoPopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-orange-50 rounded-full text-orange-600">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">ডেমো সতর্কবার্তা</h3>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">
                এটি শুধুমাত্র পরীক্ষামূলক (ডেমো) ব্যবহারের জন্য দেওয়া একটি APK।<br/>
                কিছু ফিচার সীমিত রাখা হয়েছে।<br/>
                যেকোনো সময় ডাটা রিসেট হতে পারে।
              </p>
              <button 
                onClick={() => setShowDemoPopup(false)}
                className="w-full mt-4 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl active:scale-95 transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDetailEntry && <DetailModal entry={selectedDetailEntry} onClose={() => setSelectedDetailEntry(null)} onPrint={() => { setPrintingMemo(selectedDetailEntry); setSelectedDetailEntry(null); }} />}
      {printingMemo && <PrintModal memo={printingMemo} onClose={() => setPrintingMemo(null)} />}
    </div>
  );
};

// --- Sub-components ---

const MenuCard = ({ title, icon: Icon, color, onClick }: { title: React.ReactNode, icon: any, color: string, onClick: () => void }) => (
  <button onClick={onClick} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center gap-4 transition-all active:scale-95 text-center">
    <div className={`p-4 rounded-2xl ${color}`}><Icon className="w-8 h-8" /></div>
    <span className="text-sm font-bold text-slate-700">{title}</span>
  </button>
);

const ActionButton = ({ title, icon: Icon, onClick }: any) => (
  <button onClick={onClick} className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group active:scale-[0.98] transition-all">
    <div className="flex items-center gap-4">
      <div className="bg-slate-50 p-3 rounded-xl group-hover:bg-orange-50 transition-colors"><Icon className="w-5 h-5 text-slate-500 group-hover:text-orange-600" /></div>
      <span className="font-bold text-slate-700">{title}</span>
    </div>
    <ArrowUpRight className="w-5 h-5 text-slate-300" />
  </button>
);

const SummaryItem = ({ title, value, color, icon: Icon }: any) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <div className="p-2 bg-slate-50 rounded-lg"><Icon className={`w-4 h-4 ${color}`} /></div>
    </div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
    <p className={`text-xl font-bold ${color}`}>{value.toLocaleString('bn-BD')} ৳</p>
  </div>
);

const DetailModal = ({ entry, onClose, onPrint }: { entry: Entry, onClose: () => void, onPrint: () => void }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl animate-in slide-in-from-bottom-10 duration-300 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Info className="w-5 h-5 text-blue-600" /> অর্ডার বিবরণ
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-between items-start">
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">মেমো নম্বর</p>
                <p className="text-lg font-black text-slate-900">#{entry.challanNo || 'N/A'}</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">তারিখ ও সময়</p>
                <p className="text-sm font-bold text-slate-800">{entry.timestamp.toLocaleDateString('bn-BD')}</p>
                <p className="text-[10px] text-slate-400 font-bold">{entry.timestamp.toLocaleTimeString('bn-BD')}</p>
             </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
             <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm"><User className="w-4 h-4 text-slate-400" /></div>
                <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase">ক্রেতার নাম</p>
                   <p className="text-sm font-black text-slate-800">{entry.customerName || 'অজানা'}</p>
                </div>
             </div>
             {entry.vehicleNo && (
                <div className="flex items-center gap-3">
                   <div className="bg-white p-2 rounded-lg shadow-sm"><Truck className="w-4 h-4 text-slate-400" /></div>
                   <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">গাড়ি নম্বর (GARI NO)</p>
                      <p className="text-xs font-bold text-slate-600">{entry.vehicleNo}</p>
                   </div>
                </div>
             )}
             <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg shadow-sm"><MapPin className="w-4 h-4 text-slate-400" /></div>
                <div>
                   <p className="text-[8px] font-bold text-slate-400 uppercase">ঠিকানা</p>
                   <p className="text-xs font-bold text-slate-600">{entry.customerAddress || 'নেই'}</p>
                </div>
             </div>
          </div>

          <div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">পণ্যের বিবরণ</p>
             <div className="space-y-2">
                {entry.items?.map((item, idx) => (
                   <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl">
                      <div>
                         <p className="text-sm font-black text-slate-800">{item.type}</p>
                         <p className="text-[10px] font-bold text-slate-400">{item.qty.toLocaleString('bn-BD')} টি @ {item.rate} ৳</p>
                      </div>
                      <p className="font-black text-slate-900">{(item.qty * item.rate).toLocaleString('bn-BD')} ৳</p>
                   </div>
                ))}
             </div>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-2">
             <div className="flex justify-between items-center">
                <p className="text-sm font-bold text-slate-400">মোট মূল্য</p>
                <p className="text-lg font-black text-slate-900">{entry.amount.toLocaleString('bn-BD')} ৳</p>
             </div>
             <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-800 tracking-tight">অবশিষ্ট বকেয়া</p>
                <p className="text-xl font-black text-red-600">{(entry.dueAmount || 0).toLocaleString('bn-BD')} ৳</p>
             </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex gap-3">
           <button onClick={onClose} className="flex-1 py-4 bg-white text-slate-600 rounded-2xl font-black border border-slate-200 active:scale-95 transition-all">বন্ধ করুন</button>
           <button onClick={onPrint} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
              <Printer className="w-5 h-5" /> মেমো প্রিন্ট
           </button>
        </div>
      </div>
    </div>
  );
};

const DueReportView = ({ entries, userRole, onViewDetail, onMarkPaid, onUndoPaid }: { entries: Entry[], userRole: Role, onViewDetail: (e: Entry) => void, onMarkPaid: (id: string) => void, onUndoPaid: (id: string) => void }) => {
  const [search, setSearch] = useState('');

  const dueEntries = useMemo(() => {
    return entries.filter(e => e.type === 'SALE' && ( (e.paymentStatus === 'DUE' && (e.dueAmount || 0) > 0) || e.isSettled ))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [entries]);

  const filteredDueEntries = useMemo(() => {
    if (!search) return dueEntries;
    const lowerSearch = search.toLowerCase();
    return dueEntries.filter(e => 
      e.customerName?.toLowerCase().includes(lowerSearch) || 
      e.challanNo?.toString().includes(lowerSearch)
    );
  }, [dueEntries, search]);

  const totalDue = useMemo(() => dueEntries.reduce((sum, e) => sum + (e.dueAmount || 0), 0), [dueEntries]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <div className="bg-red-600 p-8 rounded-[40px] text-white shadow-xl">
        <p className="text-red-100 text-sm font-medium mb-1">মোট বকেয়া পরিমাণ</p>
        <h3 className="text-4xl font-bold">{totalDue.toLocaleString('bn-BD')} ৳</h3>
        <div className="mt-6 flex items-center gap-2">
           <AlertCircle className="w-5 h-5 opacity-50" />
           <p className="text-xs text-red-100">{dueEntries.filter(e => !e.isSettled).length} টি বকেয়া মেমো পাওয়া গেছে</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="নাম বা মেমো নং দিয়ে খুঁজুন..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="w-full bg-white p-4 pl-12 rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-red-500/20" 
        />
      </div>

      <div className="space-y-3">
        {filteredDueEntries.length === 0 ? (
          <div className="bg-white p-12 rounded-[40px] text-center border border-slate-100">
            {search ? (
              <>
                <Search className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                <p className="text-slate-400 font-bold italic">ম্যাচিং কোনো মেমো পাওয়া যায়নি</p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-12 h-12 text-green-100 mx-auto mb-4" />
                <p className="text-slate-400 font-bold italic">কোনো বকেয়া পাওনা নেই</p>
              </>
            )}
          </div>
        ) : (
          filteredDueEntries.map(e => (
            <div key={e.id} className={`bg-white p-5 rounded-[32px] border-l-4 ${e.isSettled ? 'border-green-500 opacity-90' : 'border-red-500'} shadow-sm flex flex-col gap-4 group relative overflow-hidden transition-all duration-300`}>
              
              {e.isSettled && (
                <div className="absolute right-[-20px] top-[10px] rotate-[25deg] pointer-events-none z-10 animate-in zoom-in duration-300">
                   <div className="border-4 border-green-600/30 rounded-lg px-4 py-1 text-green-600/40 text-2xl font-black uppercase tracking-widest select-none">
                      PAID
                   </div>
                </div>
              )}

              <div className="flex items-center justify-between cursor-pointer" onClick={() => onViewDetail(e)}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-red-50">#{e.challanNo}</span>
                     <h4 className={`font-bold ${e.isSettled ? 'text-slate-500 line-through decoration-green-500/50' : 'text-slate-800'}`}>{e.customerName}</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{e.timestamp.toLocaleDateString('bn-BD')}</p>
                </div>
                <div className="text-right">
                   <p className={`text-lg font-bold ${e.isSettled ? 'text-green-600' : 'text-red-600'}`}>
                      {e.isSettled ? 'পরিশোধিত' : `${(e.dueAmount || 0).toLocaleString('bn-BD')} ৳`}
                   </p>
                </div>
              </div>
              
              {userRole === 'manager' && (
                e.isSettled ? (
                  <button 
                    onClick={() => onUndoPaid(e.id)}
                    className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-sm hover:bg-slate-200"
                  >
                    <RotateCcw className="w-4 h-4" /> ভুল হয়েছে? ফিরে যান (Undo)
                  </button>
                ) : (
                  <button 
                    onClick={() => onMarkPaid(e.id)}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/10 active:scale-95 transition-all text-sm hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" /> পরিশোধিত করুন (Mark Paid)
                  </button>
                )
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PartyListView = ({ customers, onAddCustomer }: { customers: Customer[], onAddCustomer: (c: Customer) => void }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const sortedCustomers = useMemo(() => {
    return [...customers]
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.address.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, search]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">পার্টি তালিকা</h2>
        <button onClick={() => setShowAdd(true)} className="bg-green-600 text-white p-4 rounded-2xl shadow-lg shadow-green-500/20 active:scale-95 transition-all">
          <Plus className="w-6 h-6" />
        </button>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
        <input type="text" placeholder="পার্টি খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white p-4 pl-12 rounded-2xl border border-slate-100 shadow-sm outline-none focus:ring-2 focus:ring-green-500/20" />
      </div>
      <div className="space-y-3">
        {sortedCustomers.map(c => (
          <div key={c.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-slate-50 p-3 rounded-2xl"><User className="w-6 h-6 text-slate-400" /></div>
              <div>
                <h4 className="font-bold text-slate-800">{c.name}</h4>
                <p className="text-[10px] text-slate-400">{c.address}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-200" />
          </div>
        ))}
      </div>
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">নতুন পার্টি যোগ করুন</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-6 h-6 text-slate-400" /></button>
            </div>
            <form onSubmit={(e: any) => {
              e.preventDefault();
              onAddCustomer({ id: Date.now().toString(), name: e.target.name.value, address: e.target.address.value });
              setShowAdd(false);
            }} className="space-y-5">
              <input name="name" placeholder="পার্টির নাম" className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none" required />
              <input name="address" placeholder="ঠিকানা" className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none" required />
              <button type="submit" className="w-full bg-green-600 text-white py-5 rounded-2xl font-bold">সেভ করুন</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DailySalesView = ({ entries, onViewDetail }: { entries: Entry[], onViewDetail: (e: Entry) => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const daySales = useMemo(() => {
    const targetDateStr = getLocalDateString(currentDate);
    return entries.filter(e => e.type === 'SALE' && getLocalDateString(e.timestamp) === targetDateStr)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [entries, currentDate]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
         <button onClick={handlePrevDay} className="p-3 hover:bg-slate-100 rounded-full transition-all active:scale-90 text-slate-400">
            <ChevronLeft className="w-6 h-6" />
         </button>
         <div className="text-center">
            <h4 className="font-black text-slate-800">{currentDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">দিনের বিক্রি</p>
         </div>
         <button onClick={handleNextDay} className="p-3 hover:bg-slate-100 rounded-full transition-all active:scale-90 text-slate-400">
            <ChevronRight className="w-6 h-6" />
         </button>
      </div>
      <div className="space-y-3">
        {daySales.length === 0 ? (
          <div className="bg-white p-12 rounded-[40px] text-center border border-slate-100">
             <CalendarDays className="w-12 h-12 text-slate-100 mx-auto mb-4" />
             <p className="text-slate-400 font-bold italic">এই দিনে কোনো বিক্রি হয়নি</p>
          </div>
        ) : (
          daySales.map(s => (
            <div key={s.id} onClick={() => onViewDetail(s)} className={`bg-white p-5 rounded-[32px] border-l-4 ${s.paymentStatus === 'DUE' ? 'border-red-500' : 'border-green-500'} cursor-pointer active:scale-[0.98] transition-all shadow-sm`}>
              <div className="flex justify-between items-start">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-bold bg-slate-50 px-2 py-0.5 rounded-full">#{s.challanNo}</span>
                       <h4 className="font-bold text-slate-900">{s.customerName}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{s.timestamp.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}</p>
                 </div>
                 <div className="text-right">
                    <p className="font-black text-green-600">{s.amount.toLocaleString('bn-BD')} ৳</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{s.items?.[0]?.qty.toLocaleString('bn-BD')} টি ইট</p>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SalesInformation = ({ entries, onViewDetail }: { entries: Entry[], onViewDetail: (e: Entry) => void }) => {
  const [startDate, setStartDate] = useState(getLocalDateString(new Date()));
  const [endDate, setEndDate] = useState(getLocalDateString(new Date()));

  const setRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(getLocalDateString(start));
    setEndDate(getLocalDateString(end));
  };

  const filteredSales = useMemo(() => {
    return entries.filter(e => {
      if (e.type !== 'SALE') return false;
      const dateStr = getLocalDateString(e.timestamp);
      return dateStr >= startDate && dateStr <= endDate;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [entries, startDate, endDate]);

  const summary = useMemo(() => {
    let totalBricks = 0;
    let totalAmount = 0;
    const uniqueParties = new Set<string>();
    
    filteredSales.forEach(sale => {
      totalAmount += sale.amount;
      if (sale.customerName) uniqueParties.add(sale.customerName);
      sale.items?.forEach(item => {
        totalBricks += item.qty;
      });
    });
    return { totalBricks, totalAmount, totalParties: uniqueParties.size };
  }, [filteredSales]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 space-y-4">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">সময়সীমা নির্বাচন করুন</label>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 group">
             <p className="text-[9px] font-bold text-slate-400 uppercase ml-1 group-focus-within:text-slate-800 transition-colors">শুরু (Start)</p>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="w-full bg-slate-50 p-3 pl-9 rounded-xl text-sm font-bold border-none outline-none focus:ring-1 focus:ring-slate-200 transition-all" 
                />
             </div>
          </div>
          <div className="space-y-1 group">
             <p className="text-[9px] font-bold text-slate-400 uppercase ml-1 group-focus-within:text-slate-800 transition-colors">শেষ (End)</p>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="w-full bg-slate-50 p-3 pl-9 rounded-xl text-sm font-bold border-none outline-none focus:ring-1 focus:ring-slate-200 transition-all" 
                />
             </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
           <button onClick={() => setRange(0)} className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black text-slate-600 transition-all active:scale-95 uppercase">আজকের (Today)</button>
           <button onClick={() => setRange(7)} className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black text-slate-600 transition-all active:scale-95 uppercase">গত ৭ দিন (7 Days)</button>
           <button onClick={() => setRange(30)} className="whitespace-nowrap px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black text-slate-600 transition-all active:scale-95 uppercase">গত ৩০ দিন (30 Days)</button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden group">
         <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-700">
            <BarChart3 className="w-32 h-32" />
         </div>
         <div className="relative z-10 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">মোট ইটের সংখ্যা</p>
                 <h3 className="text-2xl font-black">{summary.totalBricks.toLocaleString('bn-BD')} টি</h3>
              </div>
              <div className="text-right">
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">মোট বিক্রয় মূল্য</p>
                 <h3 className="text-2xl font-black text-green-400">{summary.totalAmount.toLocaleString('bn-BD')} ৳</h3>
              </div>
            </div>
            <div className="pt-6 border-t border-white/10">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg"><Users className="w-4 h-4 text-blue-400" /></div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">মোট কাস্টমার/পার্টি</p>
                    <h3 className="text-lg font-black text-blue-400">{summary.totalParties.toLocaleString('bn-BD')} জন</h3>
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-slate-500 ml-2 uppercase tracking-widest">বিস্তারিত তালিকা ({filteredSales.length})</h4>
        {filteredSales.length === 0 ? (
          <div className="bg-white p-12 rounded-[40px] text-center border border-slate-100">
             <Search className="w-12 h-12 text-slate-100 mx-auto mb-4" />
             <p className="text-slate-400 font-bold italic">এই সময়ে কোনো বিক্রয় তথ্য পাওয়া যায়নি</p>
          </div>
        ) : (
          filteredSales.map(s => (
            <div key={s.id} onClick={() => onViewDetail(s)} className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-50 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="bg-green-50 p-3 rounded-2xl group-hover:bg-green-100 transition-colors">
                   <Receipt className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-black text-slate-800">#{s.challanNo} - {s.customerName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    {s.timestamp.toLocaleDateString('bn-BD')} • {s.description.split(' ')[0]}
                  </p>
                </div>
              </div>
              <div className="text-right">
                 <p className="font-black text-slate-900">{s.amount.toLocaleString('bn-BD')} ৳</p>
                 <p className="text-[10px] text-slate-400 font-bold">
                    {s.items?.reduce((sum, i) => sum + i.qty, 0).toLocaleString('bn-BD')} টি
                 </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SalesForm = ({ nextChallan, customers, onSave, onPreview }: { nextChallan: number, customers: Customer[], onSave: (e: Entry) => void, onPreview: (e: Entry) => void }) => {
  const [date, setDate] = useState(getLocalDateString(new Date()));
  const [challanNo, setChallanNo] = useState(nextChallan);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number | string>('');
  const [brickType, setBrickType] = useState(BRICK_TYPES[0]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const total = useMemo(() => qty * rate, [qty, rate]);
  const due = useMemo(() => total - (Number(paidAmount) || 0), [total, paidAmount]);

  const filteredCustomers = useMemo(() => {
    if (!customerName || !showSuggestions) return [];
    const search = customerName.toLowerCase();
    return customers.filter(c => c.name.toLowerCase().includes(search)).slice(0, 5);
  }, [customerName, customers, showSuggestions]);

  const handleSelectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerAddress(c.address);
    setShowSuggestions(false);
  };

  const constructEntry = (): Entry => {
    const currentPaid = Number(paidAmount) || 0;
    const finalDue = total - currentPaid;
    return {
        id: Date.now().toString(),
        type: 'SALE',
        paymentStatus: finalDue > 0 ? 'DUE' : 'CASH',
        amount: total,
        paidAmount: currentPaid,
        dueAmount: finalDue,
        description: `${brickType} বিক্রয়`,
        category: 'বিক্রয়',
        items: [{ type: brickType, qty, rate }],
        challanNo: challanNo,
        customerName: customerName || 'খসড়া ক্রেতা',
        customerAddress: customerAddress,
        vehicleNo: vehicleNo,
        timestamp: new Date(date)
    };
  };

  const handleSave = () => {
    if (!customerName || !qty || !rate) {
        alert("দয়া করে প্রয়োজনীয় সব তথ্য পূরণ করুন");
        return;
    }
    onSave(constructEntry());
  };

  const handlePreview = () => {
    onPreview(constructEntry());
  };

  return (
    <div className="bg-white rounded-[40px] shadow-sm p-6 space-y-8 animate-in slide-in-from-bottom-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">চালান নং</label>
          <div className="relative">
             <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="number" 
               value={challanNo} 
               onChange={(e) => setChallanNo(Number(e.target.value))} 
               className="w-full bg-slate-50 p-4 pl-10 rounded-2xl text-sm font-bold border-none outline-none focus:ring-1 focus:ring-slate-200" 
             />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">তারিখ</label>
          <div className="relative">
             <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
             <input 
               type="date" 
               value={date} 
               onChange={(e) => setDate(e.target.value)} 
               className="w-full bg-slate-50 p-4 pl-10 rounded-2xl text-sm border-none outline-none focus:ring-1 focus:ring-slate-200" 
             />
          </div>
        </div>
      </div>

      <div className="space-y-2 relative">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ক্রেতার নাম</label>
        <div className="relative">
           <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input 
             type="text" 
             placeholder="ক্রেতার নাম লিখুন" 
             value={customerName} 
             autoComplete="off"
             onFocus={() => setShowSuggestions(true)}
             onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
             onChange={(e) => {
               setCustomerName(e.target.value);
               setShowSuggestions(true);
             }} 
             className="w-full bg-slate-50 p-4 pl-10 rounded-2xl text-sm border-none outline-none focus:ring-1 focus:ring-slate-200" 
             required 
           />
        </div>
        
        {/* Suggestions Dropdown */}
        {showSuggestions && filteredCustomers.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden z-[200] animate-in fade-in slide-in-from-top-2">
            {filteredCustomers.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelectCustomer(c)}
                className="w-full flex flex-col items-start gap-0.5 p-4 text-left hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors"
              >
                <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                <span className="text-[10px] text-slate-400 uppercase font-medium">{c.address}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ঠিকানা</label>
        <div className="relative">
           <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input 
             type="text" 
             placeholder="ঠিকানা লিখুন" 
             value={customerAddress} 
             onChange={(e) => setCustomerAddress(e.target.value)} 
             className="w-full bg-slate-50 p-4 pl-10 rounded-2xl text-sm border-none outline-none focus:ring-1 focus:ring-slate-200" 
           />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">গাড়ি নং (GARI NO)</label>
        <div className="relative">
           <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input 
             type="text" 
             placeholder="যেমন: ঢাকা-মেট্রো ১১-২২৩৩" 
             value={vehicleNo} 
             onChange={(e) => setVehicleNo(e.target.value)} 
             className="w-full bg-slate-50 p-4 pl-10 rounded-2xl text-sm border-none outline-none focus:ring-1 focus:ring-slate-200" 
           />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ইটের ধরণ (BRICK TYPE)</label>
        <select 
          value={brickType} 
          onChange={(e) => setBrickType(e.target.value)} 
          className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold border-none outline-none focus:ring-1 focus:ring-slate-200 appearance-none"
        >
          {BRICK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">ইটের সংখ্যা (QTY)</label>
          <input 
            type="number" 
            placeholder="0" 
            value={qty || ''}
            onChange={(e) => setQty(Number(e.target.value))} 
            className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold border-none outline-none focus:ring-1 focus:ring-slate-200" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">দর (RATE)</label>
          <input 
            type="number" 
            placeholder="0.00" 
            value={rate || ''}
            onChange={(e) => setRate(Number(e.target.value))} 
            className="w-full bg-slate-50 p-4 rounded-2xl text-sm font-bold border-none outline-none focus:ring-1 focus:ring-slate-200" 
          />
        </div>
      </div>

      <div className="bg-[#F8FAFC] rounded-[32px] p-6 space-y-6">
         <div className="flex justify-between items-center px-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">মোট মূল্য (TOTAL)</span>
            <span className="text-2xl font-black text-slate-900">{total.toLocaleString('bn-BD')} ৳</span>
         </div>
         
         <div className="space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block ml-2">জমা/পরিশোধিত টাকা (PAID)</span>
            <div className="relative">
               <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
               <input 
                 type="number" 
                 placeholder="কত টাকা জমা দিয়েছেন?" 
                 value={paidAmount} 
                 onChange={(e) => setPaidAmount(e.target.value)} 
                 className="w-full bg-white p-4 pl-10 rounded-2xl text-sm font-bold border border-slate-100 outline-none focus:ring-1 focus:ring-green-100" 
               />
            </div>
         </div>

         <div className="h-px w-full bg-slate-200 border-dashed border-t"></div>

         <div className="flex justify-between items-center px-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">বকেয়া (REMAINING DUE)</span>
            {/* User requested red color for the due amount number */}
            <span className="text-2xl font-black text-red-600">{due.toLocaleString('bn-BD')} ৳</span>
         </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={handlePreview} 
          className="flex-1 bg-slate-100 text-slate-700 py-5 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-slate-200"
        >
          <Eye className="w-5 h-5" /> প্রিভিউ
        </button>
        <button 
          onClick={handleSave} 
          className="flex-[2] bg-[#0F172A] text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-slate-900/10"
        >
          <div className="p-1 rounded-full border border-white/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          মেমো সেভ করুন
        </button>
      </div>
    </div>
  );
};

const PrintModal = ({ memo, onClose }: { memo: Entry, onClose: () => void }) => {
    const printRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownloadImage = async () => {
        if (!printRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(printRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            link.download = `memo_${memo.challanNo || 'draft'}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (err) { console.error(err); } finally { setIsGenerating(false); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">মেমো প্রিভিউ</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/30">
                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden p-8 border border-slate-200" ref={printRef} id="printable-invoice">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">ব্রিক ফিল্ড এন্টারপ্রাইজ</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">স্থাপিত: ২০২৪</p>
                            <div className="h-1 w-20 bg-green-500 mx-auto mt-3 rounded-full"></div>
                        </div>

                        <div className="flex justify-between items-start mb-6 text-sm">
                            <div className="space-y-1.5">
                                <p className="font-bold text-slate-800"><span className="text-slate-400 text-[10px] uppercase w-12 inline-block">ক্রেতা:</span> {memo.customerName || '---'}</p>
                                <p className="font-bold text-slate-800"><span className="text-slate-400 text-[10px] uppercase w-12 inline-block">ঠিকানা:</span> {memo.customerAddress || '---'}</p>
                                {memo.vehicleNo && <p className="font-bold text-slate-800"><span className="text-slate-400 text-[10px] uppercase w-12 inline-block">গাড়ি:</span> {memo.vehicleNo}</p>}
                            </div>
                            <div className="text-right space-y-1.5 font-mono">
                                <p className="font-bold text-slate-800">#{memo.challanNo}</p>
                                <p className="font-bold text-slate-800">{memo.timestamp.toLocaleDateString('bn-BD')}</p>
                            </div>
                        </div>

                        <table className="w-full text-left border-collapse mb-8 text-sm">
                            <thead>
                                <tr className="border-b-2 border-slate-900 bg-slate-50">
                                    <th className="py-3 px-2 font-black uppercase text-[10px] text-slate-500">বিবরণ</th>
                                    <th className="py-3 px-2 font-black uppercase text-[10px] text-slate-500 text-center">সংখ্যা</th>
                                    <th className="py-3 px-2 font-black uppercase text-[10px] text-slate-500 text-right">মোট</th>
                                </tr>
                            </thead>
                            <tbody>
                                {memo.items?.map((item, idx) => (
                                    <tr key={idx} className="border-b border-slate-100">
                                        <td className="py-4 px-2 font-black text-slate-800">{item.type}</td>
                                        <td className="py-4 px-2 text-center font-bold text-slate-700">{item.qty.toLocaleString('bn-BD')} টি</td>
                                        <td className="py-4 px-2 text-right font-black text-slate-900">{(item.qty * item.rate).toLocaleString('bn-BD')} ৳</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-between items-end mb-12">
                            <div className="w-full space-y-2 max-w-[180px] ml-auto">
                                <div className="flex justify-between font-bold text-slate-400 text-[10px] uppercase tracking-widest">
                                    <span>মোট</span>
                                    <span>{memo.amount.toLocaleString('bn-BD')} ৳</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-600 text-[10px] uppercase tracking-widest">
                                    <span>জমা</span>
                                    <span>{(memo.paidAmount || memo.amount).toLocaleString('bn-BD')} ৳</span>
                                </div>
                                <div className="flex justify-between font-black text-slate-900 border-t-2 border-slate-900 pt-2 text-lg">
                                    <span>বকেয়া</span>
                                    <span>{(memo.dueAmount || 0).toLocaleString('bn-BD')} ৳</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
                    <button onClick={handleDownloadImage} disabled={isGenerating} className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black active:scale-95 disabled:opacity-50">ইমেজ ডাউনলোড</button>
                    <button onClick={() => window.print()} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black shadow-lg shadow-green-500/20 active:scale-95 transition-all">মেমো প্রিন্ট</button>
                </div>
            </div>
            <style>{`@media print { body * { visibility: hidden; } #printable-invoice, #printable-invoice * { visibility: visible; } #printable-invoice { position: fixed; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; } }`}</style>
        </div>
    );
};

const LaborAdvanceForm = ({ onSave }: { onSave: (e: Entry) => void }) => (
  <form onSubmit={(e: any) => {
    e.preventDefault();
    onSave({ id: Date.now().toString(), type: 'LABOR_ADVANCE', amount: Number(e.target.amount.value), description: `দাদন: ${e.target.name.value}`, category: 'শ্রমিক', timestamp: new Date() });
  }} className="bg-white p-6 rounded-[32px] shadow-lg space-y-4">
    <h3 className="text-xl font-bold mb-4 text-orange-600">দাদন/অগ্রিম এন্ট্রি</h3>
    <input name="name" placeholder="মাঝির নাম" className="w-full bg-slate-50 p-4 rounded-xl outline-none" required />
    <input name="amount" type="number" placeholder="টাকার পরিমাণ" className="w-full bg-slate-50 p-4 rounded-xl outline-none" required />
    <button type="submit" className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold">সেভ করুন</button>
  </form>
);

const ExpenseForm = ({ onSave }: { onSave: (e: Entry) => void }) => (
  <form onSubmit={(e: any) => {
    e.preventDefault();
    onSave({ id: Date.now().toString(), type: 'EXPENSE', amount: Number(e.target.amount.value), description: e.target.desc.value, category: 'খরচ', timestamp: new Date() });
  }} className="bg-white p-6 rounded-[32px] shadow-lg space-y-4">
    <h3 className="text-xl font-bold mb-4 text-red-600">নতুন খরচ যোগ করুন</h3>
    <input name="amount" type="number" placeholder="টাকার পরিমাণ" className="w-full bg-slate-50 p-4 rounded-xl outline-none" required />
    <input name="desc" placeholder="বিস্তারিত বিবরণ" className="w-full bg-slate-50 p-4 rounded-xl outline-none" required />
    <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-xl font-bold">খরচ সেভ করুন</button>
  </form>
);

export default App;
