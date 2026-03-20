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
  Users,
  Eye,
  ArrowLeft,
  Search,
  Mail,
  Phone,
  MapPin
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
  User,
  Holiday,
  Vacation,
  CalendarSettings
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

function ClientManagement({ 
  clients, 
  onAdd, 
  onUpdate, 
  onDelete 
}: { 
  clients: Client[], 
  onAdd?: (client: Client) => void,
  onUpdate?: (id: string, client: Client) => void,
  onDelete?: (id: string) => void
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'userId'>>({
    name: '',
    email: '',
    phone: '',
    nif: '',
    address: '',
  });

  const filteredClients = (clients || []).filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone,
        nif: client.nif,
        address: client.address,
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        nif: '',
        address: '',
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      nif: '',
      address: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('El nombre del cliente es requerido');
      return;
    }

    if (editingClient && editingClient.id && onUpdate) {
      onUpdate(editingClient.id, {
        ...editingClient,
        ...formData,
      });
    } else if (onAdd) {
      onAdd({
        ...formData,
        userId: '',
      } as Client);
    }

    handleCloseForm();
  };

  const handleDelete = (id: string | undefined) => {
    if (!id) return;
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      onDelete?.(id);
      if (selectedClient?.id === id) {
        setSelectedClient(null);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Clientes</h1>
          <p className="mt-1 text-slate-600">Administra tu base de datos de clientes</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clients Table/List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {filteredClients.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">
                  {(clients || []).length === 0 
                    ? 'No tienes clientes aún. ¡Crea el primero!' 
                    : 'No se encontraron clientes'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Teléfono</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">NIF</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr 
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer ${
                          selectedClient?.id === client.id ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">{client.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{client.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{client.phone}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{client.nif}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenForm(client);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(client.id);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Client Details Panel */}
        {selectedClient && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 h-fit">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Detalles</h3>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">Nombre</label>
                <p className="mt-1 text-slate-900 font-medium">{selectedClient.name}</p>
              </div>

              {/* NIF */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase">NIF</label>
                <p className="mt-1 text-slate-900 font-medium">{selectedClient.nif || '-'}</p>
              </div>

              {/* Email */}
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <label className="text-xs font-semibold text-slate-600 uppercase">Email</label>
                </div>
                <a 
                  href={`mailto:${selectedClient.email}`}
                  className="text-emerald-600 hover:underline break-all"
                >
                  {selectedClient.email || '-'}
                </a>
              </div>

              {/* Phone */}
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <label className="text-xs font-semibold text-slate-600 uppercase">Teléfono</label>
                </div>
                <a 
                  href={`tel:${selectedClient.phone}`}
                  className="text-emerald-600 hover:underline"
                >
                  {selectedClient.phone || '-'}
                </a>
              </div>

              {/* Address */}
              {selectedClient.address && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <label className="text-xs font-semibold text-slate-600 uppercase">Dirección</label>
                  </div>
                  <p className="text-slate-900 text-sm break-all">{selectedClient.address}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleOpenForm(selectedClient)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(selectedClient.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nombre del cliente"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* NIF */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  NIF/DNI
                </label>
                <input
                  type="text"
                  name="nif"
                  value={formData.nif}
                  onChange={handleInputChange}
                  placeholder="NIF o DNI del cliente"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@ejemplo.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Teléfono del cliente"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dirección
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Dirección completa del cliente"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                >
                  {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
        {activeTab === 'clients' && <ClientManagement clients={clients} onAdd={addClient} onUpdate={updateClient} onDelete={deleteClient} />}
        {activeTab === 'integrations' && <Integrations />}
        {activeTab === 'settings' && <Settings settings={settings} userId={user.id} user={user} setUser={setUser} />}
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

  const invoiceNumber = useMemo(() => `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`, [selectedCourseId]);

  const generatePDF = () => {
    if (!selectedCourse) return;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    let y = 20;

    // Header bar
    pdf.setFillColor(16, 185, 129); // emerald-500
    pdf.rect(0, 0, pageW, 14, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FACTURA', 14, 9.5);
    pdf.text(invoiceNumber, pageW - 14, 9.5, { align: 'right' });

    y = 28;
    pdf.setTextColor(30, 30, 30);

    // Teacher info
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(user.name || 'Docente', 14, y);
    y += 6;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(user.email || '', 14, y);
    if (settings?.bankAccount) { y += 5; pdf.text(`IBAN: ${settings.bankAccount}`, 14, y); }

    // Date
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Fecha: ${format(new Date(), 'd MMM yyyy', { locale: es })}`, pageW - 14, 28, { align: 'right' });

    // Divider
    y += 10;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(14, y, pageW - 14, y);
    y += 10;

    // Client / course info
    pdf.setTextColor(30, 30, 30);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FACTURAR A', 14, y);
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.text(selectedCourse.entity, 14, y);
    y += 5;
    pdf.text(`Curso: ${selectedCourse.name}`, 14, y);
    y += 5;
    pdf.text(`Modalidad: ${selectedCourse.modality}  |  Localización: ${selectedCourse.location || '—'}`, 14, y);
    y += 5;
    pdf.text(`Periodo: ${format(parseISO(selectedCourse.startDate), 'd MMM yyyy', { locale: es })} – ${format(parseISO(selectedCourse.endDate), 'd MMM yyyy', { locale: es })}`, 14, y);

    // Sessions table header
    y += 12;
    pdf.setFillColor(245, 247, 250);
    pdf.rect(14, y - 5, pageW - 28, 8, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);
    pdf.text('Fecha', 16, y);
    pdf.text('Inicio', 65, y);
    pdf.text('Fin', 90, y);
    pdf.text('Horas', 115, y);
    pdf.text('Contenido', 135, y);
    y += 6;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(14, y, pageW - 14, y);

    // Sessions rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(40, 40, 40);
    let totalHours = 0;
    courseSessions.forEach((s, idx) => {
      y += 6;
      if (y > 265) { pdf.addPage(); y = 20; }
      if (idx % 2 === 0) { pdf.setFillColor(252, 252, 252); pdf.rect(14, y - 4, pageW - 28, 6, 'F'); }
      const hrs = differenceInHours(parseISO(`${s.date}T${s.endTime}`), parseISO(`${s.date}T${s.startTime}`));
      totalHours += hrs;
      pdf.text(format(parseISO(s.date), 'd MMM yyyy', { locale: es }), 16, y);
      pdf.text(s.startTime, 65, y);
      pdf.text(s.endTime, 90, y);
      pdf.text(`${hrs}h`, 115, y);
      pdf.text((s.content || '—').slice(0, 35), 135, y);
    });

    // Totals
    y += 12;
    pdf.setDrawColor(220, 220, 220);
    pdf.line(14, y, pageW - 14, y);
    y += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);
    if (selectedCourse.pricingType === 'hourly') {
      pdf.text(`Total horas: ${totalHours}h  ×  ${selectedCourse.price}€/h`, pageW - 14, y, { align: 'right' });
      y += 6;
    }
    const tax = totalAmount * 0.21;
    const subtotal = totalAmount;
    pdf.text(`Base imponible: ${subtotal.toFixed(2)}€`, pageW - 14, y, { align: 'right' });
    y += 6;
    pdf.text(`IVA (21%): ${tax.toFixed(2)}€`, pageW - 14, y, { align: 'right' });
    y += 8;
    pdf.setFillColor(16, 185, 129);
    pdf.rect(pageW - 70, y - 6, 56, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(`TOTAL: ${(subtotal + tax).toFixed(2)}€`, pageW - 14, y + 1, { align: 'right' });

    pdf.save(`factura_${invoiceNumber}.pdf`);
  };

  const sendByEmail = () => {
    if (!selectedCourse) return;
    const tax = totalAmount * 0.21;
    const subject = encodeURIComponent(`Factura ${invoiceNumber} - ${selectedCourse.name}`);
    const body = encodeURIComponent(
      `Estimado/a,\n\nAdjunto encontrará la factura correspondiente al curso "${selectedCourse.name}".\n\n` +
      `N.º Factura: ${invoiceNumber}\n` +
      `Curso: ${selectedCourse.name}\n` +
      `Entidad: ${selectedCourse.entity}\n` +
      `Periodo: ${format(parseISO(selectedCourse.startDate), 'd MMM yyyy', { locale: es })} – ${format(parseISO(selectedCourse.endDate), 'd MMM yyyy', { locale: es })}\n` +
      `Sesiones: ${courseSessions.length}\n` +
      `Base imponible: ${totalAmount.toFixed(2)}€\n` +
      `IVA (21%): ${tax.toFixed(2)}€\n` +
      `TOTAL: ${(totalAmount + tax).toFixed(2)}€\n\n` +
      `Un saludo,\n${user.name}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

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
              onClick={generatePDF}
              disabled={!selectedCourseId}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Generar PDF de Factura
            </button>
            <button
              onClick={sendByEmail}
              disabled={!selectedCourseId}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-100 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <Mail className="w-5 h-5" />
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

  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

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

  const invoiceContainerRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    const input = invoiceContainerRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`factura_${invoiceNumber}.pdf`);
  };

  const viewInvoiceInNewWindow = () => {
    setShowInvoicePreview(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between px-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex gap-3">
          {!showInvoicePreview && (
            <button 
              onClick={viewInvoiceInNewWindow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Eye className="w-4 h-4" />
              Ver Factura
            </button>
          )}
          {showInvoicePreview && (
            <button 
              onClick={() => setShowInvoicePreview(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-xl font-bold hover:bg-slate-700 transition-all shadow-lg shadow-slate-100"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
          )}
          <button 
            onClick={() => setActiveTab('clients')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
          >
            <Users className="w-4 h-4" />
            Clientes
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

      {!showInvoicePreview ? (
        // ZONA DE CONFIGURACIÓN
        <div className="flex flex-col gap-3 px-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
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
      ) : (
        // ZONA DE VISTA PREVIA DE FACTURA
        <div className="w-full bg-slate-50 p-4 rounded-xl min-h-screen flex items-center justify-center">
      <div className="a4-container" ref={invoiceContainerRef}>
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
      )}
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
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const sessionHours = (s: Session) => {
    try {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      return Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
    } catch { return 0; }
  };

  const conflictStats = useMemo(() => {
    if (!scheduleAnalysis) return null;
    const conflicts = scheduleAnalysis.conflicts || [];
    return {
      errors: conflicts.filter(c => c.type === 'error').length,
      warnings: conflicts.filter(c => c.type === 'warning').length
    };
  }, [scheduleAnalysis]);

  const courseMap = useMemo(() => Object.fromEntries(courses.map(c => [c.id, c])), [courses]);

  const upcomingCourses = useMemo(() =>
    courses.filter(c => c.status !== 'finalizado' && c.endDate >= todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 4),
    [courses, todayStr]);

  const upcomingSessions = useMemo(() =>
    sessions.filter(s => s.date >= todayStr && s.status === 'pendiente')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).slice(0, 5),
    [sessions, todayStr]);

  const recentSessions = useMemo(() =>
    sessions.filter(s => s.date < todayStr && s.status === 'impartida')
      .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3),
    [sessions, todayStr]);

  // ── Gráfico de ingresos: últimos 6 meses ──
  const incomeByMonth = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(today, 5 - i);
      const monthStr = format(d, 'yyyy-MM');
      const income = courses
        .filter(c => c.startDate.startsWith(monthStr))
        .reduce((sum, c) => sum + (c.pricingType === 'hourly' ? c.price * c.totalHours : c.price), 0);
      return { label: format(d, 'MMM', { locale: es }), income };
    });
  }, [courses]);

  const maxIncome = Math.max(...incomeByMonth.map(m => m.income), 1);

  // ── Carga semanal: horas de sesión por día esta semana ──
  const weekDays = useMemo(() => {
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(monday, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const hours = sessions
        .filter(s => s.date === dayStr)
        .reduce((sum, s) => sum + sessionHours(s), 0);
      return { label: format(day, 'EEE', { locale: es }), dayStr, hours, isToday: dayStr === todayStr };
    });
  }, [sessions, todayStr]);

  const maxWeekHours = Math.max(...weekDays.map(d => d.hours), 1);

  // ── Progreso de cursos activos ──
  const courseProgress = useMemo(() =>
    courses
      .filter(c => c.status !== 'finalizado')
      .map(c => {
        const all = sessions.filter(s => s.courseId === c.id);
        const done = all.filter(s => s.status === 'impartida').length;
        const total = all.length;
        const hoursLogged = sessions.filter(s => s.courseId === c.id && s.status === 'impartida').reduce((sum, s) => sum + sessionHours(s), 0);
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return { course: c, done, total, pct, hoursLogged };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5),
    [courses, sessions]);

  const statusColors: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-700',
    confirmado: 'bg-emerald-100 text-emerald-700',
    finalizado: 'bg-slate-100 text-slate-500',
  };

  const kpis = [
    { label: 'Horas semana', value: `${stats.hoursThisWeek}h`, icon: Clock, color: 'bg-blue-500', sub: `${stats.hoursThisMonth}h este mes`, tab: 'hours' as const },
    { label: 'Ingresos mes', value: `${stats.incomeThisMonth.toLocaleString('es-ES')}€`, icon: Euro, color: 'bg-emerald-500', sub: `${stats.incomeThisYear.toLocaleString('es-ES')}€ este año`, tab: 'income' as const },
    { label: 'Cursos activos', value: stats.activeCourses, icon: BookOpen, color: 'bg-violet-500', sub: `${stats.upcomingCourses} próximos`, tab: 'courses' as const },
    { label: 'Conflictos', value: conflictStats ? (conflictStats.errors + conflictStats.warnings === 0 ? '✓ OK' : `${conflictStats.errors + conflictStats.warnings}`) : '—', icon: AlertTriangle, color: conflictStats ? (conflictStats.errors > 0 ? 'bg-red-500' : conflictStats.warnings > 0 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-400', sub: conflictStats ? (conflictStats.errors > 0 ? `${conflictStats.errors} críticos` : conflictStats.warnings > 0 ? `${conflictStats.warnings} avisos` : 'Sin problemas') : 'Toca para analizar', tab: null as any, onClick: onAnalyzeConflicts },
  ];

  return (
    <div className="space-y-4">

      {/* ── KPIs: 2 cols móvil, 4 cols tablet+ ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label}
            onClick={k.onClick ?? (k.tab ? () => setActiveTab(k.tab) : undefined)}
            className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide leading-tight">{k.label}</span>
              <div className={cn("w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0", k.color)}>
                <k.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{k.value}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Gráfico ingresos + Carga semanal: apilados móvil, 2/3+1/3 desktop ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Gráfico de ingresos (últimos 6 meses) */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <Euro className="w-4 h-4 text-emerald-500" /> Ingresos últimos 6 meses
            </h3>
            <button onClick={() => setActiveTab('income')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">Ver más →</button>
          </div>
          <div className="flex items-end gap-2 h-28 sm:h-36">
            {incomeByMonth.map((m, i) => {
              const barH = maxIncome > 0 ? Math.max((m.income / maxIncome) * 100, m.income > 0 ? 8 : 0) : 0;
              const isLast = i === incomeByMonth.length - 1;
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  {m.income > 0 && (
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 leading-none">
                      {m.income >= 1000 ? `${(m.income/1000).toFixed(1)}k` : m.income}€
                    </span>
                  )}
                  <div className="w-full flex items-end" style={{ height: '100%' }}>
                    <div
                      className={cn("w-full rounded-t-lg transition-all", isLast ? "bg-emerald-500" : "bg-emerald-200")}
                      style={{ height: `${barH}%`, minHeight: m.income > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400 capitalize">{m.label}</span>
                </div>
              );
            })}
          </div>
          {incomeByMonth.every(m => m.income === 0) && (
            <p className="text-xs text-slate-400 text-center mt-2">Sin ingresos registrados aún</p>
          )}
        </div>

        {/* Carga semanal */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Clock className="w-4 h-4 text-blue-500" /> Carga esta semana
          </h3>
          <div className="flex items-end gap-1.5 h-28 sm:h-36">
            {weekDays.map(d => {
              const barH = d.hours > 0 ? Math.max((d.hours / maxWeekHours) * 100, 10) : 0;
              return (
                <div key={d.dayStr} className="flex-1 flex flex-col items-center gap-1">
                  {d.hours > 0 && (
                    <span className={cn("text-[9px] font-bold leading-none", d.isToday ? "text-blue-600" : "text-slate-500")}>
                      {d.hours % 1 === 0 ? d.hours : d.hours.toFixed(1)}h
                    </span>
                  )}
                  <div className="w-full flex items-end" style={{ height: '100%' }}>
                    <div
                      className={cn("w-full rounded-t-md transition-all", d.isToday ? "bg-blue-500" : d.hours > 0 ? "bg-blue-200" : "bg-slate-100")}
                      style={{ height: d.hours > 0 ? `${barH}%` : '4px', minHeight: '4px' }}
                    />
                  </div>
                  <span className={cn("text-[9px] sm:text-[10px] font-semibold capitalize", d.isToday ? "text-blue-600" : "text-slate-400")}>
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-400">
            <span>Total semana</span>
            <span className="font-bold text-slate-700">{weekDays.reduce((s, d) => s + d.hours, 0).toFixed(1)}h</span>
          </div>
        </div>
      </div>

      {/* ── Progreso de cursos: full width ── */}
      {courseProgress.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="w-4 h-4 text-violet-500" /> Progreso de cursos
            </h3>
            <button onClick={() => setActiveTab('courses')} className="text-xs font-semibold text-violet-600 hover:text-violet-700">Ver todos →</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {courseProgress.map(({ course: c, done, total, pct, hoursLogged }) => (
              <div key={c.id} className="space-y-2 p-3 bg-slate-50 rounded-xl">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: c.color || '#8b5cf6' }} />
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate leading-tight">{c.name}</p>
                  </div>
                  <span className="text-xs font-black text-violet-600 flex-shrink-0">{pct}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: c.color || '#8b5cf6' }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{done}/{total} sesiones</span>
                  <span>{hoursLogged.toFixed(1)}h impartidas</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Próximos cursos + Próximas sesiones: apilados móvil, 2 cols tablet+ ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <BookOpen className="w-4 h-4 text-violet-500" /> Próximos cursos
            </h3>
            <button onClick={() => setActiveTab('courses')} className="text-xs font-semibold text-violet-600">Ver todos →</button>
          </div>
          {upcomingCourses.length === 0 ? (
            <div className="text-center py-5 text-slate-400">
              <BookOpen className="w-7 h-7 mx-auto mb-1.5 opacity-30" />
              <p className="text-xs">No hay cursos próximos</p>
              <button onClick={() => setActiveTab('courses')} className="mt-1.5 text-xs font-semibold text-violet-600 hover:underline">Crear curso</button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {upcomingCourses.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: c.color || '#8b5cf6' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400">{c.entity} · {format(parseISO(c.startDate), 'd MMM', { locale: es })}</p>
                  </div>
                  <span className={cn("text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize flex-shrink-0", statusColors[c.status])}>{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <CalendarIcon className="w-4 h-4 text-blue-500" /> Próximas sesiones
            </h3>
            <button onClick={() => setActiveTab('calendar')} className="text-xs font-semibold text-blue-600">Calendario →</button>
          </div>
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-5 text-slate-400">
              <CalendarIcon className="w-7 h-7 mx-auto mb-1.5 opacity-30" />
              <p className="text-xs">No hay sesiones pendientes</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {upcomingSessions.map(s => {
                const course = courseMap[s.courseId];
                return (
                  <div key={s.id} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="text-center flex-shrink-0 w-8">
                      <p className="text-xs font-bold text-blue-600 leading-none">{format(parseISO(s.date), 'd')}</p>
                      <p className="text-[9px] text-slate-400 uppercase">{format(parseISO(s.date), 'MMM', { locale: es })}</p>
                    </div>
                    <div className="w-px h-7 bg-slate-100 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{course?.name || 'Sesión'}</p>
                      <p className="text-[10px] text-slate-400">{s.startTime} – {s.endTime}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Sesiones recientes + Acceso rápido: apilados móvil, 2/3+1/3 desktop ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sesiones recientes
          </h3>
          {recentSessions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Sin sesiones impartidas aún</p>
          ) : (
            <div className="space-y-1.5">
              {recentSessions.map(s => {
                const course = courseMap[s.courseId];
                const h = sessionHours(s);
                return (
                  <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{course?.name || 'Sesión'}</p>
                      <p className="text-[10px] text-slate-400">{format(parseISO(s.date), "d 'de' MMMM", { locale: es })}</p>
                    </div>
                    {h > 0 && <span className="text-xs font-bold text-emerald-600 flex-shrink-0">{h}h</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5">
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <TrendingUp className="w-4 h-4 text-slate-500" /> Acceso rápido
          </h3>
          {/* móvil: grid 2 cols; md+: lista vertical */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {[
              { label: 'Nuevo curso', icon: BookOpen, color: 'text-violet-600 bg-violet-50 hover:bg-violet-100', tab: 'new-course' as any },
              { label: 'Calendario', icon: CalendarIcon, color: 'text-blue-600 bg-blue-50 hover:bg-blue-100', tab: 'calendar' as const },
              { label: 'Clientes', icon: Users, color: 'text-slate-600 bg-slate-50 hover:bg-slate-100', tab: 'clients' as const },
              { label: 'Nueva factura', icon: Euro, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100', tab: 'invoices' as const },
              { label: 'Conflictos', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 hover:bg-amber-100', onClick: onAnalyzeConflicts },
            ].map(item => (
              <button key={item.label}
                onClick={item.onClick ?? (() => setActiveTab(item.tab))}
                className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all", item.color)}>
                <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
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

const CALENDAR_SETTINGS_KEY = 'calendarSettings';

const CAL_COLORS = [
  { name: 'orange',  bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  dot: 'bg-orange-400',  label: 'Naranja'  },
  { name: 'red',     bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-400',     label: 'Rojo'     },
  { name: 'pink',    bg: 'bg-pink-50',    border: 'border-pink-200',    text: 'text-pink-700',    dot: 'bg-pink-400',    label: 'Rosa'     },
  { name: 'purple',  bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700',  dot: 'bg-purple-400',  label: 'Morado'   },
  { name: 'sky',     bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-700',     dot: 'bg-sky-400',     label: 'Celeste'  },
  { name: 'teal',    bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700',    dot: 'bg-teal-400',    label: 'Verde'    },
  { name: 'yellow',  bg: 'bg-yellow-50',  border: 'border-yellow-200',  text: 'text-yellow-700',  dot: 'bg-yellow-400',  label: 'Amarillo' },
  { name: 'slate',   bg: 'bg-slate-100',  border: 'border-slate-200',   text: 'text-slate-600',   dot: 'bg-slate-400',   label: 'Gris'     },
];

function getCalColor(name?: string) {
  return CAL_COLORS.find(c => c.name === name) ?? CAL_COLORS[0];
}

function loadCalendarSettings(): CalendarSettings {
  try {
    const raw = localStorage.getItem(CALENDAR_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        highlightWeekends: parsed.highlightWeekends ?? true,
        holidays: Array.isArray(parsed.holidays) ? parsed.holidays : [],
        vacations: Array.isArray(parsed.vacations) ? parsed.vacations : [],
      };
    }
  } catch {}
  return { highlightWeekends: true, holidays: [], vacations: [] };
}

function saveCalendarSettings(s: CalendarSettings) {
  localStorage.setItem(CALENDAR_SETTINGS_KEY, JSON.stringify(s));
}

function icsDate(date: string, time?: string) {
  const d = date.replace(/-/g, '');
  if (!time) return d;
  return `${d}T${time.replace(':', '')}00`;
}

function buildICS(courses: Course[], sessions: Session[], holidays: Holiday[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DocentePro//Calendario Docente//ES',
    'X-WR-CALNAME:Calendario Docente',
    'X-WR-TIMEZONE:Europe/Madrid',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  courses.forEach(c => {
    const uid = `course-${c.id}@docentepro`;
    const dtstart = c.startTime
      ? `DTSTART:${icsDate(c.startDate, c.startTime)}`
      : `DTSTART;VALUE=DATE:${icsDate(c.startDate)}`;
    const endDate = c.endTime && c.startDate === c.endDate
      ? `DTEND:${icsDate(c.endDate, c.endTime)}`
      : `DTEND;VALUE=DATE:${icsDate(c.endDate)}`;
    const desc = [
      c.entity ? `Entidad: ${c.entity}` : '',
      c.modality ? `Modalidad: ${c.modality}` : '',
      c.location ? `Lugar: ${c.location}` : '',
      c.schedule ? `Días: ${c.schedule}` : '',
      c.startTime ? `Horario: ${c.startTime}${c.endTime ? `–${c.endTime}` : ''}` : '',
      `Horas totales: ${c.totalHours}h`,
      `Estado: ${c.status}`,
    ].filter(Boolean).join('\\n');
    lines.push('BEGIN:VEVENT', `UID:${uid}`, dtstart, endDate, `SUMMARY:${c.name}`, `DESCRIPTION:${desc}`, 'END:VEVENT');
  });

  sessions.forEach(s => {
    const course = courses.find(c => c.id === s.courseId);
    const uid = `session-${s.id}@docentepro`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART:${icsDate(s.date, s.startTime)}`,
      `DTEND:${icsDate(s.date, s.endTime)}`,
      `SUMMARY:${course?.name ?? 'Sesión'}`,
      `DESCRIPTION:${s.content ?? ''}`,
      'END:VEVENT'
    );
  });

  holidays.forEach(h => {
    const uid = `holiday-${h.date}@docentepro`;
    const d = h.date.replace(/-/g, '');
    lines.push('BEGIN:VEVENT', `UID:${uid}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${d}`, `SUMMARY:🎉 ${h.name}`, 'END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function Calendar({ sessions, courses, small = false }: { sessions: Session[], courses: Course[], small?: boolean }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calSettings, setCalSettings] = useState<CalendarSettings>(loadCalendarSettings);
  const [showSettings, setShowSettings] = useState(false);

  // Re-sync from localStorage whenever settings modal closes
  useEffect(() => {
    if (!showSettings) {
      setCalSettings(loadCalendarSettings());
    }
  }, [showSettings]);
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayColor, setNewHolidayColor] = useState('orange');
  const [newVacStart, setNewVacStart] = useState('');
  const [newVacEnd, setNewVacEnd] = useState('');
  const [newVacName, setNewVacName] = useState('');
  const [newVacColor, setNewVacColor] = useState('sky');
  const csvInputRef = useRef<HTMLInputElement>(null);

  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startW = startOfWeek(start, { weekStartsOn: 1 });
    const endW = addDays(startOfWeek(end, { weekStartsOn: 1 }), 6);
    return eachDayOfInterval({ start: startW, end: endW });
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const updateSettings = (updated: CalendarSettings) => {
    setCalSettings(updated);
    saveCalendarSettings(updated);
  };

  const addHoliday = () => {
    if (!newHolidayDate || !newHolidayName.trim()) return;
    const updated = { ...calSettings, holidays: [...calSettings.holidays, { date: newHolidayDate, name: newHolidayName.trim(), color: newHolidayColor }] };
    updateSettings(updated);
    setNewHolidayDate('');
    setNewHolidayName('');
  };

  const removeHoliday = (date: string) => {
    updateSettings({ ...calSettings, holidays: calSettings.holidays.filter(h => h.date !== date) });
  };

  const addVacation = () => {
    if (!newVacStart || !newVacEnd || !newVacName.trim()) return;
    const vac: Vacation = { id: `${newVacStart}-${Date.now()}`, startDate: newVacStart, endDate: newVacEnd, name: newVacName.trim(), color: newVacColor };
    updateSettings({ ...calSettings, vacations: [...(calSettings.vacations ?? []), vac] });
    setNewVacStart(''); setNewVacEnd(''); setNewVacName('');
  };

  const removeVacation = (id: string) => {
    updateSettings({ ...calSettings, vacations: (calSettings.vacations ?? []).filter(v => v.id !== id) });
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const newHolidays: Holiday[] = [];
      text.split('\n').forEach(line => {
        const parts = line.trim().split(/[,;]/);
        if (parts.length < 2) return;
        const date = parts[0].trim();
        const name = parts.slice(1).join(',').trim().replace(/^"|"$/g, '');
        if (/^\d{4}-\d{2}-\d{2}$/.test(date) && name) {
          newHolidays.push({ date, name });
        }
      });
      if (newHolidays.length > 0) {
        const existing = calSettings.holidays.map(h => h.date);
        const merged = [...calSettings.holidays, ...newHolidays.filter(h => !existing.includes(h.date))];
        updateSettings({ ...calSettings, holidays: merged });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const exportToGoogleCalendar = () => {
    const ics = buildICS(courses, sessions, calSettings.holidays);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calendario-docente.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const isWeekendDay = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
  const getHoliday = (d: Date) => calSettings.holidays.find(h => h.date === format(d, 'yyyy-MM-dd'));

  return (
    <div className={cn("bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden", small ? "p-3" : "p-4")}>
      {/* Header */}
      <div className={cn("border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3", small ? "pb-3" : "pb-4")}>
        <div>
          <h3 className={cn("font-bold text-slate-900 uppercase tracking-tight", small ? "text-base" : "text-lg")}>
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h3>
          {!small && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
              {/* Cursos activos este mes */}
              {(courses || []).filter(c => {
                try {
                  const mStart = startOfMonth(currentDate);
                  const mEnd = endOfMonth(currentDate);
                  return parseISO(c.startDate) <= mEnd && parseISO(c.endDate) >= mStart;
                } catch { return false; }
              }).map(course => {
                const color = getCourseColor(course.color);
                return (
                  <div key={course.id} className="flex items-center gap-1.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", color.dot)} />
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      {course.name}{course.startTime ? ` · ${course.startTime}${course.endTime ? `–${course.endTime}` : ''}` : ''}
                    </span>
                  </div>
                );
              })}
              {/* Fin de semana */}
              {calSettings.highlightWeekends && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-400 shrink-0" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fin de semana</span>
                </div>
              )}
              {/* Festivos del mes con su color individual */}
              {calSettings.holidays.filter(h => {
                try {
                  const mStart = startOfMonth(currentDate);
                  const mEnd = endOfMonth(currentDate);
                  const d = parseISO(h.date);
                  return d >= mStart && d <= mEnd;
                } catch { return false; }
              }).map(h => {
                const c = getCalColor(h.color);
                return (
                  <div key={h.date} className="flex items-center gap-1.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", c.dot)} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h.name}</span>
                  </div>
                );
              })}
              {/* Vacaciones que se solapan con el mes */}
              {(calSettings.vacations ?? []).filter(v => {
                try {
                  const mStart = startOfMonth(currentDate);
                  const mEnd = endOfMonth(currentDate);
                  return parseISO(v.startDate) <= mEnd && parseISO(v.endDate) >= mStart;
                } catch { return false; }
              }).map(v => {
                const c = getCalColor(v.color);
                return (
                  <div key={v.id} className="flex items-center gap-1.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", c.dot)} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {v.name} · {format(parseISO(v.startDate), 'd MMM', { locale: es })}–{format(parseISO(v.endDate), 'd MMM', { locale: es })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!small && (
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200" title="Configurar calendario">
              <SettingsIcon className="w-4 h-4 text-slate-600" />
            </button>
          )}
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200">
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, idx) => (
          <div key={d} className={cn(
            "py-2 text-center font-bold uppercase tracking-widest",
            small ? "text-[10px]" : "text-xs",
            (idx === 5 || idx === 6) && calSettings.highlightWeekends ? "text-violet-500" : "text-slate-400"
          )}>{small ? d[0] : d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className={cn("grid grid-cols-7", small ? "auto-rows-[48px]" : "auto-rows-[112px]")}>
        {days.map((day, i) => {
          const daySessions = (sessions || []).filter(s => isSameDay(parseISO(s.date), day));
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isWeekend = isWeekendDay(day);
          const holiday = getHoliday(day);
          const vacation = (calSettings.vacations ?? []).find(v => {
            try { return isWithinInterval(day, { start: parseISO(v.startDate), end: parseISO(v.endDate) }); }
            catch { return false; }
          });
          const isNonWorking = isWeekend || !!holiday || !!vacation;
          const holidayColor = holiday ? getCalColor(holiday.color) : null;
          const vacColor = vacation ? getCalColor(vacation.color) : null;
          const isVacStart = vacation ? isSameDay(day, parseISO(vacation.startDate)) : false;

          const activeCourses = isNonWorking ? [] : (courses || []).filter(c => {
            try { return isWithinInterval(day, { start: parseISO(c.startDate), end: parseISO(c.endDate) }); }
            catch { return false; }
          });

          return (
            <div key={i} className={cn(
              "border-r border-b p-1 transition-colors",
              !isCurrentMonth && "bg-slate-50/30 border-slate-100",
              isCurrentMonth && !isNonWorking && "border-slate-100",
              isCurrentMonth && isWeekend && !holiday && !vacation && calSettings.highlightWeekends && "bg-violet-50 border-violet-100",
              vacation && vacColor && `${vacColor.bg} ${vacColor.border}`,
              holiday && holidayColor && `${holidayColor.bg} ${holidayColor.border}`,
              isSameDay(day, new Date()) && "bg-emerald-50/40"
            )}>
              <div className={cn(
                "font-bold flex items-center justify-center rounded-full",
                small ? "text-[9px] w-4 h-4" : "text-[10px] w-5 h-5 mb-0.5",
                isSameDay(day, new Date()) ? "bg-emerald-600 text-white"
                  : holiday && holidayColor ? holidayColor.text
                  : vacation && vacColor ? `${vacColor.text} font-black`
                  : isWeekend && isCurrentMonth && calSettings.highlightWeekends ? "text-violet-500 font-black"
                  : "text-slate-400"
              )}>
                {format(day, 'd')}
              </div>
              {!small && holiday && holidayColor && (
                <div className={cn("px-1 py-0.5 text-[9px] font-bold rounded-md truncate mb-0.5 border", holidayColor.text, holidayColor.bg, holidayColor.border)}>
                  {holiday.name}
                </div>
              )}
              {!small && vacation && vacColor && (isVacStart || day.getDate() === 1) && (
                <div className={cn("px-1 py-0.5 text-[9px] font-bold rounded-md truncate mb-0.5 border", vacColor.text, vacColor.bg, vacColor.border)}>
                  {vacation.name}
                </div>
              )}
              {!small && isWeekend && !holiday && !vacation && calSettings.highlightWeekends && isCurrentMonth && (
                <div className="px-1 py-0.5 text-[9px] font-bold text-violet-400 bg-violet-100 border border-violet-200 rounded-md truncate mb-0.5">
                  {day.getDay() === 6 ? 'Sábado' : 'Domingo'}
                </div>
              )}
              <div className={cn("space-y-0.5 overflow-y-auto scrollbar-hide", small ? "max-h-[28px]" : "max-h-[72px]")}>
                {activeCourses.map(c => {
                  const color = getCourseColor(c.color);
                  const session = daySessions.find(s => s.courseId === c.id);
                  const timeLabel = session
                    ? `${session.startTime}–${session.endTime}`
                    : c.startTime
                      ? `${c.startTime}${c.endTime ? `–${c.endTime}` : ''}`
                      : '';
                  return (
                    <div key={c.id} className={cn(
                      "px-1 py-0.5 text-[9px] font-bold rounded-md truncate border flex items-center gap-0.5",
                      color.bg, color.text, color.border,
                      !session && "opacity-70"
                    )}>
                      {small
                        ? <div className={cn("w-1 h-1 rounded-full shrink-0", color.dot)} />
                        : session
                          ? <Clock className="w-2 h-2 shrink-0" />
                          : <BookOpen className="w-2 h-2 shrink-0" />
                      }
                      {!small && (
                        <span className="truncate">
                          {timeLabel ? `${timeLabel} ` : ''}{c.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Configuración del calendario</h3>
              <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Weekends toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <p className="text-sm font-bold text-slate-700">Marcar fines de semana</p>
              <button
                onClick={() => updateSettings({ ...calSettings, highlightWeekends: !calSettings.highlightWeekends })}
                className={cn("w-11 h-6 rounded-full transition-colors relative", calSettings.highlightWeekends ? "bg-emerald-500" : "bg-slate-300")}
              >
                <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", calSettings.highlightWeekends ? "translate-x-5" : "translate-x-0.5")} />
              </button>
            </div>

            {/* Export */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">Exportar calendario</p>
              <button onClick={exportToGoogleCalendar} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl transition-colors">
                <Download className="w-4 h-4" />
                Descargar .ics para Google Calendar
              </button>
              <p className="text-[10px] text-slate-400 text-center">Google Calendar → Configuración → Importar y exportar → Importar</p>
            </div>

            {/* Holidays */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">Días festivos</p>
                <button onClick={() => csvInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors">
                  <Download className="w-3 h-3 rotate-180" />
                  Importar CSV
                </button>
                <input ref={csvInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={importCSV} />
              </div>
              <p className="text-[10px] text-slate-400">Formato CSV: <code className="bg-slate-100 px-1 rounded">YYYY-MM-DD,Nombre festivo</code></p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {calSettings.holidays.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Sin festivos configurados</p>}
                {[...calSettings.holidays].sort((a, b) => a.date.localeCompare(b.date)).map(h => {
                  const c = getCalColor(h.color);
                  return (
                    <div key={h.date} className={cn("flex items-center justify-between rounded-xl px-3 py-2 border", c.bg, c.border)}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", c.dot)} />
                        <div>
                          <p className={cn("text-xs font-bold", c.text)}>{h.name}</p>
                          <p className="text-[10px] text-slate-400">{format(parseISO(h.date), 'd MMM yyyy', { locale: es })}</p>
                        </div>
                      </div>
                      <button onClick={() => removeHoliday(h.date)} className="p-1 hover:bg-white/60 rounded-full">
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Add holiday form */}
              <div className="space-y-2 bg-slate-50 rounded-2xl p-3">
                <div className="flex gap-2">
                  <input type="date" value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} className="flex-1 p-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300 bg-white" />
                  <input type="text" value={newHolidayName} onChange={e => setNewHolidayName(e.target.value)} placeholder="Nombre festivo" className="flex-[2] p-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300 bg-white" onKeyDown={e => e.key === 'Enter' && addHoliday()} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Color:</span>
                  <div className="flex gap-1.5 flex-1">
                    {CAL_COLORS.map(c => (
                      <button key={c.name} type="button" onClick={() => setNewHolidayColor(c.name)}
                        className={cn("w-5 h-5 rounded-full border-2 transition-all", c.dot, newHolidayColor === c.name ? "border-slate-800 scale-125" : "border-transparent")}
                        title={c.label} />
                    ))}
                  </div>
                  <button onClick={addHoliday} className="p-1.5 bg-slate-700 hover:bg-slate-900 text-white rounded-xl transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Vacations */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-700">Periodos de vacaciones</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {(calSettings.vacations ?? []).length === 0 && <p className="text-xs text-slate-400 text-center py-2">Sin periodos configurados</p>}
                {[...(calSettings.vacations ?? [])].sort((a, b) => a.startDate.localeCompare(b.startDate)).map(v => {
                  const c = getCalColor(v.color);
                  return (
                    <div key={v.id} className={cn("flex items-center justify-between rounded-xl px-3 py-2 border", c.bg, c.border)}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", c.dot)} />
                        <div>
                          <p className={cn("text-xs font-bold", c.text)}>{v.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {format(parseISO(v.startDate), 'd MMM', { locale: es })} → {format(parseISO(v.endDate), 'd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => removeVacation(v.id)} className="p-1 hover:bg-white/60 rounded-full">
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Add vacation form */}
              <div className="space-y-2 bg-slate-50 rounded-2xl p-3">
                <input type="text" value={newVacName} onChange={e => setNewVacName(e.target.value)} placeholder="Nombre (ej: Vacaciones Navidad)" className="w-full p-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300 bg-white" />
                <div className="flex gap-2">
                  <div className="flex-1 space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Inicio</p>
                    <input type="date" value={newVacStart} onChange={e => setNewVacStart(e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300 bg-white" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Fin</p>
                    <input type="date" value={newVacEnd} onChange={e => setNewVacEnd(e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300 bg-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Color:</span>
                  <div className="flex gap-1.5 flex-1">
                    {CAL_COLORS.map(c => (
                      <button key={c.name} type="button" onClick={() => setNewVacColor(c.name)}
                        className={cn("w-5 h-5 rounded-full border-2 transition-all", c.dot, newVacColor === c.name ? "border-slate-800 scale-125" : "border-transparent")}
                        title={c.label} />
                    ))}
                  </div>
                  <button onClick={addVacation} className="p-1.5 bg-slate-700 hover:bg-slate-900 text-white rounded-xl transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const AVATAR_COLORS = ['#10b981','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#ec4899','#06b6d4','#84cc16'];
const COUNTRIES = ['España','México','Argentina','Colombia','Chile','Perú','Uruguay','Venezuela','Ecuador','Bolivia','Paraguay','Otro'];
const TIMEZONES = ['Europe/Madrid','America/Mexico_City','America/Argentina/Buenos_Aires','America/Bogota','America/Santiago','America/Lima','Atlantic/Canary','UTC'];

function Settings({ settings, userId, user, setUser }: { settings: TeacherSettings | null, userId: string, user: User, setUser: (u: User) => void }) {
  const [tab, setTab] = useState<'perfil'|'seguridad'|'preferencias'|'datos'>('perfil');
  const [work, setWork] = useState<TeacherSettings>(settings || { userId, maxHoursPerWeek: 20, availableDays: [], minHourlyRate: 25, preferredModality: 'any', bankAccount: '' });
  const [prof, setProf] = useState({ name: user.name || '', username: user.username || '', phone: user.phone || '', address: user.address || '', birthdate: user.birthdate || '', country: user.country || 'España', timezone: user.timezone || 'Europe/Madrid', avatarColor: user.avatarColor || '#10b981', language: user.language || 'es' });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwStatus, setPwStatus] = useState<'idle'|'saving'|'ok'|'error'>('idle');
  const [pwError, setPwError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle'|'saving'|'saved'>('idle');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [photo, setPhoto] = useState<string>(() => localStorage.getItem(`profilePhoto_${userId}`) || '');
  const photoRef = React.useRef<HTMLInputElement>(null);
  const importRef = React.useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');
  const [importMsg, setImportMsg] = useState('');

  useEffect(() => { if (settings) setWork(settings); }, [settings]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target?.result as string;
      setPhoto(b64);
      localStorage.setItem(`profilePhoto_${userId}`, b64);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhoto('');
    localStorage.removeItem(`profilePhoto_${userId}`);
    if (photoRef.current) photoRef.current.value = '';
  };

  const DAYS = ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
  const toggleDay = (day: string) => {
    const days = (work.availableDays||[]).includes(day) ? (work.availableDays||[]).filter(d=>d!==day) : [...(work.availableDays||[]),day];
    setWork({...work, availableDays: days});
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    await api.updateProfile(prof);
    await saveSettings(userId, work);
    setUser({...user, ...prof});
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { setPwError('Las contraseñas no coinciden'); setPwStatus('error'); return; }
    if (pwForm.next.length < 6) { setPwError('Mínimo 6 caracteres'); setPwStatus('error'); return; }
    setPwStatus('saving'); setPwError('');
    try {
      await api.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwStatus('ok'); setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: any) {
      setPwError(err.message || 'Error al cambiar contraseña'); setPwStatus('error');
    }
  };

  const downloadJSON = (data: object, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  const exportAppBackup = () => {
    const calSettings = localStorage.getItem('calendarSettings');
    const backup = {
      version: '1.0',
      type: 'app',
      exportedAt: new Date().toISOString(),
      profile: { ...prof, email: user.email },
      settings: work,
      calendarSettings: calSettings ? JSON.parse(calSettings) : null,
      profilePhoto: photo || null,
    };
    downloadJSON(backup, `backup-app-${new Date().toISOString().slice(0,10)}.json`);
  };

  const exportDataBackup = async () => {
    try {
      const [courses, sessions, clients] = await Promise.all([
        api.getCourses(),
        api.getSessions(),
        api.getClients(),
      ]);
      const calSettings = localStorage.getItem('calendarSettings');
      const backup = {
        version: '1.0',
        type: 'full',
        exportedAt: new Date().toISOString(),
        profile: { ...prof, email: user.email },
        settings: work,
        calendarSettings: calSettings ? JSON.parse(calSettings) : null,
        profilePhoto: photo || null,
        courses,
        sessions,
        clients,
      };
      downloadJSON(backup, `backup-datos-${new Date().toISOString().slice(0,10)}.json`);
    } catch {
      alert('Error al exportar los datos');
    }
  };

  const importBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('loading'); setImportMsg('');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.version || !data.type) throw new Error('Archivo no válido');

      // Restore calendar settings
      if (data.calendarSettings) {
        localStorage.setItem('calendarSettings', JSON.stringify(data.calendarSettings));
      }
      // Restore profile photo
      if (data.profilePhoto) {
        localStorage.setItem(`profilePhoto_${userId}`, data.profilePhoto);
        setPhoto(data.profilePhoto);
      }
      // Restore profile & settings
      if (data.profile) {
        const { email: _e, ...profileData } = data.profile;
        await api.updateProfile(profileData);
        setUser({ ...user, ...profileData });
        setProf(p => ({ ...p, ...profileData }));
      }
      if (data.settings) {
        await saveSettings(userId, data.settings);
        setWork(data.settings);
      }

      // Restore data (only for full backups)
      let restored = { courses: 0, sessions: 0, clients: 0 };
      if (data.type === 'full') {
        // Restore clients
        const clientIdMap: Record<string, string> = {};
        for (const c of (data.clients || [])) {
          const { id: oldId, userId: _u, createdAt: _ca, ...rest } = c;
          const created = await api.createClient(rest);
          if (oldId && created.id) clientIdMap[oldId] = created.id;
          restored.clients++;
        }
        // Restore courses + build id map
        const courseIdMap: Record<string, string> = {};
        for (const c of (data.courses || [])) {
          const { id: oldId, userId: _u, createdAt: _ca, ...rest } = c;
          const created = await api.createCourse(rest);
          if (oldId && created.id) courseIdMap[oldId] = created.id;
          restored.courses++;
        }
        // Restore sessions with remapped courseId
        for (const s of (data.sessions || [])) {
          const { id: _id, userId: _u, createdAt: _ca, courseId, ...rest } = s;
          const newCourseId = courseIdMap[courseId] || courseId;
          await api.createSession({ ...rest, courseId: newCourseId });
          restored.sessions++;
        }
      }

      const detail = data.type === 'full'
        ? ` Se restauraron ${restored.courses} cursos, ${restored.sessions} sesiones y ${restored.clients} clientes.`
        : '';
      setImportStatus('ok');
      setImportMsg(`Copia de seguridad restaurada correctamente.${detail}`);
      if (importRef.current) importRef.current.value = '';
    } catch (err: any) {
      setImportStatus('error');
      setImportMsg(err.message || 'Error al importar el archivo');
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== 'ELIMINAR') return;
    await api.deleteAccount();
    localStorage.clear();
    window.location.reload();
  };

  const F = "w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white";
  const L = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";
  const initials = (prof.name || user.email).slice(0,2).toUpperCase();

  const TABS = [
    { id: 'perfil', label: 'Mi Perfil', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'seguridad', label: 'Seguridad', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'preferencias', label: 'Preferencias', icon: <SettingsIcon className="w-4 h-4" /> },
    { id: 'datos', label: 'Mis Datos', icon: <Download className="w-4 h-4" /> },
  ] as const;

  const ComingSoon = ({ label }: { label: string }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl opacity-60 cursor-not-allowed">
      <span className="text-sm text-slate-500 font-medium">{label}</span>
      <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Próximamente</span>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-5">
      {/* Tab nav */}
      <div className="flex gap-2 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all",
              tab === t.id ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            )}>
            {t.icon}<span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: MI PERFIL ── */}
      {tab === 'perfil' && (
        <form onSubmit={saveProfile} className="space-y-5">
          {/* Avatar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-5 mb-5">
              <div className="relative group">
                {photo ? (
                  <img src={photo} alt="Foto de perfil" className="w-20 h-20 rounded-2xl object-cover shadow-lg" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg" style={{ backgroundColor: prof.avatarColor }}>
                    {initials}
                  </div>
                )}
                <button type="button" onClick={() => photoRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                  Cambiar
                </button>
                <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{prof.name || 'Sin nombre'}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button type="button" onClick={() => photoRef.current?.click()}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2">
                    {photo ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                  {photo && (
                    <button type="button" onClick={removePhoto}
                      className="text-xs font-semibold text-red-500 hover:text-red-600 underline underline-offset-2">
                      Eliminar foto
                    </button>
                  )}
                </div>
                {!photo && (
                  <div className="flex gap-1.5 mt-2">
                    {AVATAR_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setProf({...prof, avatarColor: c})}
                        className={cn("w-5 h-5 rounded-full border-2 transition-all", prof.avatarColor === c ? "border-slate-800 scale-125" : "border-transparent")}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={L}>Nombre completo</label><input value={prof.name} onChange={e=>setProf({...prof,name:e.target.value})} placeholder="Tu nombre" className={F} /></div>
              <div><label className={L}>Nombre de usuario</label><input value={prof.username} onChange={e=>setProf({...prof,username:e.target.value})} placeholder="@usuario" className={F} /></div>
              <div><label className={L}>Teléfono</label><input value={prof.phone} onChange={e=>setProf({...prof,phone:e.target.value})} placeholder="+34 600 000 000" className={F} /></div>
              <div><label className={L}>Fecha de nacimiento</label><input type="date" value={prof.birthdate} onChange={e=>setProf({...prof,birthdate:e.target.value})} className={F} /></div>
              <div><label className={L}>País</label>
                <select value={prof.country} onChange={e=>setProf({...prof,country:e.target.value})} className={F}>
                  {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className={L}>Idioma</label>
                <select value={prof.language} onChange={e=>setProf({...prof,language:e.target.value})} className={F}>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="md:col-span-2"><label className={L}>Dirección</label><input value={prof.address} onChange={e=>setProf({...prof,address:e.target.value})} placeholder="Calle, ciudad, CP" className={F} /></div>
              <div><label className={L}>Zona horaria</label>
                <select value={prof.timezone} onChange={e=>setProf({...prof,timezone:e.target.value})} className={F}>
                  {TIMEZONES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className={L}>IBAN</label><input value={work.bankAccount||''} onChange={e=>setWork({...work,bankAccount:e.target.value})} placeholder="ES00 0000 ..." className={F} /></div>
            </div>

          </div>

          <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            {saveStatus==='saving'?'Guardando...':saveStatus==='saved'?<><CheckCircle2 className="w-5 h-5"/>Guardado</>:'Guardar Perfil'}
          </button>
        </form>
      )}

      {/* ── TAB: SEGURIDAD ── */}
      {tab === 'seguridad' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900">Cambiar contraseña</h3>
            <form onSubmit={changePassword} className="space-y-3">
              <div><label className={L}>Contraseña actual</label><input type="password" value={pwForm.current} onChange={e=>setPwForm({...pwForm,current:e.target.value})} className={F} /></div>
              <div><label className={L}>Nueva contraseña</label><input type="password" value={pwForm.next} onChange={e=>setPwForm({...pwForm,next:e.target.value})} placeholder="Mínimo 6 caracteres" className={F} /></div>
              <div><label className={L}>Confirmar nueva contraseña</label><input type="password" value={pwForm.confirm} onChange={e=>setPwForm({...pwForm,confirm:e.target.value})} className={F} /></div>
              {pwError && <p className="text-sm text-red-600 font-medium">{pwError}</p>}
              <button type="submit" className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                {pwStatus==='saving'?'Cambiando...':pwStatus==='ok'?<><CheckCircle2 className="w-4 h-4"/>Contraseña cambiada</>:'Cambiar contraseña'}
              </button>
            </form>
          </div>

          {/* Último acceso */}
          {user.lastLogin && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-3">Último acceso</h3>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{new Date(user.lastLogin).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</p>
                  {user.lastLoginIp && <p className="text-xs text-slate-400">IP: {user.lastLoginIp}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Próximamente */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 mb-1">Más seguridad</h3>
            <ComingSoon label="Verificación en dos pasos (2FA)" />
            <ComingSoon label="Dispositivos conectados" />
            <ComingSoon label="Historial completo de accesos" />
            <ComingSoon label="Cierre de todas las sesiones" />
          </div>
        </div>
      )}

      {/* ── TAB: PREFERENCIAS ── */}
      {tab === 'preferencias' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900">Interfaz</h3>
            <div className="grid grid-cols-2 gap-3">
              {['es','en'].map(lang => (
                <button key={lang} type="button" onClick={()=>setProf({...prof,language:lang})}
                  className={cn("py-3 font-bold rounded-xl border transition-all",
                    prof.language===lang?"bg-slate-900 text-white border-slate-900":"bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                  )}>
                  {lang==='es'?'🇪🇸 Español':'🇬🇧 English'}
                </button>
              ))}
            </div>
            <button onClick={async()=>{await api.updateProfile(prof);setUser({...user,...prof});}} type="button"
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />Guardar preferencias
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 mb-1">Más preferencias</h3>
            <ComingSoon label="Tema oscuro / claro" />
            <ComingSoon label="Notificaciones por email" />
            <ComingSoon label="Notificaciones push" />
            <ComingSoon label="Privacidad del perfil" />
            <ComingSoon label="Control de datos compartidos" />
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 mb-1">Integraciones</h3>
            <ComingSoon label="Conectar Google Calendar (OAuth)" />
            <ComingSoon label="Conectar cuenta de Apple" />
            <ComingSoon label="API personal / tokens" />
            <ComingSoon label="Suscripciones y plan" />
          </div>
        </div>
      )}

      {/* ── TAB: MIS DATOS ── */}
      {tab === 'datos' && (
        <div className="space-y-4">

          {/* Copia de seguridad de la app */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <SettingsIcon className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Copia de seguridad de la app</h3>
                <p className="text-sm text-slate-500 mt-0.5">Exporta tu perfil, configuración, festivos y vacaciones del calendario. No incluye cursos ni clientes.</p>
              </div>
            </div>
            <button onClick={exportAppBackup} type="button"
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all">
              <Download className="w-4 h-4" /> Descargar backup de configuración (.json)
            </button>
          </div>

          {/* Copia de seguridad de los datos */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Copia de seguridad completa</h3>
                <p className="text-sm text-slate-500 mt-0.5">Exporta todos tus datos: cursos, sesiones, clientes, perfil y configuración. Úsala para migrar o restaurar.</p>
              </div>
            </div>
            <button onClick={exportDataBackup} type="button"
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all">
              <Download className="w-4 h-4" /> Descargar backup completo (.json)
            </button>
          </div>

          {/* Importar copia de seguridad */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Importar copia de seguridad</h3>
                <p className="text-sm text-slate-500 mt-0.5">Restaura desde un archivo de backup exportado anteriormente. Los datos existentes <strong>no se borran</strong>; se añaden los del backup.</p>
              </div>
            </div>
            <input ref={importRef} type="file" accept=".json,application/json" onChange={importBackup} className="hidden" />
            <button onClick={() => importRef.current?.click()} type="button"
              disabled={importStatus === 'loading'}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all">
              {importStatus === 'loading' ? 'Restaurando...' : <><CheckCircle2 className="w-4 h-4" /> Seleccionar archivo de backup</>}
            </button>
            {importMsg && (
              <div className={cn("p-3 rounded-xl text-sm font-medium", importStatus === 'ok' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                {importMsg}
              </div>
            )}
          </div>

          {/* Eliminar cuenta */}
          <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-red-700">Eliminar cuenta</h3>
            <p className="text-sm text-slate-500">Esta acción es <strong>irreversible</strong>. Se eliminarán todos tus datos, cursos, sesiones y facturas.</p>
            {!showDelete ? (
              <button onClick={()=>setShowDelete(true)} type="button" className="w-full py-3 border-2 border-red-300 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all">
                Quiero eliminar mi cuenta
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-700">Escribe <code className="bg-slate-100 px-1 rounded text-red-600">ELIMINAR</code> para confirmar:</p>
                <input value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder="ELIMINAR" className="w-full p-3 border-2 border-red-200 rounded-xl outline-none focus:border-red-500 text-sm" />
                <div className="flex gap-3">
                  <button onClick={()=>{setShowDelete(false);setDeleteConfirm('');}} type="button" className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">Cancelar</button>
                  <button onClick={deleteAccount} type="button" disabled={deleteConfirm!=='ELIMINAR'}
                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    Eliminar definitivamente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
    startTime: '',
    endTime: '',
    pricingType: 'hourly',
    price: 0,
    status: 'pendiente',
    color: COURSE_COLORS[0].name
  });

  useEffect(() => {
    if (course) {
      setFormData({
        ...course,
        color: course.color || COURSE_COLORS[0].name,
        startTime: course.startTime || '',
        endTime: course.endTime || '',
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
        startTime: '',
        endTime: '',
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
            <label className="text-xs font-bold text-slate-400 uppercase">Días de clase</label>
            <input
              value={formData.schedule}
              onChange={e => setFormData({...formData, schedule: e.target.value})}
              placeholder="Ej: Lunes y Miércoles"
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Hora entrada</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={e => setFormData({...formData, startTime: e.target.value})}
              className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase">Hora salida</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={e => setFormData({...formData, endTime: e.target.value})}
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


