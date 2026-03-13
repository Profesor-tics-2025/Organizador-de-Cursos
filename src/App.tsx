import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar as CalendarIcon, 
  Briefcase, 
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
  X
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { 
  subscribeToCourses, 
  subscribeToSessions, 
  subscribeToOffers, 
  subscribeToSettings,
  addCourse,
  updateCourse,
  deleteCourse,
  addOffer,
  updateOffer,
  saveSettings,
  addSession,
  deleteSession
} from './services/firebaseService';
import { 
  Course, 
  Session, 
  Offer, 
  TeacherSettings, 
  DashboardStats,
  Modality,
  CourseStatus,
  PricingType
} from './types';
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
import { analyzeOffer, analyzeScheduleConflicts } from './services/geminiService';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

const StatCard = ({ label, value, icon: Icon, trend, color, onClick }: { label: string, value: string | number, icon: any, trend?: string, color: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      "p-6 bg-white border rounded-2xl border-slate-200 shadow-sm",
      onClick && "cursor-pointer hover:border-emerald-500 transition-all hover:shadow-md"
    )}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <h3 className="mt-2 text-3xl font-bold text-slate-900">{value}</h3>
        {trend && (
          <p className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {trend}
          </p>
        )}
      </div>
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon className="w-6 h-6 text-white" />
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [settings, setSettings] = useState<TeacherSettings | null>(null);
  const [scheduleAnalysis, setScheduleAnalysis] = useState<{ conflicts: { type: string, message: string, date: string, solution: string }[], summary: string } | null>(null);
  const [isAnalyzingSchedule, setIsAnalyzingSchedule] = useState(false);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Data Subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubCourses = subscribeToCourses(user.uid, setCourses);
    const unsubSessions = subscribeToSessions(user.uid, setSessions);
    const unsubOffers = subscribeToOffers(user.uid, setOffers);
    const unsubSettings = subscribeToSettings(user.uid, (s) => {
      if (!s) {
        const defaultSettings: TeacherSettings = {
          userId: user.uid,
          maxHoursPerWeek: 20,
          availableDays: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'],
          minHourlyRate: 25,
          preferredModality: 'any'
        };
        saveSettings(user.uid, defaultSettings);
      } else {
        setSettings(s);
      }
    });

    return () => {
      unsubCourses();
      unsubSessions();
      unsubOffers();
      unsubSettings();
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const runScheduleAnalysis = async () => {
    setIsAnalyzingSchedule(true);
    try {
      const result = await analyzeScheduleConflicts(courses, sessions, offers);
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
    const now = new Date();
    const startOfW = startOfWeek(now, { weekStartsOn: 1 });
    const endOfW = addDays(startOfW, 6);
    const startOfM = startOfMonth(now);
    const endOfM = endOfMonth(now);
    const startOfY = new Date(now.getFullYear(), 0, 1);

    const thisWeekSessions = sessions.filter(s => {
      const d = parseISO(s.date);
      return isWithinInterval(d, { start: startOfW, end: endOfW });
    });

    const thisMonthSessions = sessions.filter(s => {
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

    const activeCourses = courses.filter(c => c.status === 'confirmado').length;
    const upcomingCourses = courses.filter(c => isAfter(parseISO(c.startDate), now)).length;

    // Income
    const incomeThisMonth = courses.reduce((acc, c) => {
      if (c.status !== 'confirmado' && c.status !== 'finalizado') return acc;
      const start = parseISO(c.startDate);
      if (isWithinInterval(start, { start: startOfM, end: endOfM })) {
        return acc + (c.pricingType === 'hourly' ? c.price * c.totalHours : c.price);
      }
      return acc;
    }, 0);

    const incomeThisYear = courses.reduce((acc, c) => {
      if (c.status !== 'confirmado' && c.status !== 'finalizado') return acc;
      const start = parseISO(c.startDate);
      if (isAfter(start, startOfY)) {
        return acc + (c.pricingType === 'hourly' ? c.price * c.totalHours : c.price);
      }
      return acc;
    }, 0);

    // Overlaps (simple check)
    let overlaps = 0;
    sessions.forEach((s1, i) => {
      sessions.slice(i + 1).forEach(s2 => {
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl border border-slate-100 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-emerald-100 rounded-2xl">
              <Briefcase className="w-12 h-12 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">DocentePro</h1>
          <p className="text-slate-500 mb-8">Gestión profesional para docentes freelance. Organiza tus cursos, analiza ofertas y maximiza tus ingresos.</p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white font-semibold rounded-2xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-200"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continuar con Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Navigation (Bottom Bar) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40">
        <button onClick={() => setActiveTab('dashboard')} className={cn("p-2 rounded-xl", activeTab === 'dashboard' ? "text-emerald-600 bg-emerald-50" : "text-slate-400")}>
          <LayoutDashboard className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('courses')} className={cn("p-2 rounded-xl", activeTab === 'courses' ? "text-emerald-600 bg-emerald-50" : "text-slate-400")}>
          <BookOpen className="w-6 h-6" />
        </button>
        <button 
          onClick={() => {
            setActiveTab('courses');
            setTimeout(() => document.getElementById('add-course-modal')?.classList.remove('hidden'), 100);
          }}
          className="p-3 bg-emerald-600 text-white rounded-full shadow-lg -mt-12 border-4 border-slate-50"
        >
          <Plus className="w-7 h-7" />
        </button>
        <button onClick={() => setActiveTab('calendar')} className={cn("p-2 rounded-xl", activeTab === 'calendar' ? "text-emerald-600 bg-emerald-50" : "text-slate-400")}>
          <CalendarIcon className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('settings')} className={cn("p-2 rounded-xl", activeTab === 'settings' ? "text-emerald-600 bg-emerald-50" : "text-slate-400")}>
          <SettingsIcon className="w-6 h-6" />
        </button>
      </nav>

      {/* Sidebar (Desktop) */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900">DocentePro</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={BookOpen} label="Mis Cursos" active={activeTab === 'courses'} onClick={() => setActiveTab('courses')} />
          <SidebarItem icon={CalendarIcon} label="Calendario" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
          <SidebarItem icon={Briefcase} label="Ofertas" active={activeTab === 'offers'} onClick={() => setActiveTab('offers')} />
          <SidebarItem icon={SettingsIcon} label="Configuración" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-3 mb-4">
            <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border border-slate-200" alt={user.displayName || ''} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.displayName}</p>
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
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pb-24 lg:pb-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {activeTab === 'dashboard' && 'Panel de Control'}
              {activeTab === 'courses' && 'Gestión de Cursos'}
              {activeTab === 'calendar' && 'Calendario Docente'}
              {activeTab === 'offers' && 'Ofertas Recibidas'}
              {activeTab === 'settings' && 'Configuración'}
            </h2>
            <p className="text-slate-500">
              {activeTab === 'dashboard' && 'Bienvenido de nuevo, aquí tienes un resumen de tu actividad.'}
              {activeTab === 'courses' && 'Administra tus cursos actuales y finalizados.'}
              {activeTab === 'calendar' && 'Visualiza tu carga de trabajo y evita solapamientos.'}
              {activeTab === 'offers' && 'Evalúa nuevas oportunidades con ayuda de IA.'}
              {activeTab === 'settings' && 'Personaliza tus preferencias y límites de trabajo.'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <ClockDisplay />
            {activeTab === 'dashboard' && (
              <button 
                onClick={runScheduleAnalysis}
                disabled={isAnalyzingSchedule}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
              >
                {isAnalyzingSchedule ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <BrainCircuit className="w-5 h-5" />}
                Analizar Conflictos
              </button>
            )}
            {activeTab === 'courses' && (
              <button 
                onClick={() => document.getElementById('add-course-modal')?.classList.remove('hidden')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" /> Nuevo Curso
              </button>
            )}
            {activeTab === 'offers' && (
              <button 
                onClick={() => document.getElementById('add-offer-modal')?.classList.remove('hidden')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" /> Registrar Oferta
              </button>
            )}
          </div>
        </header>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <Dashboard stats={stats} courses={courses} sessions={sessions} onAnalyzeConflicts={runScheduleAnalysis} scheduleAnalysis={scheduleAnalysis} />}
        {activeTab === 'courses' && <CourseManagement courses={courses} sessions={sessions} userId={user.uid} />}
        {activeTab === 'calendar' && <Calendar sessions={sessions} courses={courses} />}
        {activeTab === 'offers' && <OfferManagement offers={offers} courses={courses} sessions={sessions} settings={settings} userId={user.uid} />}
        {activeTab === 'settings' && <Settings settings={settings} userId={user.uid} />}
      </main>

      {/* Modals (Hidden by default) */}
      <AddCourseModal userId={user.uid} />
      <AddOfferModal userId={user.uid} />
      
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
                  {scheduleAnalysis.conflicts.length > 0 ? (
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

function Dashboard({ stats, courses, sessions, onAnalyzeConflicts, scheduleAnalysis }: { 
  stats: DashboardStats, 
  courses: Course[], 
  sessions: Session[], 
  onAnalyzeConflicts: () => void,
  scheduleAnalysis: { conflicts: { type: string, message: string, date: string, solution: string }[], summary: string } | null
}) {
  const chartData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = new Date().getFullYear();
    
    return months.map((month, index) => {
      const monthStart = new Date(currentYear, index, 1);
      const monthEnd = endOfMonth(monthStart);
      
      const monthSessions = sessions.filter(s => {
        const d = parseISO(s.date);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
      });

      const hours = monthSessions.reduce((acc, s) => {
        const start = parseISO(`${s.date}T${s.startTime}`);
        const end = parseISO(`${s.date}T${s.endTime}`);
        return acc + differenceInHours(end, start);
      }, 0);

      const income = courses.reduce((acc, c) => {
        if (c.status !== 'confirmado' && c.status !== 'finalizado') return acc;
        const start = parseISO(c.startDate);
        if (isWithinInterval(start, { start: monthStart, end: monthEnd })) {
          return acc + (c.pricingType === 'hourly' ? c.price * c.totalHours : c.price);
        }
        return acc;
      }, 0);

      return { name: month, horas: hours, ingresos: income };
    });
  }, [courses, sessions]);

  const conflictStats = useMemo(() => {
    if (!scheduleAnalysis) return null;
    return {
      errors: scheduleAnalysis.conflicts.filter(c => c.type === 'error').length,
      warnings: scheduleAnalysis.conflicts.filter(c => c.type === 'warning').length
    };
  }, [scheduleAnalysis]);

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Horas esta semana" value={`${stats.hoursThisWeek}h`} icon={Clock} color="bg-blue-500" trend="+12% vs semana pasada" />
        <StatCard label="Ingresos este mes" value={`${stats.incomeThisMonth}€`} icon={Euro} color="bg-emerald-500" trend="+5% vs mes pasado" />
        <StatCard label="Cursos activos" value={stats.activeCourses} icon={BookOpen} color="bg-violet-500" />
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
        />
      </div>

      {/* Quick Actions */}
      <div className="p-6 bg-emerald-600 rounded-3xl shadow-lg shadow-emerald-200 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold mb-1">¿Tienes un nuevo curso?</h3>
          <p className="text-emerald-50 opacity-90">Regístralo ahora para organizar tu calendario y calcular tus beneficios.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => document.getElementById('add-course-modal')?.classList.remove('hidden')}
            className="flex-1 md:flex-none px-6 py-3 bg-white text-emerald-700 font-bold rounded-2xl hover:bg-emerald-50 transition-colors shadow-sm"
          >
            Añadir Nuevo Curso
          </button>
          <button 
            onClick={() => document.getElementById('add-offer-modal')?.classList.remove('hidden')}
            className="flex-1 md:flex-none px-6 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-colors border border-emerald-400"
          >
            Registrar Oferta
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Actividad Anual</h3>
            <div className="flex gap-4 text-xs font-medium">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> Ingresos (€)</div>
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
                <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="horas" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Próximas Sesiones</h3>
          <div className="space-y-4">
            {sessions
              .filter(s => isAfter(parseISO(s.date), new Date()))
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 5)
              .map(session => {
                const course = courses.find(c => c.id === session.courseId);
                return (
                  <div key={session.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-emerald-50 text-emerald-700 rounded-xl font-bold">
                      <span className="text-xs uppercase">{format(parseISO(session.date), 'MMM', { locale: es })}</span>
                      <span className="text-lg">{format(parseISO(session.date), 'dd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{course?.name || 'Curso desconocido'}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {session.startTime} - {session.endTime} • {course?.entity}
                      </p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-slate-200 group-hover:text-emerald-500 transition-colors" />
                  </div>
                );
              })}
            {sessions.length === 0 && (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No hay sesiones programadas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseManagement({ courses, sessions, userId }: { courses: Course[], sessions: Session[], userId: string }) {
  const [filter, setFilter] = useState<CourseStatus | 'todos'>('todos');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const filteredCourses = courses.filter(c => filter === 'todos' || c.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {['todos', 'pendiente', 'confirmado', 'finalizado', 'oferta recibida'].map((s) => (
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
              const courseSessions = sessions.filter(s => s.courseId === course.id);
              const hasOverlap = courseSessions.some(s1 => 
                sessions.some(s2 => 
                  s1.id !== s2.id && 
                  s1.date === s2.date && 
                  ((s1.startTime >= s2.startTime && s1.startTime < s2.endTime) ||
                   (s1.endTime > s2.startTime && s1.endTime <= s2.endTime))
                )
              );

              return (
                <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{course.name}</p>
                    <p className="text-xs text-slate-500">{course.modality} • {course.location}</p>
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
                      course.status === 'pendiente' && "bg-amber-100 text-amber-700",
                      course.status === 'oferta recibida' && "bg-slate-100 text-slate-700"
                    )}>
                      {course.status}
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
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteCourse(course.id!)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                {sessions
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
    </div>
  );
}

function Calendar({ sessions, courses }: { sessions: Session[], courses: Course[] }) {
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
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200">
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200">
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 border-b border-slate-100">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
          <div key={d} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-[120px]">
        {days.map((day, i) => {
          const daySessions = sessions.filter(s => isSameDay(parseISO(s.date), day));
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          
          return (
            <div key={i} className={cn(
              "border-r border-b border-slate-100 p-2 transition-colors",
              !isCurrentMonth && "bg-slate-50/50",
              isSameDay(day, new Date()) && "bg-emerald-50/30"
            )}>
              <div className={cn(
                "text-xs font-bold mb-2 w-6 h-6 flex items-center justify-center rounded-full",
                isSameDay(day, new Date()) ? "bg-emerald-600 text-white" : "text-slate-400"
              )}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                {daySessions.map(s => {
                  const course = courses.find(c => c.id === s.courseId);
                  return (
                    <div key={s.id} className="px-2 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-md truncate border border-emerald-200 flex items-center gap-1">
                      <Clock className="w-2 h-2" /> {s.startTime} {course?.name}
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

function OfferManagement({ offers, courses, sessions, settings, userId }: { offers: Offer[], courses: Course[], sessions: Session[], settings: TeacherSettings | null, userId: string }) {
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const handleAnalyze = async (offer: Offer) => {
    if (!settings) return;
    setAnalyzing(offer.id!);
    const result = await analyzeOffer(offer, courses, sessions, settings);
    await updateOffer(offer.id!, {
      aiRecommendation: result.recommendation,
      aiExplanation: result.explanation,
      status: 'evaluando'
    });
    setAnalyzing(null);
  };

  const handleAccept = async (offer: Offer) => {
    // Convert offer to course
    await addCourse({
      name: offer.courseName,
      entity: offer.entity,
      modality: 'presencial', // default
      location: 'Por definir',
      startDate: offer.startDate,
      endDate: offer.endDate,
      totalHours: offer.duration,
      schedule: offer.schedule,
      pricingType: 'total',
      price: offer.remuneration,
      status: 'confirmado',
      userId,
      createdAt: new Date().toISOString()
    });
    await updateOffer(offer.id!, { status: 'aceptada' });
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {offers.map(offer => (
        <div key={offer.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row">
          <div className="p-6 flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{offer.entity}</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">{offer.courseName}</h3>
              </div>
              <span className={cn(
                "px-3 py-1 text-xs font-bold rounded-full uppercase",
                offer.status === 'oferta recibida' && "bg-slate-100 text-slate-600",
                offer.status === 'evaluando' && "bg-blue-100 text-blue-600",
                offer.status === 'aceptada' && "bg-emerald-100 text-emerald-600",
                offer.status === 'rechazada' && "bg-red-100 text-red-600"
              )}>
                {offer.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2 text-slate-500">
                <CalendarIcon className="w-4 h-4" />
                <span className="text-sm">{format(parseISO(offer.startDate), 'dd/MM/yy')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{offer.duration}h • {offer.schedule}</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <Euro className="w-4 h-4" />
                <span className="text-sm">{offer.remuneration}€</span>
              </div>
            </div>

            {offer.aiRecommendation && (
              <div className={cn(
                "p-4 rounded-2xl border mb-6",
                offer.aiRecommendation === 'recomendable aceptar' ? "bg-emerald-50 border-emerald-100" :
                offer.aiRecommendation === 'aceptable con ajustes' ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <BrainCircuit className={cn("w-5 h-5", 
                    offer.aiRecommendation === 'recomendable aceptar' ? "text-emerald-600" :
                    offer.aiRecommendation === 'aceptable con ajustes' ? "text-amber-600" : "text-red-600"
                  )} />
                  <span className="text-sm font-bold uppercase tracking-tight">Análisis de IA: {offer.aiRecommendation}</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{offer.aiExplanation}</p>
              </div>
            )}

            <div className="flex gap-3">
              {offer.status === 'oferta recibida' && (
                <button 
                  onClick={() => handleAnalyze(offer)}
                  disabled={analyzing === offer.id}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {analyzing === offer.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <BrainCircuit className="w-4 h-4" />}
                  Analizar con IA
                </button>
              )}
              {offer.status !== 'aceptada' && offer.status !== 'rechazada' && (
                <>
                  <button 
                    onClick={() => handleAccept(offer)}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all"
                  >
                    Aceptar Oferta
                  </button>
                  <button 
                    onClick={() => updateOffer(offer.id!, { status: 'rechazada' })}
                    className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Rechazar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
      {offers.length === 0 && (
        <div className="p-20 text-center bg-white border border-slate-200 rounded-3xl">
          <Briefcase className="w-16 h-16 text-slate-100 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No hay ofertas registradas</h3>
          <p className="text-slate-500">Registra las ofertas que recibes de centros para analizarlas.</p>
        </div>
      )}
    </div>
  );
}

function Settings({ settings, userId }: { settings: TeacherSettings | null, userId: string }) {
  const [formData, setFormData] = useState<TeacherSettings>(settings || {
    userId,
    maxHoursPerWeek: 20,
    availableDays: [],
    minHourlyRate: 25,
    preferredModality: 'any'
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
                  const days = formData.availableDays.includes(day) 
                    ? formData.availableDays.filter(d => d !== day)
                    : [...formData.availableDays, day];
                  setFormData({...formData, availableDays: days});
                }}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-xl border transition-all",
                  formData.availableDays.includes(day) ? "bg-emerald-600 border-emerald-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
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

// --- Modals ---

function AddCourseModal({ userId }: { userId: string }) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const schedule = startTime && endTime ? `${startTime} - ${endTime}` : '';

    await addCourse({
      name: formData.get('name') as string,
      entity: formData.get('entity') as string,
      modality: formData.get('modality') as Modality,
      location: formData.get('location') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      totalHours: parseFloat(formData.get('totalHours') as string),
      schedule,
      pricingType: formData.get('pricingType') as PricingType,
      price: parseInt(formData.get('price') as string),
      status: 'pendiente',
      userId,
      createdAt: new Date().toISOString()
    });
    
    form.reset();
    document.getElementById('add-course-modal')?.classList.add('hidden');
  };

  return (
    <div id="add-course-modal" className="fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Nuevo Curso</h3>
          <button onClick={() => document.getElementById('add-course-modal')?.classList.add('hidden')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" placeholder="Nombre del curso" required className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            <input name="entity" placeholder="Entidad / Centro" required className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            <select name="modality" className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="presencial">Presencial</option>
              <option value="teleformación">Teleformación</option>
              <option value="híbrido">Híbrido</option>
            </select>
            <input name="location" placeholder="Ciudad / Plataforma" className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Inicio</label>
              <input type="date" name="startDate" required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Fin</label>
              <input type="date" name="endDate" required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Total horas</label>
              <input type="number" step="0.1" name="totalHours" placeholder="Total horas" required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Horario General</label>
              <div className="flex items-center gap-2">
                <input type="time" name="startTime" className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                <span className="text-slate-400">-</span>
                <input type="time" name="endTime" className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <select name="pricingType" className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="hourly">Precio por hora</option>
              <option value="total">Precio total curso</option>
            </select>
            <input type="number" name="price" placeholder="Importe (€)" required className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg">
            Crear Curso
          </button>
        </form>
      </div>
    </div>
  );
}

function AddOfferModal({ userId }: { userId: string }) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const schedule = startTime && endTime ? `${startTime} - ${endTime}` : '';

    await addOffer({
      entity: formData.get('entity') as string,
      courseName: formData.get('courseName') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      schedule,
      duration: parseFloat(formData.get('duration') as string),
      remuneration: parseInt(formData.get('remuneration') as string),
      status: 'oferta recibida',
      userId,
      createdAt: new Date().toISOString()
    });
    
    form.reset();
    document.getElementById('add-offer-modal')?.classList.add('hidden');
  };

  return (
    <div id="add-offer-modal" className="fixed inset-0 z-50 hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Registrar Oferta</h3>
          <button onClick={() => document.getElementById('add-offer-modal')?.classList.add('hidden')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <input name="entity" placeholder="Entidad / Centro" required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          <input name="courseName" placeholder="Nombre del curso" required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Inicio</label>
              <input type="date" name="startDate" required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase">Fin</label>
              <input type="date" name="endDate" required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Horario Previsto</label>
            <div className="flex items-center gap-2">
              <input type="time" name="startTime" className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
              <span className="text-slate-400">-</span>
              <input type="time" name="endTime" className="flex-1 p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" step="0.1" name="duration" placeholder="Horas totales" required className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
            <input type="number" name="remuneration" placeholder="Remuneración (€)" required className="p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg">
            Registrar Oferta
          </button>
        </form>
      </div>
    </div>
  );
}
