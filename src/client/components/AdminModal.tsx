import React, { useEffect, useState } from 'react';
import {
  Activity,
  Check,
  CreditCard,
  Key,
  Plus,
  RefreshCw,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { AccessCodeRecord, AuditLogItem, PaymentRecord, UserSession } from '../../shared/types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const { token, user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'users' | 'codes' | 'payments' | 'audit' | 'status'>('users');
  const [loading, setLoading] = useState(false);

  const [usersList, setUsersList] = useState<UserSession[]>([]);
  const [codesList, setCodesList] = useState<AccessCodeRecord[]>([]);
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [auditList, setAuditList] = useState<AuditLogItem[]>([]);
  const [sysStatus, setSysStatus] = useState<any>(null);

  // New code form state
  const [newCodeVal, setNewCodeVal] = useState('');
  const [newCodeDesc, setNewCodeDesc] = useState('');
  const [newCodeMax, setNewCodeMax] = useState('50');
  const [codeSuccessMsg, setCodeSuccessMsg] = useState('');

  if (!isOpen) return null;

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setUsersList(data.users);
      } else if (activeTab === 'codes') {
        const res = await fetch('/api/admin/access-codes', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setCodesList(data.accessCodes);
      } else if (activeTab === 'payments') {
        const res = await fetch('/api/admin/payments', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setPaymentsList(data.payments);
      } else if (activeTab === 'audit') {
        const res = await fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setAuditList(data.auditLogs);
      } else if (activeTab === 'status') {
        const res = await fetch('/api/system/status');
        const data = await res.json();
        setSysStatus(data);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, isOpen]);

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeVal.trim()) return;

    try {
      const res = await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: newCodeVal.trim(),
          description: newCodeDesc.trim() || 'Admin tomonidan yaratildi',
          maxUses: Number(newCodeMax) || 50,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCodeSuccessMsg(`Kod muvaffaqiyatli saqlandi: ${newCodeVal}`);
        setNewCodeVal('');
        setNewCodeDesc('');
        fetchData();
        setTimeout(() => setCodeSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Error creating code:', err);
    }
  };

  const handleToggleCode = async (id: string, currentActive: boolean) => {
    try {
      await fetch(`/api/admin/access-codes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      fetchData();
    } catch (err) {
      console.error('Error toggling code:', err);
    }
  };

  const handleApprovePayment = async (payId: string) => {
    try {
      // Auto-assign sample access code or generate one
      const sampleCode = '07080717';
      await fetch(`/api/admin/payments/${payId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: 'Tasdiqlangan',
          codeIssued: sampleCode,
          note: 'Administrator tasdiqladi',
        }),
      });
      fetchData();
    } catch (err) {
      console.error('Error approving payment:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                {t('adminDashboard')}
              </h3>
              <p className="text-xs text-slate-400">
                Kirish: {user?.fullName} ({user?.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 overflow-x-auto shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition shrink-0 ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {t('usersTab')}
          </button>

          <button
            onClick={() => setActiveTab('codes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition shrink-0 ${
              activeTab === 'codes'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            {t('codesTab')}
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition shrink-0 ${
              activeTab === 'payments'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            {t('paymentsTab')}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition shrink-0 ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {t('auditTab')}
          </button>

          <button
            onClick={() => setActiveTab('status')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition shrink-0 ${
              activeTab === 'status'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            {t('statusTab')}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-200">
                Faol va ruxsat berilgan foydalanuvchilar ({usersList.length})
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">F.I.SH.</th>
                      <th className="p-3">Telefon</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3">Kodi</th>
                      <th className="p-3">Sessiya muddati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">
                          Hozircha foydalanuvchilar mavjud emas
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.userId} className="hover:bg-slate-800/40">
                          <td className="p-3 font-medium text-white">{u.fullName}</td>
                          <td className="p-3 font-mono">{u.phone}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                u.role === 'admin'
                                  ? 'bg-violet-500/20 text-violet-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-indigo-300">
                            {u.codeUsed || '—'}
                          </td>
                          <td className="p-3 text-slate-400">
                            {new Date(u.expiresAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CODES TAB */}
          {activeTab === 'codes' && (
            <div className="space-y-6">
              {/* Add new code form */}
              <form
                onSubmit={handleCreateCode}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3"
              >
                <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {t('createNewCode')}
                </h5>
                {codeSuccessMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
                    {codeSuccessMsg}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Kirish kodi</label>
                    <input
                      type="text"
                      placeholder="Masalan: 88990011"
                      value={newCodeVal}
                      onChange={(e) => setNewCodeVal(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">{t('codeDescription')}</label>
                    <input
                      type="text"
                      placeholder="Masalan: Yangi o'quvchi obunasi"
                      value={newCodeDesc}
                      onChange={(e) => setNewCodeDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">{t('maxUses')}</label>
                    <input
                      type="number"
                      value={newCodeMax}
                      onChange={(e) => setNewCodeMax(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Kodni qo'shish
                </button>
              </form>

              {/* Codes table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">Kod</th>
                      <th className="p-3">Tavsif</th>
                      <th className="p-3">Ishlatildi / Chegara</th>
                      <th className="p-3">Holat</th>
                      <th className="p-3">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {codesList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-indigo-300">{c.code}</td>
                        <td className="p-3 text-slate-300">{c.description}</td>
                        <td className="p-3 font-mono">
                          {c.usedCount} / {c.maxUses}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              c.isActive
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {c.isActive ? 'Faol' : 'Nofaol'}
                          </span>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleCode(c.id, c.isActive)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition"
                          >
                            {c.isActive ? 'O‘chirish' : 'Yoqish'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-200">
                To'lov arizalari (70 000 so‘m)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">Foydalanuvchi</th>
                      <th className="p-3">Telefon</th>
                      <th className="p-3">Summa</th>
                      <th className="p-3">Holat</th>
                      <th className="p-3">Berilgan kod</th>
                      <th className="p-3">Amal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {paymentsList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-medium text-white">{p.userName}</td>
                        <td className="p-3 font-mono">{p.phone}</td>
                        <td className="p-3 font-mono text-emerald-300">
                          {p.amount.toLocaleString()} so‘m
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.status === 'Tasdiqlangan'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : p.status === 'Rad etilgan'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-indigo-300">
                          {p.codeIssued || '—'}
                        </td>
                        <td className="p-3">
                          {p.status === 'Kutilmoqda' && (
                            <button
                              onClick={() => handleApprovePayment(p.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition"
                            >
                              <Check className="w-3 h-3" />
                              Tasdiqlash
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUDIT TAB */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-200">
                Tizim auditi va hodisalar jurnali
              </h4>
              <div className="space-y-2">
                {auditList.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-indigo-300 block">
                        {log.action}
                      </span>
                      <p className="text-slate-400 mt-0.5">{log.details}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {log.actor}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STATUS TAB */}
          {activeTab === 'status' && sysStatus && (
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 text-xs">
              <h4 className="text-sm font-bold text-white">Tizim holati va sozlamalari</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Server holati:</span>
                  <span className="text-emerald-400 font-bold">{sysStatus.status}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Dastur nomi:</span>
                  <span className="text-white font-bold">{sysStatus.appName}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Gemini API kaliti:</span>
                  <span
                    className={
                      sysStatus.hasGeminiKey
                        ? 'text-emerald-400 font-bold'
                        : 'text-amber-400 font-bold'
                    }
                  >
                    {sysStatus.hasGeminiKey ? 'Mavjud (Sozlangan)' : 'Yo‘q (Matematik dvigatel faol)'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Demo kodi ruxsati (07080717):</span>
                  <span className="text-indigo-300 font-bold">
                    {sysStatus.allowDemoCode ? 'Yoqilgan (Rivojlanish rejimi)' : 'O‘chirilgan'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
