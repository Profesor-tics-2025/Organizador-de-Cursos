import React, { useState, useEffect, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar as CalendarIcon, 
  GraduationCap, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus, 
  AlertTriangle,
  TrendingUp,
  Clock,
  Euro,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
  Trash2,
  Edit2,
  BrainCircuit,
  X,
  Share2,
  ExternalLink,
  FileText,
  Printer,
  Download,
  Users
} from 'lucide-react';
import { 
  Course, 
  Session, 
  TeacherSettings, 
  DashboardStats,
  Modality,
  CourseStatus,
  PricingType,
  Client,
  User
} from './types';
import { api } from './lib/api';
import { Auth } from './components/Auth/Auth';

const triggerRefresh = (type: string) => window.dispatchEvent(new CustomEvent(`refresh-${type}`));

const subscribeToCourses = (uid: string, cb: any) => {
  const fetch = () => api.getCourses().then(cb).catch(console.error);
  fetch();
  window.addEventListener('refresh-courses', fetch);
  return () => window.removeEventListener('refresh-courses', fetch);
};
const subscribeToSessions = (uid: string, cb: any) => {
  const fetch = () => api.getSessions().then(cb).catch(console.error);
  fetch();
  window.addEventListener('refresh-sessions', fetch);
  return () => window.removeEventListener('refresh-sessions', fetch);
};
const subscribeToSettings = (uid: string, cb: any) => {
  const fetch = () => api.getSettings().then(cb).catch(console.error);
  fetch();
  window.addEventListener('refresh-settings', fetch);
  return () => window.removeEventListener('refresh-settings', fetch);
};
const subscribeToClients = (uid: string, cb: any) => {
  const fetch = () => api.getClients().then(cb).catch(console.error);
  fetch();
  window.addEventListener('refresh-clients', fetch);
  return () => window.removeEventListener('refresh-clients', fetch);
};

const addCourse = async (data: any) => { await api.createCourse(data); triggerRefresh('courses'); };
const updateCourse = async (id: string, data: any) => { await api.updateCourse(id, data); triggerRefresh('courses'); };
const deleteCourse = async (id: string) => { await api.deleteCourse(id); triggerRefresh('courses'); };
const saveSettings = async (uid: string, data: any) => { await api.updateSettings(data); triggerRefresh('settings'); };
const addSession = async (data: any) => { await api.createSession(data); triggerRefresh('sessions'); };
const deleteSession = async (id: string) => { await api.deleteSession(id); triggerRefresh('sessions'); };
const addClient = async (data: any) => { await api.createClient(data); triggerRefresh('clients'); };
const updateClient = async (id: string, data: any) => { await api.updateClient(id, data); triggerRefresh('clients'); };
const deleteClient = async (id: string) => { await api.deleteClient(id); triggerRefresh('clients'); };
import { 
  format, 
  startOfWeek, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO,
  isWithinInterval,
  addMonths,
  subMonths,
  differenceInHours,
  isAfter,
  isBefore
} from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeScheduleConflicts } from './services/geminiService';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants ---

