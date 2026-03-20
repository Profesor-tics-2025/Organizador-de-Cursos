import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  X,
  Mail,
  Phone,
  MapPin,
  FileText,
  Search
} from 'lucide-react';
import { Client } from '../../types';

interface ClientManagementProps {
  clients: Client[];
  onAdd?: (client: Client) => void;
  onUpdate?: (id: string, client: Client) => void;
  onDelete?: (id: string) => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ 
  clients = [], 
  onAdd, 
  onUpdate, 
  onDelete 
}) => {
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

  const filteredClients = clients.filter(client =>
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
                  {clients.length === 0 
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
};

export default ClientManagement;
