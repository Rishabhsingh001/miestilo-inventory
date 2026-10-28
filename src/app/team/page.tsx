'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Key,
  Edit2,
  Lock,
  Mail,
  User,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const ROLE_CONFIG: Record<string, { label: string; badgeClass: string; desc: string }> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    badgeClass: 'bg-[#171B18] text-[#A7F432] border border-stone-800 font-bold',
    desc: 'Full operational, editing, financial & configuration access',
  },
  ADMIN: {
    label: 'Admin',
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold',
    desc: 'Operational management & inventory oversight',
  },
  ORDER_MANAGER: {
    label: 'Order Manager',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold',
    desc: 'Sales orders, fulfillment, packing & allocations',
  },
  INVENTORY_MANAGER: {
    label: 'Inventory Manager',
    badgeClass: 'bg-cyan-50 text-cyan-800 border border-cyan-200 font-semibold',
    desc: 'Stock balances, inwards, transfers & adjustments',
  },
  SALES_MANAGER: {
    label: 'Sales Manager',
    badgeClass: 'bg-blue-50 text-blue-800 border border-blue-200 font-semibold',
    desc: 'Client orders, hotel accounts & reservations',
  },
  WAREHOUSE_STAFF: {
    label: 'Warehouse Staff',
    badgeClass: 'bg-stone-100 text-stone-800 border border-stone-300 font-medium',
    desc: 'Inward receiving, packing & dispatches',
  },
  MANAGEMENT: {
    label: 'Executive',
    badgeClass: 'bg-purple-50 text-purple-800 border border-purple-200 font-medium',
    desc: 'Analytics, reporting, audit logs & summaries',
  },
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Form states
  const [newForm, setNewForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ORDER_MANAGER',
    isActive: true,
  });
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'ORDER_MANAGER',
    isActive: true,
    newPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const [membersRes, meRes] = await Promise.all([
        fetch('/api/v1/team'),
        fetch('/api/v1/auth/me'),
      ]);

      if (membersRes.ok) {
        const json = await membersRes.json();
        setMembers(json.data || []);
      }
      if (meRes.ok) {
        const json = await meRes.json();
        setCurrentUser(json.data || null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await fetch('/api/v1/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newForm),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to add team member');
      }
      setSuccessMsg(`Team member ${newForm.name} added successfully!`);
      setAddModalOpen(false);
      setNewForm({
        name: '',
        email: '',
        password: '',
        role: 'ORDER_MANAGER',
        isActive: true,
      });
      fetchMembers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setEditForm({
      name: member.name,
      role: member.role,
      isActive: member.isActive,
      newPassword: '',
    });
    setEditModalOpen(true);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const payload: any = {
        name: editForm.name,
        role: editForm.role,
        isActive: editForm.isActive,
      };
      if (editForm.newPassword.trim()) {
        payload.password = editForm.newPassword.trim();
      }

      const res = await fetch(`/api/v1/team/${selectedMember._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update member');
      }
      setSuccessMsg(`Team member ${editForm.name} updated successfully!`);
      setEditModalOpen(false);
      fetchMembers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    const q = searchTerm.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.role.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-stone-900">
              Team & Staff Access
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#171B18] text-[#A7F432]">
              RBAC Protected
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage authorized staff members, role permissions, and access privileges across MiEstilo ERP.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Access info banner if not Super Admin */}
      {!isSuperAdmin && (
        <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200/80 text-xs text-stone-600 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-stone-400 shrink-0" />
          <span>
            You are viewing the team roster in read-only mode. Only <strong>Super Admin (Founder & MD)</strong> can add or edit team accounts.
          </span>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-surface p-4 bg-white border border-[#E7EBE7]">
          <span className="text-[11px] font-semibold text-stone-500 block">Total Staff</span>
          <span className="text-xl font-black text-stone-900 mt-1 block">{members.length}</span>
        </div>
        <div className="card-surface p-4 bg-white border border-[#E7EBE7]">
          <span className="text-[11px] font-semibold text-emerald-600 block">Active Accounts</span>
          <span className="text-xl font-black text-stone-900 mt-1 block">
            {members.filter((m) => m.isActive).length}
          </span>
        </div>
        <div className="card-surface p-4 bg-white border border-[#E7EBE7]">
          <span className="text-[11px] font-semibold text-stone-500 block">Super Admins</span>
          <span className="text-xl font-black text-stone-900 mt-1 block">
            {members.filter((m) => m.role === 'SUPER_ADMIN').length}
          </span>
        </div>
        <div className="card-surface p-4 bg-white border border-[#E7EBE7]">
          <span className="text-[11px] font-semibold text-stone-500 block">Operations Roles</span>
          <span className="text-xl font-black text-stone-900 mt-1 block">
            {members.filter((m) => m.role !== 'SUPER_ADMIN').length}
          </span>
        </div>
      </div>

      {/* Search and Table */}
      <div className="card-surface bg-white border border-[#E7EBE7] overflow-hidden">
        <div className="p-4 border-b border-[#E7EBE7] flex items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F3F5F4] border-0 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:ring-2 focus:ring-[#A7F432] focus:bg-white outline-none"
            />
          </div>
          <span className="text-xs text-stone-500 whitespace-nowrap">
            Showing {filteredMembers.length} member{filteredMembers.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FAF8] text-stone-500 border-b border-[#E7EBE7] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-bold">Team Member</th>
                <th className="py-3 px-4 font-bold">Work Email</th>
                <th className="py-3 px-4 font-bold">Assigned Role</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Last Login</th>
                {isSuperAdmin && <th className="py-3 px-4 font-bold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7EBE7]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Loading team directory...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const roleMeta = ROLE_CONFIG[member.role] || {
                    label: member.role,
                    badgeClass: 'bg-stone-100 text-stone-800 border border-stone-200',
                    desc: 'Staff account',
                  };
                  const initials = member.name
                    .split(' ')
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={member._id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#171B18] text-[#A7F432] font-black text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-stone-900 block leading-tight">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              Joined {new Date(member.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">
                        {member.email}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] ${roleMeta.badgeClass}`}>
                            {roleMeta.label}
                          </span>
                          <span className="text-[10px] text-stone-400 block mt-0.5 max-w-xs truncate">
                            {roleMeta.desc}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {member.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded-full text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-500">
                        {member.lastLoginAt ? (
                          new Date(member.lastLoginAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-stone-400 italic">Never</span>
                        )}
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openEditModal(member)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 border border-stone-200 transition-colors"
                          >
                            <Edit2 className="w-3 h-3 text-stone-500" />
                            <span>Edit</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Team Member Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#171B18] text-[#A7F432] font-black text-xs flex items-center justify-center">
                  +
                </div>
                <h3 className="font-bold text-sm text-stone-900">Add New Team Member</h3>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Imran Shaikh"
                    value={newForm.name}
                    onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. imran@miestilo.com"
                    value={newForm.email}
                    onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Initial Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={newForm.password}
                    onChange={(e) => setNewForm({ ...newForm, password: e.target.value })}
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Operational Role</label>
                <select
                  value={newForm.role}
                  onChange={(e) => setNewForm({ ...newForm, role: e.target.value })}
                  className="input-field"
                >
                  <option value="ORDER_MANAGER">Order Manager (Sales, Packing & Allocations)</option>
                  <option value="ADMIN">Admin (Full Operations & Stock)</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager (Stock, Inward & Transfers)</option>
                  <option value="SALES_MANAGER">Sales Manager (Client Accounts & Orders)</option>
                  <option value="WAREHOUSE_STAFF">Warehouse Staff (Picking, Packing & Dispatch)</option>
                  <option value="MANAGEMENT">Executive (Reports & Audits)</option>
                  <option value="SUPER_ADMIN">Super Admin (Founder & MD)</option>
                </select>
                <p className="text-[10px] text-stone-400 mt-1">
                  {ROLE_CONFIG[newForm.role]?.desc}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="newActive"
                  checked={newForm.isActive}
                  onChange={(e) => setNewForm({ ...newForm, isActive: e.target.checked })}
                  className="rounded border-stone-300 text-stone-900 focus:ring-0"
                />
                <label htmlFor="newActive" className="text-xs text-stone-700 font-medium">
                  Active account (allowed to sign in)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-4 font-bold shadow-sm"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Member Modal */}
      {editModalOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-center">
                  <Edit2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900">Edit Team Member</h3>
                  <span className="text-[10px] text-stone-400">{selectedMember.email}</span>
                </div>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Operational Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="input-field"
                >
                  <option value="ORDER_MANAGER">Order Manager (Sales, Packing & Allocations)</option>
                  <option value="ADMIN">Admin (Full Operations & Stock)</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager (Stock, Inward & Transfers)</option>
                  <option value="SALES_MANAGER">Sales Manager (Client Accounts & Orders)</option>
                  <option value="WAREHOUSE_STAFF">Warehouse Staff (Picking, Packing & Dispatch)</option>
                  <option value="MANAGEMENT">Executive (Reports & Audits)</option>
                  <option value="SUPER_ADMIN">Super Admin (Founder & MD)</option>
                </select>
                <p className="text-[10px] text-stone-400 mt-1">
                  {ROLE_CONFIG[editForm.role]?.desc}
                </p>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  Reset Password <span className="text-stone-400 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Enter new secure password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editActive"
                  checked={editForm.isActive}
                  disabled={selectedMember._id === currentUser?.id}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="rounded border-stone-300 text-stone-900 focus:ring-0"
                />
                <label htmlFor="editActive" className="text-xs text-stone-700 font-medium">
                  Active account status (allowed to sign in)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs py-2 px-4 font-bold shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