const COURSE_COLORS = [
  { name: 'Esmeralda', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { name: 'Azul', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  { name: 'Índigo', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  { name: 'Púrpura', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  { name: 'Rosa', bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
  { name: 'Naranja', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  { name: 'Ámbar', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  { name: 'Cian', bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
];

const getCourseColor = (colorName?: string) => {
  return COURSE_COLORS.find(c => c.name === colorName) || COURSE_COLORS[0];
};

// --- Components ---
// ... (rest of imports and components)

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg group",
      active 
        ? "bg-emerald-50 text-emerald-700" 
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-600")} />
    {label}
  </button>
);

const StatCard = ({ label, value, icon: Icon, trend, color, onClick, bgColor, bgImage, className }: { label: string, value: string | number, icon: any, trend?: string, color: string, onClick?: () => void, bgColor?: string, bgImage?: string, className?: string }) => (
  <div 
    onClick={onClick}
    className={cn(
      "p-4 border rounded-xl border-slate-200 shadow-sm relative overflow-hidden h-40",
      onClick && "cursor-pointer hover:border-emerald-500 transition-all hover:shadow-md",
      !bgColor && !bgImage && "bg-white",
      className
    )}
    style={{
      ...(bgColor ? { backgroundColor: bgColor } : {}),
    }}
  >
    <div className="relative z-10 flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <h3 className="mt-1 text-xl font-bold text-slate-900">{value}</h3>
        {trend && (
          <p className="mt-1 text-[10px] font-medium text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {trend}
          </p>
        )}
      </div>
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
    </div>
  </div>
);

// --- Main App ---

function ClockDisplay() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
      <Clock className="w-5 h-5 text-emerald-600 animate-pulse" />
      <div className="flex flex-col">
        <span className="text-sm font-bold text-slate-900 leading-none">
          {format(time, 'HH:mm:ss')}
        </span>
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
          {format(time, 'EEEE, d MMMM', { locale: es })}
        </span>
      </div>
    </div>
  );
}

function ClientManagement({ clients }: { clients: Client[] }) {
  const safeClients = clients || [];
  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Tus Clientes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {safeClients.map(client => (
          <div key={client.id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50">
            <p className="font-bold text-slate-900">{client.name}</p>
            <p className="text-sm text-slate-500">{client.email}</p>
            <p className="text-sm text-slate-500">{client.phone}</p>
            <p className="text-sm text-slate-500">{client.address}</p>
          </div>
        ))}
        {safeClients.length === 0 && (
          <p className="text-slate-500">No tienes clientes registrados.</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'income' | 'hours' | 'courses' | 'invoices' | 'calendar' | 'settings' | 'integrations' | 'clients' | 'new-course' | 'edit-course'>('dashboard');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<TeacherSettings | null>(null);
  const [scheduleAnalysis, setScheduleAnalysis] = useState<{ conflicts: { type: string, message: string, date: string, solution: string }[], summary: string } | null>(null);
  const [isAnalyzingSchedule, setIsAnalyzingSchedule] = useState(false);
  const [selectedInvoiceCourseId, setSelectedInvoiceCourseId] = useState<string>('');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleGoToEditor = () => {
    setActiveTab('invoices');
    setShowInvoicePreview(true);
    if (!selectedInvoiceCourseId && courses.length > 0) {
      setSelectedInvoiceCourseId(courses[0].id || '');
    }
  };

  // Auth
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();

    const handleAuthError = () => {
      setUser(null);
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, []);

  // Data Subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubCourses = subscribeToCourses(user.id, setCourses);
    const unsubSessions = subscribeToSessions(user.id, setSessions);
    const unsubClients = subscribeToClients(user.id, setClients);
    const unsubSettings = subscribeToSettings(user.id, (s) => {
      if (!s) {
        const defaultSettings: TeacherSettings = {
          userId: user.id,
          maxHoursPerWeek: 20,
          availableDays: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
          minHourlyRate: 25,
          preferredModality: 'any',
          bankAccount: ''
        };
        saveSettings(user.id, defaultSettings);
      } else {
        setSettings(s);
      }
    });

    return () => {
      unsubCourses();
      unsubSessions();
      unsubClients();
      unsubSettings();
    };
  }, [user]);

  const handleLogin = (user: any) => {
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const runScheduleAnalysis = async () => {
    setIsAnalyzingSchedule(true);
    try {
      const result = await analyzeScheduleConflicts(courses, sessions);
      setScheduleAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
      setScheduleAnalysis({
        conflicts: [],
        summary: "Hubo un error al procesar el análisis. Por favor, intenta de nuevo."
      });
    } finally {
      setIsAnalyzingSchedule(false);
      document.getElementById('schedule-analysis-modal')?.classList.remove('hidden');
    }
  };

  // Stats Calculation
  const stats: DashboardStats = useMemo(() => {
    const safeCourses = courses || [];
    const safeSessions = sessions || [];
    const now = new Date();
    const startOfW = startOfWeek(now, { weekStartsOn: 1 });
    const endOfW = addDays(startOfW, 6);
    const startOfM = startOfMonth(now);
    const endOfM = endOfMonth(now);
    const startOfY = new Date(now.getFullYear(), 0, 1);

    const thisWeekSessions = safeSessions.filter(s => {
      const d = parseISO(s.date);
      return isWithinInterval(d, { start: startOfW, end: endOfW });
    });

    const thisMonthSessions = safeSessions.filter(s => {
      const d = parseISO(s.date);
      return isWithinInterval(d, { start: startOfM, end: endOfM });
    });

    const hoursThisWeek = thisWeekSessions.reduce((acc, s) => {
      const start = parseISO(`${s.date}T${s.startTime}`);
      const end = parseISO(`${s.date}T${s.endTime}`);
      return acc + differenceInHours(end, start);
    }, 0);

    const hoursThisMonth = thisMonthSessions.reduce((acc, s) => {
      const start = parseISO(`${s.date}T${s.startTime}`);
      const end = parseISO(`${s.date}T${s.endTime}`);
      return acc + differenceInHours(end, start);
    }, 0);

    const activeCourses = safeCourses.filter(c => c.status === 'confirmado').length;
    const upcomingCourses = safeCourses.filter(c => isAfter(parseISO(c.startDate), now)).length;

    // Income
    const incomeThisMonth = safeCourses.reduce((acc, c) => {
      if (c.status !== 'confirmado' && c.status !== 'finalizado') return acc;
      const start = parseISO(c.startDate);
      if (isWithinInterval(start, { start: startOfM, end: endOfM })) {
        return acc + (c.pricingType === 'hourly' ? c.price * c.totalHours : c.price);
      }
      return acc;
    }, 0);

    const incomeThisYear = safeCourses.reduce((acc, c) => {
      if (c.status !== 'confirmado' && c.status !== 'finalizado') return acc;
      const start = parseISO(c.startDate);
      if (isAfter(start, startOfY)) {
        return acc + (c.pricingType === 'hourly' ? c.price * c.totalHours : c.price);
      }
      return acc;
    }, 0);

    // Overlaps (simple check)
    let overlaps = 0;
    safeSessions.forEach((s1, i) => {
      safeSessions.slice(i + 1).forEach(s2 => {
        if (isSameDay(parseISO(s1.date), parseISO(s2.date))) {
          const start1 = s1.startTime;
          const end1 = s1.endTime;
          const start2 = s2.startTime;
          const end2 = s2.endTime;
          if ((start1 < end2 && end1 > start2)) {
            overlaps++;
          }
        }
      });
    });

    return {
      upcomingCourses,
      hoursThisWeek,
      hoursThisMonth,
      incomeThisMonth,
      incomeThisYear,
      activeCourses,
      overlaps
    };
  }, [courses, sessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Navigation (Bottom Bar) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40" style={{ backgroundColor: '#c50000' }}>
        <button onClick={() => setActiveTab('dashboard')} className={cn("p-2 rounded-xl", activeTab === 'dashboard' ? "text-emerald-600 bg-emerald-50" : "text-slate-400")}>
          <LayoutDashboard className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('hours')} className={cn("p-2 rounded-xl", activeTab === 'hours' ? "text-emerald-600 bg-emerald-50" : "text-slate-400")}>
          <Clock className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('courses')} className={cn("p-2 rounded-xl", activeTab === 'courses' ? "text-emerald-600 bg-emerald-50" : "text-slate-400")}>
          <BookOpen className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('calendar')} className={cn("p-2 rounded-xl", activeTab === 'calendar' ? "text-emerald-600 bg-emerald-50" : "text-slate-400")}>
          <CalendarIcon className="w-6 h-6" />
        </button>
        <button onClick={() => { setActiveTab('invoices'); setShowInvoicePreview(false); }} className={cn("p-2 rounded-xl", activeTab === 'invoices' && !showInvoicePreview ? "text-emerald-600 bg-emerald-50" : "text-slate-400")}>
          <FileText className="w-6 h-6" />
        </button>
        <button onClick={handleGoToEditor} className={cn("p-2 rounded-xl", activeTab === 'invoices' && showInvoicePreview ? "text-emerald-600 bg-emerald-50" : "text-slate-400")}>
          <Printer className="w-6 h-6" />
        </button>
      </nav>

      {/* Sidebar (Desktop) */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">DocentePro</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={TrendingUp} label="Ingresos Anuales" active={activeTab === 'income'} onClick={() => setActiveTab('income')} />
          <SidebarItem icon={Clock} label="Horas Anuales" active={activeTab === 'hours'} onClick={() => setActiveTab('hours')} />
          <SidebarItem icon={BookOpen} label="Mis Cursos" active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} />
          <SidebarItem icon={FileText} label="Facturas" active={activeTab === 'invoices' && !showInvoicePreview} onClick={() => { setActiveTab('invoices'); setShowInvoicePreview(false); }} />
          <SidebarItem icon={Edit2} label="Editar Factura" active={activeTab === 'invoices' && showInvoicePreview} onClick={handleGoToEditor} />
          <SidebarItem icon={CalendarIcon} label="Calendario" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
          <SidebarItem icon={Share2} label="Integraciones" active={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} />
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold border border-emerald-200">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className="flex-1 lg:ml-64 p-4 lg:p-8 pb-24 lg:pb-8 bg-cover bg-center bg-no-repeat bg-fixed" 
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop")'
        }}
      >
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#7d54ff' }}>
              {activeTab === 'dashboard' && 'Panel de Control'}
              {activeTab === 'income' && 'Ingresos Anuales'}
              {activeTab === 'hours' && 'Horas Anuales'}
              {activeTab === 'courses' && 'Gestión de Cursos'}
              {activeTab === 'invoices' && 'Generar Facturas'}
              {activeTab === 'calendar' && 'Calendario Docente'}
              {activeTab === 'integrations' && 'Integraciones'}
              {activeTab === 'settings' && 'Configuración'}
              {activeTab === 'clients' && 'Gestión de Clientes'}
              {activeTab === 'new-course' && 'Nuevo Curso'}
              {activeTab === 'edit-course' && 'Editar Curso'}
            </h2>
            <p style={{ color: '#ffffff' }}>
              {activeTab === 'dashboard' && 'Bienvenido de nuevo, aquí tienes un resumen de tu actividad.'}
              {activeTab === 'income' && 'Análisis detallado de tus ingresos anuales.'}
              {activeTab === 'hours' && 'Análisis detallado de tus horas anuales.'}
              {activeTab === 'courses' && 'Administra tus cursos actuales y finalizados.'}
              {activeTab === 'invoices' && 'Crea y gestiona facturas para tus cursos y sesiones.'}
              {activeTab === 'calendar' && 'Visualiza tu carga de trabajo y evita solapamientos.'}
              {activeTab === 'integrations' && 'Conecta DocentePro con tus herramientas favoritas.'}
              {activeTab === 'settings' && 'Personaliza tus preferencias y límites de trabajo.'}
              {activeTab === 'clients' && 'Administra tu base de datos de clientes.'}
              {activeTab === 'new-course' && 'Añade un nuevo curso a tu lista.'}
              {activeTab === 'edit-course' && 'Modifica los detalles de este curso.'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div style={{ backgroundColor: '#ddffbb' }}><ClockDisplay /></div>
            <button 
              onClick={() => setActiveTab('settings')}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm"
              style={{ backgroundColor: '#ddffbb' }}
            >
              <SettingsIcon className="w-5 h-5 text-slate-400" />

              Configuración
            </button>
            {activeTab === 'courses' && (
              <button 
                onClick={() => setActiveTab('new-course')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" /> Nueva
              </button>
            )}
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <Dashboard stats={stats} onAnalyzeConflicts={runScheduleAnalysis} scheduleAnalysis={scheduleAnalysis} setActiveTab={setActiveTab} sessions={sessions} courses={courses} />}
        {activeTab === 'income' && <IncomeView courses={courses} sessions={sessions} />}
        {activeTab === 'hours' && <HoursView courses={courses} sessions={sessions} />}
        {activeTab === 'courses' && <CourseManagement courses={courses} sessions={sessions} userId={user.id} onEditCourse={(course) => { setEditingCourse(course); setActiveTab('edit-course'); }} />}
        {activeTab === 'invoices' && (
          <Invoices 
            courses={courses} 
            sessions={sessions} 
            user={user} 
            settings={settings} 
            clients={clients}
            selectedCourseId={selectedInvoiceCourseId}
            setSelectedCourseId={setSelectedInvoiceCourseId}
            showPreview={showInvoicePreview}
            setShowPreview={setShowInvoicePreview}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'calendar' && <Calendar sessions={sessions} courses={courses} />}
        {activeTab === 'clients' && <ClientManagement clients={clients} />}
        {activeTab === 'integrations' && <Integrations />}
        {activeTab === 'settings' && <Settings settings={settings} userId={user.id} />}
        {activeTab === 'new-course' && (
          <CourseFormView 
            userId={user.id} 
            onSave={() => setActiveTab('courses')} 
            onCancel={() => setActiveTab('courses')} 
          />
        )}
        {activeTab === 'edit-course' && editingCourse && (
          <CourseFormView 
            userId={user.id} 
            course={editingCourse} 
            onSave={() => { setEditingCourse(null); setActiveTab('courses'); }} 
            onCancel={() => { setEditingCourse(null); setActiveTab('courses'); }} 
          />
        )}
      </main>
      
      {/* Schedule Analysis Modal */}
      <div id="schedule-analysis-modal" className="fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-xl font-bold">Análisis Inteligente de Horarios</h3>
                <p className="text-xs text-slate-400">Detección proactiva de solapamientos y riesgos.</p>
              </div>
            </div>
            <button onClick={() => document.getElementById('schedule-analysis-modal')?.classList.add('hidden')} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {scheduleAnalysis ? (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <p className="text-slate-800 font-medium leading-relaxed">{scheduleAnalysis.summary}</p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Conflictos Detectados</h4>
                  {scheduleAnalysis.conflicts && scheduleAnalysis.conflicts.length > 0 ? (
                    scheduleAnalysis.conflicts.map((conflict, idx) => (
                      <div key={idx} className={cn(
                        "flex items-start gap-4 p-4 rounded-2xl border",
                        conflict.type === 'error' ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"
                      )}>
                        {conflict.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" /> : <Clock className="w-5 h-5 text-amber-600 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                            {(() => {
                              try {
                                const d = parseISO(conflict.date);
                                return isNaN(d.getTime()) ? conflict.date : format(d, 'dd MMMM yyyy', { locale: es });
                              } catch {
                                return conflict.date;
                              }
                            })()}
                          </p>
                          <p className={cn(
                            "text-sm font-medium mb-2",
                            conflict.type === 'error' ? "text-red-900" : "text-amber-900"
                          )}>{conflict.message}</p>
                          <div className={cn(
                            "p-3 rounded-xl text-xs font-bold flex items-start gap-2",
                            conflict.type === 'error' ? "bg-red-100/50 text-red-700" : "bg-amber-100/50 text-amber-700"
                          )}>
                            <BrainCircuit className="w-4 h-4 shrink-0" />
                            <span>Solución propuesta: {conflict.solution}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                      <p className="text-slate-500 font-medium">¡Todo despejado! No se han detectado conflictos.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-500">Analizando tu calendario...</p>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button 
              onClick={() => document.getElementById('schedule-analysis-modal')?.classList.add('hidden')}
              className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-pages ---

function Integrations() {
  const integrations = [
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Sincroniza tus sesiones automáticamente con tu calendario de Google.',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg',
      status: 'available',
      color: 'bg-blue-50',
      connectUrl: 'https://calendar.google.com/',
      docsUrl: 'https://support.google.com/calendar/'
    },
    {
      id: 'outlook',
      name: 'Outlook Calendar',
      description: 'Conecta tu cuenta de Microsoft para gestionar tus clases desde Outlook.',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg',
      status: 'available',
      color: 'bg-indigo-50',
      connectUrl: 'https://outlook.live.com/calendar/',
      docsUrl: 'https://support.microsoft.com/es-es/outlook'
    },
    {
      id: 'zoom',
      name: 'Zoom Video',
      description: 'Crea enlaces de reuniones automáticamente para tus clases online.',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Zoom_Communications_Logo.svg',
      status: 'available',
      color: 'bg-sky-50',
      connectUrl: 'https://zoom.us/',
      docsUrl: 'https://support.zoom.us/'
    },
    {
      id: 'moodle',
      name: 'Moodle',
      description: 'Importa tus cursos y alumnos directamente desde tu plataforma Moodle.',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Moodle-logo.svg',
      status: 'available',
      color: 'bg-orange-50',
      connectUrl: 'https://moodle.org/',
      docsUrl: 'https://docs.moodle.org/'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {integrations.map((item) => (
        <div key={item.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between mb-6">
            <div className={cn("p-4 rounded-2xl", item.color)}>
              <img src={item.icon} alt={item.name} className="w-8 h-8 object-contain" />
            </div>
            {item.status === 'available' ? (
              <a href={item.connectUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors inline-block">
                Conectar
              </a>
            ) : (
              <a href={item.connectUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-lg uppercase tracking-wider hover:bg-slate-200 transition-colors inline-block">
                Próximamente
              </a>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">{item.name}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            {item.description}
          </p>
          {item.status === 'available' && (
            <a href={item.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity w-fit">
              Ver documentación <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function Invoices(props: { 
  courses: Course[], 
  sessions: Session[], 
  user: User, 
  settings: TeacherSettings | null, 
  clients: Client[],
  selectedCourseId: string,
  setSelectedCourseId: (id: string) => void,
  showPreview: boolean,
  setShowPreview: (show: boolean) => void,
  setActiveTab: (tab: 'dashboard' | 'income' | 'hours' | 'courses' | 'invoices' | 'calendar' | 'settings' | 'integrations' | 'clients') => void
}) {
  const { 
    courses, 
    sessions, 
    user, 
    settings, 
    clients,
    selectedCourseId,
    setSelectedCourseId,
    showPreview,
    setShowPreview,
    setActiveTab
  } = props;
  const safeCourses = courses || [];
  const safeSessions = sessions || [];
  const selectedCourse = safeCourses.find(c => c.id === selectedCourseId);
  const courseSessions = safeSessions.filter(s => s.courseId === selectedCourseId);
  
  const totalAmount = useMemo(() => {
    if (!selectedCourse) return 0;
    if (selectedCourse.pricingType === 'total') return selectedCourse.price;
    
    const hours = courseSessions.reduce((acc, s) => {
      const start = parseISO(`${s.date}T${s.startTime}`);
      const end = parseISO(`${s.date}T${s.endTime}`);
      return acc + differenceInHours(end, start);
    }, 0);
    
    return hours * selectedCourse.price;
  }, [selectedCourse, courseSessions]);

  if (showPreview && selectedCourse) {
    return (
      <InvoiceEditor 
        course={selectedCourse} 
        sessions={courseSessions} 
        allCourses={courses}
        allSessions={sessions}
        user={user} 
        settings={settings}
        clients={clients}
        onBack={() => setShowPreview(false)} 
        setActiveTab={setActiveTab}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            Nueva Factura
          </h3>
          <button 
            onClick={() => selectedCourseId && setShowPreview(true)}
            disabled={!selectedCourseId}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all border shadow-sm disabled:opacity-50",
              selectedCourseId 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                : "bg-slate-50 border-slate-200 text-slate-400"
            )}
          >
            <Edit2 className="w-4 h-4" />
            Editar Factura
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Seleccionar Curso</label>
            <select 
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            >
              <option value="">Selecciona un curso para facturar...</option>
              {safeCourses.map(course => (
                <option key={course.id} value={course.id}>{course.name} ({course.entity})</option>
              ))}
            </select>
          </div>

          {selectedCourse && (
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-center pb-4 border-bottom border-slate-200">
                <span className="text-slate-500">Cliente / Entidad</span>
                <span className="font-bold text-slate-900">{selectedCourse.entity}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-bottom border-slate-200">
                <span className="text-slate-500">Tipo de Tarifa</span>
                <span className="font-bold text-slate-900">{selectedCourse.pricingType === 'hourly' ? 'Por Hora' : 'Precio Total'}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-bottom border-slate-200">
                <span className="text-slate-500">Sesiones registradas</span>
                <span className="font-bold text-slate-900">{courseSessions.length}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <span className="text-lg font-bold text-slate-900">Total a Facturar</span>
                <span className="text-2xl font-black text-emerald-600">{totalAmount}€</span>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button 
              disabled={!selectedCourseId}
              className="flex-1 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:shadow-none"
            >
              Generar PDF de Factura
            </button>
            <button 
              disabled={!selectedCourseId}
              className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 disabled:opacity-50 disabled:shadow-none"
            >
              Enviar por Email
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Historial de Facturas</h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500">No hay facturas generadas todavía.</p>
        </div>
      </div>
    </div>
  );
}

function InvoiceEditor({ 
  course, 
  sessions, 
  allCourses,
  allSessions,
  user, 
  settings, 
  clients,
  onBack,
  setActiveTab
}: { 
  course: Course, 
  sessions: Session[], 
  allCourses: Course[],
  allSessions: Session[],
  user: User, 
  settings: TeacherSettings | null,
  clients: Client[],
  onBack: () => void,
  setActiveTab: (tab: 'dashboard' | 'income' | 'hours' | 'courses' | 'invoices' | 'calendar' | 'settings' | 'integrations' | 'clients') => void
}) {
  const [invoiceNumber, setInvoiceNumber] = useState('8');
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expirationDate, setExpirationDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [ivaRate, setIvaRate] = useState(0);
  const [irpfRate, setIrpfRate] = useState(0.07);
  const [accountNumber, setAccountNumber] = useState('0000 0000 0000 0000 0000 0000');
  
  const [emisorName, setEmisorName] = useState(user.name || 'Francisco Javier Flor González');
  const [emisorNif, setEmisorNif] = useState('30602373E');
  const [emisorAddress, setEmisorAddress] = useState('Urbanización La Sorrozuela 114-115, 39170 Ajo (Cantabria)');
  const [emisorPhone, setEmisorPhone] = useState('687216537');
  const [emisorEmail, setEmisorEmail] = useState('jflorperitociberseguridad@gmail.com\njfloradmin@cibermedida.es\njavierflordocentetics@gmail.com');
  
  const [client, setClient] = useState({
    name: course.entity,
    nif: '',
    address: course.location,
    phone: '',
    email: ''
  });

  useEffect(() => {
    const safeClients = clients || [];
    const matchedClient = safeClients.find(c => c.name === course.entity);
    if (matchedClient) {
      setClient({
        name: matchedClient.name,
        nif: matchedClient.nif,
        address: matchedClient.address,
        phone: matchedClient.phone,
        email: matchedClient.email
      });
    }
  }, [course.entity, clients]);

  const handleSaveClient = async () => {
    const safeClients = clients || [];
    const existingClient = safeClients.find(c => c.name === client.name);
    if (existingClient && existingClient.id) {
      await updateClient(existingClient.id, { ...client });
    } else {
      await addClient({ ...client, userId: user.id });
    }
    alert('Cliente guardado correctamente');
  };

  const handleSelectClient = (clientId: string) => {
    const safeClients = clients || [];
    const selected = safeClients.find(c => c.id === clientId);
    if (selected) {
      setClient({
        name: selected.name,
        nif: selected.nif,
        address: selected.address,
        phone: selected.phone,
        email: selected.email
      });
    }
  };

  const initialHours = useMemo(() => {
    const safeSessions = sessions || [];
    return safeSessions.filter(s => s.date.startsWith(selectedMonth)).reduce((acc, s) => {
      const start = parseISO(`${s.date}T${s.startTime}`);
      const end = parseISO(`${s.date}T${s.endTime}`);
      return acc + differenceInHours(end, start);
    }, 0);
  }, [sessions, selectedMonth]);

  const [items, setItems] = useState([
    {
      id: '1',
      hours: initialHours,
      description: `${course.name}\n(${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: es })} / ${course.schedule})`,
      unitPrice: course.price
    }
  ]);

  // Update first item when initialHours changes (only if it's the only item and hasn't been heavily edited)
  useEffect(() => {
    setItems(prev => {
      if (prev.length === 1 && prev[0].id === '1') {
        return [{
          ...prev[0],
          hours: initialHours,
          description: `${course.name}\n(${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: es })} / ${course.schedule})`
        }];
      }
      return prev;
    });
  }, [initialHours, selectedMonth, course.name, course.schedule]);

  const subtotal = items.reduce((acc, item) => acc + (item.hours * item.unitPrice), 0);
  const iva = subtotal * (ivaRate / 100);
  const irpf = subtotal * irpfRate;
  const total = subtotal + iva - irpf;

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const addCourseItem = (courseId: string) => {
    const safeAllCourses = allCourses || [];
    const safeAllSessions = allSessions || [];
    const selected = safeAllCourses.find(c => c.id === courseId);
    if (selected) {
      const courseSessions = safeAllSessions.filter(s => 
        s.courseId === selected.id && 
        s.date.startsWith(selectedMonth)
      );
      const hours = courseSessions.reduce((acc, s) => {
        const start = parseISO(`${s.date}T${s.startTime}`);
        const end = parseISO(`${s.date}T${s.endTime}`);
        return acc + differenceInHours(end, start);
      }, 0);

      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        hours: hours,
        description: `${selected.name}\n(${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: es })} / ${selected.schedule})`,
        unitPrice: selected.price
      };
      setItems(prev => [...prev, newItem]);
    }
  };

  const loadAllCoursesOfMonth = () => {
    const safeAllCourses = allCourses || [];
    const safeAllSessions = allSessions || [];
    const coursesInMonth = safeAllCourses.filter(c => 
      safeAllSessions.some(s => s.courseId === c.id && s.date.startsWith(selectedMonth))
    );
    
    const newItems = coursesInMonth.map(c => {
      const courseSessions = safeAllSessions.filter(s => s.courseId === c.id && s.date.startsWith(selectedMonth));
      const hours = courseSessions.reduce((acc, s) => {
        const start = parseISO(`${s.date}T${s.startTime}`);
        const end = parseISO(`${s.date}T${s.endTime}`);
        return acc + differenceInHours(end, start);
      }, 0);

      return {
        id: Math.random().toString(36).substr(2, 9),
        hours: hours,
        description: `${c.name}\n(${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: es })} / ${c.schedule})`,
        unitPrice: c.price
      };
    });

    setItems(newItems);
  };

  const invoiceRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    const input = invoiceRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`factura_${invoiceNumber}.pdf`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20" ref={invoiceRef}>
      <div className="flex items-center justify-between no-print px-4">
        <div></div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab('clients')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            <Users className="w-4 h-4" />
            Gestión de clientes
          </button>
          <button 
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 no-print px-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between p-4 rounded-xl bg-white">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">N.º Factura:</span>
              <input 
                type="number" 
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-20 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Fecha:</span>
              <input 
                type="date" 
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-medium italic">
            * Los datos del emisor y factura son fijos en el diseño para un acabado profesional.
          </div>
        </div>
        
        <div className="h-px bg-slate-200 w-full"></div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Nombre Emisor</span>
            <input 
              type="text" 
              value={emisorName}
              onChange={(e) => setEmisorName(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">NIF</span>
            <input 
              type="text" 
              value={emisorNif}
              onChange={(e) => setEmisorNif(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</span>
            <input 
              type="text" 
              value={emisorPhone}
              onChange={(e) => setEmisorPhone(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
            <input 
              type="text" 
              value={emisorEmail}
              onChange={(e) => setEmisorEmail(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="col-span-3 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Dirección</span>
            <input 
              type="text" 
              value={emisorAddress}
              onChange={(e) => setEmisorAddress(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="h-px bg-slate-200 w-full"></div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Nombre Cliente</span>
              <select 
                onChange={(e) => handleSelectClient(e.target.value)}
                className="text-[9px] bg-white border border-slate-200 rounded px-1 outline-none"
              >
                <option value="">Cargar cliente...</option>
                {(clients || []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <input 
              type="text" 
              value={client.name}
              onChange={(e) => setClient({...client, name: e.target.value})}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">CIF Cliente</span>
            <input 
              type="text" 
              value={client.nif}
              onChange={(e) => setClient({...client, nif: e.target.value})}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Acciones</span>
            <button 
              onClick={handleSaveClient}
              className="w-full py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 transition-colors"
            >
              Guardar en Agenda
            </button>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Dirección Cliente</span>
            <input 
              type="text" 
              value={client.address}
              onChange={(e) => setClient({...client, address: e.target.value})}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Teléfono Cliente</span>
            <input 
              type="text" 
              value={client.phone}
              onChange={(e) => setClient({...client, phone: e.target.value})}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Email Cliente</span>
            <input 
              type="text" 
              value={client.email}
              onChange={(e) => setClient({...client, email: e.target.value})}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Vencimiento</span>
            <input 
              type="date" 
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">IVA (%)</span>
            <input 
              type="number" 
              value={ivaRate}
              onChange={(e) => setIvaRate(Number(e.target.value))}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">IRPF (%)</span>
            <input 
              type="number" 
              value={irpfRate * 100}
              onChange={(e) => setIrpfRate(Number(e.target.value) / 100)}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="col-span-3 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Número de cuenta</span>
            <input 
              type="text" 
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="col-span-3 flex items-center gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Mes:</span>
              <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2 py-1 text-[10px] bg-white border border-slate-300 rounded outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button 
                onClick={loadAllCoursesOfMonth}
                className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold hover:bg-emerald-100 transition-colors border border-emerald-200"
              >
                Cargar mes
              </button>
            </div>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <select 
              onChange={(e) => {
                if (e.target.value) {
                  addCourseItem(e.target.value);
                  e.target.value = '';
                }
              }}
              className="px-3 py-1 text-[10px] bg-white border border-slate-300 rounded outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Añadir curso...</option>
              {(allCourses || []).filter(c => !items.some(item => item.description.includes(c.name))).map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.entity})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="a4-container" id="invoice-capture">
        <div className="flex flex-col min-h-full">
          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl font-black text-[#c85c10] tracking-widest uppercase mb-1">FACTURA</h1>
            </div>

          {/* Emisor & Meta */}
          <div className="flex justify-between items-start gap-8 border border-[#c85c10] rounded-lg p-2">
            <div className="flex-1 p-2 border border-[#c85c10] rounded-lg">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-[10px] font-bold text-[#c85c10] uppercase tracking-[0.2em]">Emisor</h2>
              </div>
              <p className="text-xl font-black text-slate-900 leading-none mb-2">{emisorName}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px]">
                <div className="flex items-center gap-1.5 p-1">
                  <span className="font-bold text-[#c85c10] uppercase text-[9px]">NIF</span>
                  <span className="font-bold text-slate-700">{emisorNif}</span>
                </div>
                <div className="flex items-center gap-1.5 p-1">
                  <span className="font-bold text-[#c85c10] uppercase text-[9px]">Teléfono</span>
                  <span className="font-medium text-slate-600">{emisorPhone}</span>
                </div>
                <div className="flex items-center gap-1.5 p-1">
                  <span className="font-bold text-[#c85c10] uppercase text-[9px]">Dirección</span>
                  <span className="font-medium text-slate-600">{emisorAddress}</span>
                </div>
                <div className="flex items-center gap-1.5 p-1">
                  <span className="font-bold text-[#c85c10] uppercase text-[9px]">Email</span>
                  <span className="font-medium text-slate-600">{emisorEmail}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end min-w-[220px] p-2">
              <div className="flex justify-between w-full items-baseline">
                <span className="font-bold text-[10px] uppercase text-[#c85c10] tracking-tighter">N.º Factura</span>
                <span className="font-black text-lg text-slate-900 leading-none">{invoiceNumber}</span>
              </div>
              <div className="flex justify-between w-full items-baseline mt-1">
                <span className="font-bold text-[10px] uppercase text-[#c85c10] tracking-tighter">Fecha Emisión</span>
                <span className="font-black text-sm text-slate-900 leading-none">
                  {new Date(invoiceDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="pb-2">
            <div className="flex justify-between items-end">
              <div className="flex-1">
                <div className="flex flex-col gap-1 text-[11px]">
                <p className="text-base font-black text-slate-900 leading-none mb-1">Cliente: {client.name}</p>
                <div className="flex items-center gap-1.5 p-1">
                  <span className="font-bold text-[#c85c10] uppercase text-[9px] w-16">CIF:</span>
                  <span className="font-bold text-slate-700">{client.nif}</span>
                </div>
                <div className="flex items-center gap-1.5 border border-[#c85c10] rounded-lg p-1">
                  <span className="font-bold text-[#c85c10] uppercase text-[9px] w-16">Dirección:</span>
                  <span className="font-medium text-slate-600">{client.address}</span>
                </div>
                <div className="flex items-center gap-1.5 border border-[#c85c10] rounded-lg p-1">
                  <span className="font-bold text-[#c85c10] uppercase text-[9px] w-16">Teléfono:</span>
                  <span className="font-medium text-slate-600">{client.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 border border-[#c85c10] rounded-lg p-1">
                  <span className="font-bold text-[#c85c10] uppercase text-[9px] w-16">Email:</span>
                  <span className="font-medium text-slate-600">{client.email}</span>
                </div>
              </div>
              </div>
              <div className="text-right border-l border-[#c85c10] pl-4 ml-4">
                <span className="block font-bold text-[#c85c10] uppercase text-[9px] mb-0.5">Vencimiento</span>
                <span className="block font-black text-xs text-slate-900">
                  {new Date(expirationDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Table Header Info */}
          <div className="grid grid-cols-[4fr_1fr_1fr_1fr] bg-[#c85c10] border border-[#c85c10] text-center font-bold text-white text-xs">
            <div className="p-1 border-r border-white/20">Cliente</div>
            <div className="p-1 border-r border-white/20">Trabajo</div>
            <div className="p-1 border-r border-white/20">Condiciones</div>
            <div className="p-1">Vencimiento</div>
          </div>
          <div className="grid grid-cols-[4fr_1fr_1fr_1fr] border-x border-b border-[#c85c10] text-center text-[10px] font-bold">
            <div className="p-1 border-r border-slate-300 bg-white text-slate-900 truncate">{client.name}</div>
            <div className="p-1 border-r border-slate-300">Docencia</div>
            <div className="p-1 border-r border-slate-300">Recepción</div>
            <div className="p-1 bg-white text-slate-900">{expirationDate}</div>
          </div>

          {/* Main Items Table */}
          <div className="overflow-hidden border border-[#c85c10] rounded-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-white text-slate-900 border-b border-[#c85c10] font-bold text-[10px]">
                  <th className="p-1 border-r border-[#c85c10] w-16">Horas</th>
                  <th className="p-1 border-r border-[#c85c10]">Descripción</th>
                  <th className="p-1 border-r border-[#c85c10] w-16">Precio (€)</th>
                  <th className="p-1 w-24">Total (€)</th>
                  <th className="p-1 w-8 no-print"></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-slate-300 break-inside-avoid">
                    <td className="p-1 bg-white border-r border-slate-300 text-center">
                      <input 
                        type="number" 
                        value={item.hours}
                        onChange={(e) => updateItem(item.id, 'hours', Number(e.target.value))}
                        className="w-full bg-transparent border-none text-center font-black text-base outline-none"
                      />
                    </td>
                    <td className="p-1 bg-white border-r border-slate-300">
                      <textarea 
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full bg-transparent border-none font-bold text-slate-900 text-xs leading-relaxed outline-none resize-none"
                      />
                    </td>
                    <td className="p-1 bg-white border-r border-slate-300 text-center">
                      <input 
                        type="number" 
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                        className="w-full bg-transparent border-none text-center font-black text-base text-slate-900 outline-none"
                      />
                    </td>
                    <td className="p-1 bg-white text-right font-black text-base text-slate-900 whitespace-nowrap">
                      {(item.hours * item.unitPrice).toFixed(2)} €
                    </td>
                    <td className="p-1 bg-white text-center no-print">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end break-inside-avoid border border-[#c85c10] rounded-lg p-4">
            <div className="w-64 border border-[#c85c10] rounded-lg border">
              <div className="flex justify-between items-center p-1.5 bg-white border-b border-[#c85c10] text-sm border border-[#c85c10] rounded-lg">
                <span className="font-black text-slate-900 uppercase">Subtotal</span>
                <span className="font-black text-slate-900">{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center p-1.5 border-b border-[#c85c10] bg-white text-sm">
                <span className="font-black text-slate-600 uppercase">IVA ({ivaRate}%):</span>
                <span className="font-black">{iva.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-white border-b border-[#c85c10] text-sm">
                <span className="font-black text-slate-700 uppercase">IRPF ({(irpfRate * 100).toFixed(0)}%):</span>
                <span className="font-black text-red-600">- {irpf.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white">
                <span className="font-black text-slate-900 uppercase text-sm">TOTAL:</span>
                <span className="font-black text-xl text-slate-900">{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-12 border-t border-slate-100 break-inside-avoid">
          <div className="grid grid-cols-1 gap-8 text-[10px] text-slate-400 italic">
            <div className="border border-[#c85c10] rounded-lg p-4">
              <p className="font-bold text-[#c85c10] text-lg mb-2 not-italic">Forma de pago</p>
              <p className="text-[14px] font-bold not-italic">Transferencia bancaria.</p>
              <p className="text-[13px] font-bold not-italic">Número de cuenta: {accountNumber}</p>
            </div>
          </div>
          <div className="mt-8 border border-[#c85c10] rounded-lg p-4 text-center text-[10px] text-slate-400 italic">
              <p className="font-bold text-slate-500 mb-1 not-italic">Gracias por su confianza</p>
              <p>Esta factura ha sido generada automáticamente por el sistema de gestión docente.</p>
              <p>© {new Date().getFullYear()} Francisco Javier Flor González</p>
              <div className="mt-8 mb-4 border-t border-slate-300 w-48 mx-auto"></div>
              <p className="text-[8px] text-slate-500 uppercase tracking-widest">Firma</p>
              <p className="mt-2 font-black text-slate-900 not-italic text-xs">{emisorName}</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

function IncomeView({ courses, sessions }: { courses: Course[], sessions: Session[] }) {
  const chartData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthStart = new Date(currentYear, index, 1);
      const monthEnd = endOfMonth(monthStart);
      
      const income = (courses || []).reduce((acc, c) => {
        if (c.status !== 'confirmado' && c.status !== 'finalizado') return acc;
        const start = parseISO(c.startDate);
        if (isWithinInterval(start, { start: monthStart, end: monthEnd })) {
          return acc + (c.pricingType === 'hourly' ? c.price * c.totalHours : c.price);
        }
        return acc;
      }, 0);

      return { name: month, ingresos: income };
    });
  }, [courses, sessions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Chart */}
      <div className="lg:col-span-2 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Ingresos Anuales</h3>
          <div className="flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Ingresos (€)</div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Próximas Sesiones</h3>
        <div className="space-y-4">
          {(sessions || [])
            .filter(s => isAfter(parseISO(s.date), new Date()))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 5)
            .map(session => {
              const course = (courses || []).find(c => c.id === session.courseId);
              const color = getCourseColor(course?.color || 'emerald');
              return (
                <div key={session.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className={cn("w-1 h-10 rounded-full", color.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{course?.name || 'Curso eliminado'}</p>
                    <p className="text-xs text-slate-500">{format(parseISO(session.date), 'eee d MMM', { locale: es })} • {session.startTime}</p>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{session.status}</div>
                </div>
              );
            })}
          {(sessions || []).filter(s => isAfter(parseISO(s.date), new Date())).length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No hay sesiones próximas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HoursView({ courses, sessions }: { courses: Course[], sessions: Session[] }) {
  const chartData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthStart = new Date(currentYear, index, 1);
      const monthEnd = endOfMonth(monthStart);
      
      const monthSessions = (sessions || []).filter(s => {
        const d = parseISO(s.date);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      });

      const hours = monthSessions.reduce((acc, s) => {
        const start = parseISO(`${s.date}T${s.startTime}`);
        const end = parseISO(`${s.date}T${s.endTime}`);
        return acc + differenceInHours(end, start);
      }, 0);

      return { name: month, horas: hours };
    });
  }, [courses, sessions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Chart */}
      <div className="lg:col-span-2 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Horas Anuales</h3>
          <div className="flex gap-4 text-xs font-medium">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Horas (h)</div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="horas" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Próximas Sesiones</h3>
        <div className="space-y-4">
          {(sessions || [])
            .filter(s => isAfter(parseISO(s.date), new Date()))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 5)
            .map(session => {
              const course = (courses || []).find(c => c.id === session.courseId);
              const color = getCourseColor(course?.color || 'emerald');
              return (
                <div key={session.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className={cn("w-1 h-10 rounded-full", color.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{course?.name || 'Curso eliminado'}</p>
                    <p className="text-xs text-slate-500">{format(parseISO(session.date), 'eee d MMM', { locale: es })} • {session.startTime}</p>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{session.status}</div>
                </div>
              );
            })}
          {(sessions || []).filter(s => isAfter(parseISO(s.date), new Date())).length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No hay sesiones próximas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ stats, onAnalyzeConflicts, scheduleAnalysis, setActiveTab, sessions, courses }: { 
  stats: DashboardStats, 
  onAnalyzeConflicts: () => void,
  scheduleAnalysis: { conflicts: { type: string, message: string, date: string, solution: string }[], summary: string } | null,
  setActiveTab: (tab: 'dashboard' | 'income' | 'hours' | 'courses' | 'invoices' | 'calendar' | 'settings' | 'integrations' | 'clients') => void,
  sessions: Session[],
  courses: Course[]
}) {
  const conflictStats = useMemo(() => {
    if (!scheduleAnalysis) return null;
    const conflicts = scheduleAnalysis.conflicts || [];
    return {
      errors: conflicts.filter(c => c.type === 'error').length,
      warnings: conflicts.filter(c => c.type === 'warning').length
    };
  }, [scheduleAnalysis]);

  return (
    <div 
      className="space-y-8 p-8 rounded-3xl shadow-inner"
    >
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        <StatCard 
          label="Horas esta semana" 
          value={`${stats.hoursThisWeek}h`} 
          icon={Clock} 
          color="bg-blue-500" 
          trend="+12% vs semana pasada" 
          bgImage="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop" 
          onClick={() => setActiveTab('hours')} 
          className="h-full"
          bgColor="#cc42a6"
        />
        <StatCard 
          label="Ingresos este mes" 
          value={`${stats.incomeThisMonth}€`} 
          icon={Euro} 
          color="bg-emerald-500" 
          trend="+5% vs mes pasado" 
          bgImage="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop" 
          onClick={() => setActiveTab('income')} 
          className="h-full"
          bgColor="#8cd9df"
        />
        <StatCard 
          label="Cursos activos" 
          value={stats.activeCourses} 
          icon={BookOpen} 
          color="bg-violet-500" 
          bgImage="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"
          onClick={() => setActiveTab('courses')}
          className="h-full"
          bgColor="#d6cfa8"
        />
        <StatCard 
          label="Conflictos" 
          value={conflictStats 
            ? (conflictStats.errors > 0 || conflictStats.warnings > 0 
                ? `${conflictStats.errors} Críticos / ${conflictStats.warnings} Avisos` 
                : "Sin conflictos")
            : "Click para analizar"} 
          icon={AlertTriangle} 
          color={conflictStats 
            ? (conflictStats.errors > 0 ? "bg-red-500" : conflictStats.warnings > 0 ? "bg-amber-500" : "bg-emerald-500")
            : "bg-slate-400"} 
          onClick={onAnalyzeConflicts}
          bgImage="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop"
          className="h-full"
          bgColor="#fe5151"
        />
        <StatCard 
          label="Clientes" 
          value="Gestionar" 
          icon={Users} 
          color="bg-slate-500" 
          onClick={() => setActiveTab('clients')}
          bgImage="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop"
          className="h-full"
          bgColor="#c9afaf"
        />
      </div>
    </div>
  );
}

function CourseManagement({ courses, sessions, userId, onEditCourse }: { courses: Course[], sessions: Session[], userId: string, onEditCourse: (course: Course) => void }) {
  const [filter, setFilter] = useState<CourseStatus | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);

  const filteredCourses = (courses || []).filter(c => {
    const matchesFilter = filter === 'todos' || c.status === filter;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.entity.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 md:pb-0">
          {['todos', 'pendiente', 'confirmado', 'finalizado'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all",
                filter === s ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar curso o entidad..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-bottom border-slate-100">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Curso</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entidad</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fechas</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Horas</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingresos</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Horario</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCourses.map((course) => {
              const safeSessions = sessions || [];
              const courseSessions = safeSessions.filter(s => s.courseId === course.id);
              const hasOverlap = courseSessions.some(s1 => 
                safeSessions.some(s2 => 
                  s1.id !== s2.id && 
                  s1.date === s2.date && 
                  ((s1.startTime >= s2.startTime && s1.startTime < s2.endTime) ||
                   (s1.endTime > s2.startTime && s1.endTime <= s2.endTime))
                )
              );

              return (
                <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setViewingCourse(course)}
                      className="text-left group/name flex items-center gap-3"
                    >
                      <div className={cn("w-2 h-10 rounded-full shrink-0", getCourseColor(course.color).dot)} />
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover/name:text-emerald-600 transition-colors">{course.name}</p>
                        <p className="text-xs text-slate-500">{course.modality} • {course.location}</p>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{course.entity}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {format(parseISO(course.startDate), 'dd/MM/yy')} - {format(parseISO(course.endDate), 'dd/MM/yy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{course.totalHours}h</td>
                  <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                    {course.pricingType === 'hourly' ? course.price * course.totalHours : course.price}€
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider",
                      course.status === 'confirmado' && "bg-emerald-100 text-emerald-700",
                      course.status === 'finalizado' && "bg-blue-100 text-blue-700",
                      course.status === 'pendiente' && "bg-amber-100 text-amber-700"
                    )}>
                      {course.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {hasOverlap ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                        <AlertTriangle className="w-3 h-3" /> Solapado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" /> OK
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setSelectedCourse(course)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Gestionar sesiones"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {course.status === 'pendiente' && (
                      <button 
                        onClick={() => updateCourse(course.id!, { ...course, status: 'confirmado' })}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Confirmar curso"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => onEditCourse(course)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar curso"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('¿Estás seguro de que deseas eliminar este curso?')) {
                          deleteCourse(course.id!);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar curso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
        {filteredCourses.length === 0 && (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400">No se encontraron cursos con este filtro.</p>
          </div>
        )}
      </div>

      {/* Sessions for selected course */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Sesiones: {selectedCourse.name}</h3>
                <p className="text-sm text-slate-500">Añade o gestiona las sesiones de este curso.</p>
              </div>
              <button onClick={() => setSelectedCourse(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  await addSession({
                    courseId: selectedCourse.id!,
                    date: formData.get('date') as string,
                    startTime: formData.get('startTime') as string,
                    endTime: formData.get('endTime') as string,
                    content: formData.get('content') as string,
                    status: 'pendiente',
                    userId
                  });
                  form.reset();
                }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-4 bg-slate-50 rounded-2xl"
              >
                <input type="date" name="date" required className="p-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                <input type="time" name="startTime" required className="p-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                <input type="time" name="endTime" required className="p-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
                <button type="submit" className="bg-emerald-600 text-white text-sm font-bold py-2 rounded-xl hover:bg-emerald-700 transition-colors">
                  Añadir
                </button>
                <input type="text" name="content" placeholder="Contenido de la sesión" className="md:col-span-4 p-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              </form>

              <div className="space-y-3">
                {(sessions || [])
                  .filter(s => s.courseId === selectedCourse.id)
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(session => (
                    <div key={session.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-bold text-slate-900">{format(parseISO(session.date), 'dd/MM/yy')}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {session.startTime} - {session.endTime}
                        </div>
                        <div className="text-sm text-slate-600">{session.content}</div>
                      </div>
                      <button onClick={() => deleteSession(session.id!)} className="p-2 text-slate-300 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Detail Modal */}
      {viewingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-2xl",
                  getCourseColor(viewingCourse.color).bg,
                  getCourseColor(viewingCourse.color).text
                )}>
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{viewingCourse.name}</h3>
                  <p className="text-sm text-slate-500">{viewingCourse.entity}</p>
                </div>
              </div>
              <button onClick={() => setViewingCourse(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Detalles Generales</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <CalendarIcon className="w-4 h-4 text-slate-400" />
                      <span>{format(parseISO(viewingCourse.startDate), 'PPP', { locale: es })} - {format(parseISO(viewingCourse.endDate), 'PPP', { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{viewingCourse.totalHours} horas totales • {viewingCourse.modality}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Euro className="w-4 h-4 text-slate-400" />
                      <span className="font-bold text-emerald-600">
                        {viewingCourse.pricingType === 'hourly' 
                          ? `${viewingCourse.price}€/h (Total: ${viewingCourse.price * viewingCourse.totalHours}€)` 
                          : `${viewingCourse.price}€ (Total curso)`}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Ubicación / Horario</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {viewingCourse.location} • {viewingCourse.schedule || 'Horario no especificado'}
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Estado del Curso</h4>
                  <div className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-tight",
                    viewingCourse.status === 'confirmado' && "bg-emerald-100 text-emerald-700",
                    viewingCourse.status === 'finalizado' && "bg-blue-100 text-blue-700",
                    viewingCourse.status === 'pendiente' && "bg-amber-100 text-amber-700"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      viewingCourse.status === 'confirmado' && "bg-emerald-500",
                      viewingCourse.status === 'finalizado' && "bg-blue-500",
                      viewingCourse.status === 'pendiente' && "bg-amber-500"
                    )}></div>
                    {viewingCourse.status}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Resumen de Sesiones</h4>
                  <div className="p-4 bg-slate-900 rounded-2xl text-white">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Sesiones registradas</p>
                        <p className="text-2xl font-bold">{(sessions || []).filter(s => s.courseId === viewingCourse.id).length}</p>
                      </div>
                      <button 
                        onClick={() => {
                          setViewingCourse(null);
                          setSelectedCourse(viewingCourse);
                        }}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        Gestionar →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between gap-3">
              <button 
                onClick={() => {
                  setViewingCourse(null);
                  onEditCourse(viewingCourse);
                }}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Editar
              </button>
              <button 
                onClick={() => setViewingCourse(null)}
                className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Calendar({ sessions, courses, small = false }: { sessions: Session[], courses: Course[], small?: boolean }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startW = startOfWeek(start, { weekStartsOn: 1 });
    const endW = addDays(startOfWeek(end, { weekStartsOn: 1 }), 6);
    
    return eachDayOfInterval({ start: startW, end: endW });
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <div className={cn("bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden", small ? "p-4" : "p-6")}>
      <div className={cn("border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4", small ? "pb-4" : "pb-6")}>
        <div>
          <h3 className={cn("font-bold text-slate-900 uppercase tracking-tight", small ? "text-lg" : "text-xl")}>
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h3>
          {!small && (
            <div className="flex flex-wrap gap-3 mt-2">
              {(courses || []).filter(c => (sessions || []).some(s => s.courseId === c.id)).map(course => {
                const color = getCourseColor(course.color);
                return (
                  <div key={course.id} className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", color.dot)} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{course.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 border-b border-slate-100">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className={cn("py-2 text-center font-bold text-slate-400 uppercase tracking-widest", small ? "text-[10px]" : "text-xs")}>{small ? d[0] : d}</div>
        ))}
      </div>

      <div className={cn("grid grid-cols-7", small ? "auto-rows-[60px]" : "auto-rows-[120px]")}>
        {days.map((day, i) => {
          const daySessions = (sessions || []).filter(s => isSameDay(parseISO(s.date), day));
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          
          return (
            <div key={i} className={cn(
              "border-r border-b border-slate-100 p-1 transition-colors",
              !isCurrentMonth && "bg-slate-50/50",
              isSameDay(day, new Date()) && "bg-emerald-50/30"
            )}>
              <div className={cn(
                "font-bold flex items-center justify-center rounded-full",
                small ? "text-[10px] w-5 h-5" : "text-xs w-6 h-6 mb-2",
                isSameDay(day, new Date()) ? "bg-emerald-600 text-white" : "text-slate-400"
              )}>
                {format(day, 'd')}
              </div>
              <div className={cn("space-y-0.5 overflow-y-auto scrollbar-hide", small ? "max-h-[30px]" : "max-h-[80px]")}>
                {daySessions.map(s => {
                  const course = (courses || []).find(c => c.id === s.courseId);
                  const color = getCourseColor(course?.color);
                  return (
                    <div key={s.id} className={cn(
                      "px-1 py-0.5 text-[9px] font-bold rounded-md truncate border flex items-center gap-0.5",
                      color.bg, color.text, color.border
                    )}>
                      {small ? <div className={cn("w-1 h-1 rounded-full", color.dot)} /> : <Clock className="w-2 h-2" />}
                      {!small && `${s.startTime} ${course?.name}`}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Settings({ settings, userId }: { settings: TeacherSettings | null, userId: string }) {
  const [formData, setFormData] = useState<TeacherSettings>(settings || {
    userId,
    maxHoursPerWeek: 20,
    availableDays: [],
    minHourlyRate: 25,
    preferredModality: 'any',
    bankAccount: ''
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (settings) setFormData(settings);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    await saveSettings(userId, formData);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  return (
    <div className="max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-sm p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Horas máx. semanales</label>
            <input 
              type="number" 
              value={formData.maxHoursPerWeek} 
              onChange={e => setFormData({...formData, maxHoursPerWeek: parseInt(e.target.value)})}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tarifa mínima (€/h)</label>
            <input 
              type="number" 
              value={formData.minHourlyRate} 
              onChange={e => setFormData({...formData, minHourlyRate: parseInt(e.target.value)})}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-4">Días disponibles</label>
          <div className="flex flex-wrap gap-3">
            {['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map(day => (
              <button
                key={day}
                type="button"
                onClick={() => {
                  const currentDays = formData.availableDays || [];
                  const days = currentDays.includes(day) 
                    ? currentDays.filter(d => d !== day)
                    : [...currentDays, day];
                  setFormData({...formData, availableDays: days});
                }}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-xl border transition-all",
                  (formData.availableDays || []).includes(day) ? "bg-emerald-600 border-emerald-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                )}
              >
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Preferencia de modalidad</label>
          <select 
            value={formData.preferredModality}
            onChange={e => setFormData({...formData, preferredModality: e.target.value as any})}
            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="any">Cualquiera</option>
            <option value="presencial">Presencial</option>
            <option value="teleformación">Teleformación</option>
            <option value="híbrido">Híbrido</option>
          </select>
        </div>
        <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2">
          {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? <><CheckCircle2 className="w-5 h-5" /> Guardado</> : 'Guardar Configuración'}
        </button>
      </form>
    </div>
  );
}

function CourseFormView({ userId, course, onSave, onCancel }: { userId: string, course?: Course | null, onSave: () => void, onCancel: () => void }) {
  const [formData, setFormData] = useState<Partial<Course>>({
    name: '',
    entity: '',
    modality: 'presencial',
    location: '',
    startDate: '',
    endDate: '',
    totalHours: 0,
    schedule: '',
    pricingType: 'hourly',
    price: 0,
    status: 'pendiente',
    color: COURSE_COLORS[0].name
  });

  useEffect(() => {
    if (course) {
      setFormData({
        ...course,
        color: course.color || COURSE_COLORS[0].name
      });
    } else {
      setFormData({
        name: '',
        entity: '',
        modality: 'presencial',
        location: '',
        startDate: '',
        endDate: '',
        totalHours: 0,
        schedule: '',
        pricingType: 'hourly',
        price: 0,
        status: 'pendiente',
        color: COURSE_COLORS[0].name
      });
    }
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      userId,
      createdAt: course?.createdAt || new Date().toISOString()
    } as Course;

    if (course?.id) {
      await updateCourse(course.id, data);
    } else {
      await addCourse(data);
    }
    
    onSave();
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">{course ? 'Editar Curso' : 'Nuevo Curso'}</h3>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Nombre del curso</label>
            <input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ej: React Avanzado" 
              required 
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Entidad / Centro</label>
            <input 
              value={formData.entity} 
              onChange={e => setFormData({...formData, entity: e.target.value})}
              placeholder="Ej: Academia Tech" 
              required 
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Modalidad</label>
            <select 
              value={formData.modality} 
              onChange={e => setFormData({...formData, modality: e.target.value as Modality})}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="presencial">Presencial</option>
              <option value="teleformación">Teleformación</option>
              <option value="híbrido">Híbrido</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Ciudad / Plataforma</label>
            <input
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              placeholder="Ej: Madrid o Zoom"
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Horario</label>
            <input
              value={formData.schedule}
              onChange={e => setFormData({...formData, schedule: e.target.value})}
              placeholder="Ej: Lunes y Miércoles 18:00-20:00"
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Inicio</label>
            <input 
              type="date" 
              value={formData.startDate} 
              onChange={e => setFormData({...formData, startDate: e.target.value})}
              required 
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Fin</label>
            <input 
              type="date" 
              value={formData.endDate} 
              onChange={e => setFormData({...formData, endDate: e.target.value})}
              required 
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Total horas</label>
            <input 
              type="number" 
              step="0.1" 
              value={formData.totalHours} 
              onChange={e => setFormData({...formData, totalHours: parseFloat(e.target.value) || 0})}
              placeholder="Total horas" 
              required 
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Estado</label>
            <select 
              value={formData.status} 
              onChange={e => setFormData({...formData, status: e.target.value as CourseStatus})}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="finalizado">Finalizado</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Tipo de Precio</label>
            <select 
              value={formData.pricingType} 
              onChange={e => setFormData({...formData, pricingType: e.target.value as PricingType})}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="hourly">Precio por hora</option>
              <option value="total">Precio total curso</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Importe (€)</label>
            <input 
              type="number" 
              value={formData.price} 
              onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
              placeholder="Importe (€)" 
              required 
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Color del curso</label>
            <div className="flex flex-wrap gap-3">
              {COURSE_COLORS.map(color => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setFormData({...formData, color: color.name})}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    color.dot,
                    formData.color === color.name ? "border-slate-900 scale-110" : "border-transparent hover:scale-105"
                  )}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
        <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg">
          {course ? 'Guardar Cambios' : 'Crear Curso'}
        </button>
      </form>
    </div>
  );
}

// --- Modals ---


