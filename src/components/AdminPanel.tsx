import React, { useState, useEffect } from 'react';
import {
  BannerNotification,
  fetchBannerNotifications,
  saveBannerNotifications,
  DEFAULT_NOTIFICATIONS,
} from '../services/notificationService';
import { CHANNELS } from '../data/channels';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Tv,
  Calendar,
  Lock,
  ArrowLeft,
  Eye,
  Save,
  X,
  ShieldCheck,
  Flame,
  Film
} from 'lucide-react';

interface AdminPanelProps {
  onBackToApp: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToApp }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('nelitv_admin_auth') === 'true';
  });
  const [adminEmail, setAdminEmail] = useState<string>('baynithcinema@gmail.com');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<BannerNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingItem, setEditingItem] = useState<BannerNotification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Load notifications
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    setIsLoading(true);
    const data = await fetchBannerNotifications();
    setNotifications(data);
    setIsLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'Admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('nelitv_admin_auth', 'true');
      setAuthError(null);
    } else {
      setAuthError('Nenosiri si sahihi! Tafadhali tumia Admin123');
    }
  };

  const handleOpenAdd = () => {
    setEditingItem({
      id: `notif-${Date.now()}`,
      type: 'sports',
      title: '',
      subtitle: 'NBC Premier League Mubashara',
      team1Name: '',
      team1Logo: '',
      team2Name: '',
      team2Logo: '',
      posterUrl: '',
      description: '',
      eventDate: '2026-10-10T19:00:00+03:00',
      targetChannelId: 'azam-sport-1',
      targetChannelName: 'Azam Sport 1',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BannerNotification) => {
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Una uhakika unataka kufuta taarifa hii ya banner?')) return;
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    await saveBannerNotifications(updated);
    showSuccess('Taarifa imefutwa kikamilifu!');
  };

  const handleToggleActive = async (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, isActive: !n.isActive } : n
    );
    setNotifications(updated);
    await saveBannerNotifications(updated);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    // Resolve channel name
    const ch = CHANNELS.find((c) => c.id === editingItem.targetChannelId);
    const itemToSave: BannerNotification = {
      ...editingItem,
      targetChannelName: ch ? ch.name : editingItem.targetChannelName || 'Azam Sport 1',
    };

    let updated: BannerNotification[];
    const exists = notifications.some((n) => n.id === itemToSave.id);
    if (exists) {
      updated = notifications.map((n) => (n.id === itemToSave.id ? itemToSave : n));
    } else {
      updated = [itemToSave, ...notifications];
    }

    setNotifications(updated);
    setIsModalOpen(false);
    setEditingItem(null);
    await saveBannerNotifications(updated);
    showSuccess('Taarifa za banner zimehifadhiwa na zitasambazwa kwa watumiaji wote!');
  };

  const showSuccess = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // If not logged in, show Admin Login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#000000] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-black text-white">NeliTv web Admin</h1>
            <p className="text-xs text-slate-400">
              Ingia kusimamia matangazo ya mechi, countdown ya banner na chaneli.
            </p>
          </div>

          {authError && (
            <div className="bg-red-950/80 border border-red-500/50 text-red-200 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Barua Pepe (Email):</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@nelitv.app"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nenosiri (Password):</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Weka password (Admin123)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 transition"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Nenosiri la sasa: <code className="text-cyan-400 font-mono">Admin123</code>
              </span>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3 rounded-xl shadow-lg transition active:scale-95 text-xs sm:text-sm cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Ingia kwenye Dashibodi</span>
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              onClick={onBackToApp}
              className="text-xs text-slate-400 hover:text-white transition inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Rudi kwenye Tovuti ya Kawaida</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-slate-100 flex flex-col font-sans">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToApp}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Rudi kwenye App"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="NeliTV" className="w-7 h-7 object-contain" />
            <span className="font-black text-white text-sm sm:text-base">
              NeliTv web <span className="text-cyan-400">Admin Panel</span>
            </span>
            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Banners &amp; Mechi
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Plus button to add notifications */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Weka Taarifa Mpya</span>
          </button>

          <button
            onClick={() => {
              sessionStorage.removeItem('nelitv_admin_auth');
              setIsAuthenticated(false);
            }}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-800 transition"
          >
            Toka
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6 flex-1">
        {saveSuccessMsg && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs p-3.5 rounded-2xl flex items-center gap-2 shadow-lg animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Taarifa za Mechi na Banners za Homepage
            </h2>
            <p className="text-xs text-slate-400">
              Hizi zitaonekana juu ya tovuti ya wateja wote zikiwa na countdown na kupeleka moja kwa moja kwenye chaneli.
            </p>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Inapakia taarifa...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center bg-slate-950 border border-slate-900 rounded-3xl space-y-3">
            <p className="text-slate-400 text-xs">Bado hakuna taarifa za banner zilizoongezwa.</p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 bg-cyan-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Ongeza Mechi ya Kwanza</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-950 border rounded-2xl p-4 sm:p-5 transition shadow-lg space-y-3 ${
                  item.isActive ? 'border-amber-500/40 bg-slate-950/90' : 'border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        item.type === 'sports'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      {item.type === 'sports' ? 'Mechi ya Mpira (Sports)' : 'Filamu / Movie'}
                    </span>
                    <span className="text-xs font-bold text-white line-clamp-1">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Active */}
                    <button
                      onClick={() => handleToggleActive(item.id)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                        item.isActive
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {item.isActive ? 'Inaonyeshwa (Active)' : 'Imezimwa (Inactive)'}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition"
                      title="Hariri"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-red-400 border border-slate-800 transition"
                      title="Futa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Muda / Tarehe:</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {new Date(item.eventDate).toLocaleString('sw-TZ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Chaneli Inayoonyesha:</span>
                    <span className="text-cyan-400 font-semibold">{item.targetChannelName || item.targetChannelId}</span>
                  </div>

                  {item.type === 'sports' ? (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Timu:</span>
                      <span>
                        {item.team1Name || 'Timu 1'} <strong className="text-amber-400">VS</strong> {item.team2Name || 'Timu 2'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Aina:</span>
                      <span>{item.subtitle || 'Filamu / Tamthilia'}</span>
                    </div>
                  )}
                </div>

                {/* Team logos or poster preview */}
                <div className="flex items-center gap-3 pt-1">
                  {item.type === 'sports' ? (
                    <div className="flex items-center gap-3">
                      {item.team1Logo && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <img src={item.team1Logo} alt={item.team1Name} className="w-6 h-6 object-contain" />
                          <span>{item.team1Name}</span>
                        </div>
                      )}
                      {item.team2Logo && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <img src={item.team2Logo} alt={item.team2Name} className="w-6 h-6 object-contain" />
                          <span>{item.team2Name}</span>
                        </div>
                      )}
                    </div>
                  ) : item.posterUrl ? (
                    <div className="flex items-center gap-2">
                      <img src={item.posterUrl} alt={item.title} className="w-10 h-14 object-cover rounded-lg border border-slate-800" />
                      <span className="text-xs text-slate-400">{item.description || item.title}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL: ADD / EDIT NOTIFICATION */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-white font-bold text-base">
                {notifications.some((n) => n.id === editingItem.id) ? 'Hariri Taarifa ya Banner' : 'Weka Taarifa Mpya ya Banner'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Aina ya Taarifa:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, type: 'sports' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      editingItem.type === 'sports'
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    Mechi ya Mpira (Sports)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, type: 'movie' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      editingItem.type === 'movie'
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    Filamu / Tamthilia (Movie)
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kichwa cha Habari (Title):
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="Mfano: Kariakoo Derby: Yanga SC vs Simba SC"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Maelezo Fupi (Subtitle / Ligi):
                </label>
                <input
                  type="text"
                  value={editingItem.subtitle || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, subtitle: e.target.value })}
                  placeholder="Mfano: NBC Premier League • Benjamin Mkapa Stadium"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 transition"
                />
              </div>

              {/* Sports Fields */}
              {editingItem.type === 'sports' && (
                <div className="space-y-3 p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Jina la Timu 1:</label>
                      <input
                        type="text"
                        required
                        value={editingItem.team1Name || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, team1Name: e.target.value })}
                        placeholder="Yanga SC"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Logo URL Timu 1:</label>
                      <input
                        type="url"
                        value={editingItem.team1Logo || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, team1Logo: e.target.value })}
                        placeholder="https://.../yanga.png"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Jina la Timu 2:</label>
                      <input
                        type="text"
                        required
                        value={editingItem.team2Name || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, team2Name: e.target.value })}
                        placeholder="Simba SC"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Logo URL Timu 2:</label>
                      <input
                        type="url"
                        value={editingItem.team2Logo || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, team2Logo: e.target.value })}
                        placeholder="https://.../simba.png"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Movie Fields */}
              {editingItem.type === 'movie' && (
                <div className="space-y-3 p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Poster URL:</label>
                    <input
                      type="url"
                      value={editingItem.posterUrl || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, posterUrl: e.target.value })}
                      placeholder="https://.../poster.jpg"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Maelezo (Description):</label>
                    <textarea
                      value={editingItem.description || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                      placeholder="Maelezo kuhusu filamu au tamthilia..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* Date & Time for Countdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tarehe na Saa ya Mechi/Tukio (Kwa ajili ya Countdown):
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.eventDate}
                  onChange={(e) => setEditingItem({ ...editingItem, eventDate: e.target.value })}
                  placeholder="2026-10-10T19:00:00+03:00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Format: YYYY-MM-DDTHH:mm:ss+03:00 (Mfano: 2026-10-10T19:00:00+03:00 ya kesho saa 1 usiku)
                </span>
              </div>

              {/* Target Channel */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Chaneli ya Kuangalia (User Akibonyeza):
                </label>
                <select
                  value={editingItem.targetChannelId}
                  onChange={(e) => setEditingItem({ ...editingItem, targetChannelId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white"
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name} ({ch.categoryLabel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Switch */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="notif-active"
                  checked={editingItem.isActive}
                  onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                  className="rounded text-cyan-500 focus:ring-cyan-400 w-4 h-4 bg-slate-950 border-slate-800"
                />
                <label htmlFor="notif-active" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Ionyeshwe kwenye Homepage ya wateja wote (Active)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Hifadhi Taarifa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
