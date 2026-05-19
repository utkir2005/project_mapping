import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus, Pencil, Trash2, X, ChevronDown, Check, Clock, Circle,
  Calendar, MapPin, Users, Image as ImageIcon,
  Menu, FolderOpen, BarChart3, Monitor, FileText,
  ExternalLink, ChevronLeft, ChevronRight, Upload, RotateCcw,
  FileSpreadsheet, FileType, Archive, File as FileIcon, ZoomIn,
  Loader2, History, GripVertical, LogOut, Shield,
  MessageCircle, Send, UserPlus, Download
} from 'lucide-react';

// ============ CONSTANTS ============

const STEP_TYPES = [
  { id: 'meeting',        label: 'Uchrashuv',     icon: Users },
  { id: 'seminar',        label: 'Seminar',        icon: BarChart3 },
  { id: 'online_training',label: 'Onlayn trening', icon: Monitor },
  { id: 'agreement',      label: 'Kelishuv',       icon: FileText },
  { id: 'other',          label: 'Boshqa',         icon: Circle },
];

const STATUSES = {
  done:     { label: 'Bajarilgan', icon: Check,  pill: 'bg-emerald-50 text-emerald-800 border-emerald-200', circle: 'bg-emerald-100 text-emerald-700' },
  progress: { label: 'Jarayonda',  icon: Clock,  pill: 'bg-amber-50 text-amber-900 border-amber-200',       circle: 'bg-amber-100 text-amber-700' },
  pending:  { label: 'Rejada',     icon: Circle, pill: 'bg-stone-100 text-stone-600 border-stone-200',       circle: 'bg-stone-100 text-stone-500' },
};

const DEMO_ID = 'p1';
const DEMO_PROJECTS = [{ id: DEMO_ID, name: 'Yoshlar tadbirkorligi', description: '2026 yil loyihasi · TDIU bilan hamkorlikda', order: 0 }];
const DEMO_STEPS = [
  { id: 'd1', projectId: DEMO_ID, title: "Boshlang'ich uchrashuv",  type: 'meeting',        scheduledDate: '2026-01-15', completedDate: '2026-01-15', status: 'done',     shortDescription: "Hamkorlar bilan tanishuv.",           fullDescription: "Toshkent shahar yoshlar markazi hamda 3 ta hamkor universitet vakillari ishtirok etdi.\n\nLoyiha maqsadlari, vaqt jadvali muhokama qilindi.", location: "Toshkent, Yoshlar markazi", participants: 12,   images: [], files: [] },
  { id: 'd2', projectId: DEMO_ID, title: "Talab tahlili seminari",   type: 'seminar',        scheduledDate: '2026-01-28', completedDate: '2026-01-28', status: 'done',     shortDescription: "Yoshlar ehtiyojlarini aniqlash.",     fullDescription: "150 dan ortiq yoshdan ma'lumot to'plandi.\n\nAsosiy ehtiyojlar: moliya savodxonligi, marketing, huquqiy bilim.", location: "Toshkent",       participants: 28,   images: [], files: [] },
  { id: 'd3', projectId: DEMO_ID, title: "Biznes asoslari trening",  type: 'online_training',scheduledDate: '2026-02-12', completedDate: '2026-02-12', status: 'done',     shortDescription: "4 soatlik onlayn dars.",              fullDescription: "Zoom orqali o'tkazildi. 87 ta qatnashchi muvaffaqiyatli o'tdi.",                                                             location: "Onlayn (Zoom)",  participants: 87,   images: [], files: [] },
  { id: 'd4', projectId: DEMO_ID, title: "Hamkorlik kelishuvi",       type: 'agreement',      scheduledDate: '2026-03-05', completedDate: '2026-03-05', status: 'done',     shortDescription: "TDIU bilan 2 yillik shartnoma.",      fullDescription: "Talabalarga amaliyot joylari, stipendiya, birgalikda tadqiqotlar. HM-2026/14.",                                              location: "TDIU, Toshkent", participants: 6,    images: [], files: [] },
  { id: 'd5', projectId: DEMO_ID, title: "Marketing strategiyasi",    type: 'seminar',        scheduledDate: '2026-04-18', completedDate: null,         status: 'progress', shortDescription: "Raqamli marketing seminari.",         fullDescription: "4 sessiyadan 2 tasi o'tkazildi.",                                                                                          location: "IT Park",        participants: 45,   images: [], files: [] },
  { id: 'd6', projectId: DEMO_ID, title: "Moliyaviy savodxonlik",     type: 'online_training',scheduledDate: '2026-05-10', completedDate: null,         status: 'pending',  shortDescription: "Moliyani boshqarish onlayn kursi.",   fullDescription: "Budjet, soliq, investitsiya. 6 soatlik dastur.",                                                                           location: "Onlayn",         participants: null, images: [], files: [] },
];

// ============ HELPERS ============

const newId = () => 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const months = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatHistoryDate(ts) {
  const d = new Date(ts);
  const months = ['Yan','Fev','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
  const diff = Date.now() - d.getTime();
  const min  = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const hhmm = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  if (min < 1)   return 'Hozir';
  if (min < 60)  return `${min} daqiqa oldin`;
  if (hour < 24) return `Bugun, ${hhmm}`;
  if (hour < 48) return `Kecha, ${hhmm}`;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hhmm}`;
}

function formatCommentDate(ts) {
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  const min  = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  if (min < 1)   return 'Hozir';
  if (min < 60)  return `${min} d. oldin`;
  if (hour < 24) return `${hour} s. oldin`;
  return formatDateShort(ts.slice(0, 10));
}

function effectiveDate(step) {
  return step.status === 'done' && step.completedDate ? step.completedDate : step.scheduledDate;
}

function getStepTypeMeta(typeId) {
  return STEP_TYPES.find(t => t.id === typeId) || STEP_TYPES[4];
}

function getFileMeta(file) {
  const name = file.name || file.url || '';
  const ext  = name.toLowerCase().split('.').pop();
  if (['pdf'].includes(ext))               return { icon: FileText,        color: 'text-red-700 bg-red-50',         label: 'PDF' };
  if (['doc','docx'].includes(ext))        return { icon: FileText,        color: 'text-blue-700 bg-blue-50',       label: 'DOC' };
  if (['xls','xlsx','csv'].includes(ext))  return { icon: FileSpreadsheet, color: 'text-emerald-700 bg-emerald-50', label: 'XLS' };
  if (['ppt','pptx'].includes(ext))        return { icon: FileType,        color: 'text-orange-700 bg-orange-50',   label: 'PPT' };
  if (['zip','rar','7z'].includes(ext))    return { icon: Archive,         color: 'text-purple-700 bg-purple-50',   label: 'ZIP' };
  if (['jpg','jpeg','png','gif','webp','svg'].includes(ext)) return { icon: ImageIcon, color: 'text-pink-700 bg-pink-50', label: 'IMG' };
  return { icon: FileIcon, color: 'text-stone-700 bg-stone-100', label: 'FILE' };
}

// Token bilan fetch — har joyda ishlatiladi
function apiFetch(url, token, options = {}) {
  const { body, headers: extraHeaders, ...rest } = options;
  return fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
    ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  });
}

// ============ MAIN APP ============

export default function App() {
  // Auth
  const [token,       setToken]       = useState(() => localStorage.getItem('auth_token'));
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Data
  const [projects,          setProjects]          = useState([]);
  const [steps,             setSteps]             = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading,           setLoading]           = useState(true);

  // UI
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [expandedStepId, setExpandedStepId] = useState(null);
  const [projectModal,   setProjectModal]   = useState(null);
  const [stepModal,      setStepModal]      = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [lightbox,       setLightbox]       = useState(null);
  const [showHistory,    setShowHistory]    = useState(false);
  const [showAdmin,      setShowAdmin]      = useState(false);

  // Drag
  const [dragId,     setDragId]     = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  // Saqlashdan avval yuklash tugaganini ta'minlash uchun
  const hasLoaded = useRef(false);

  const isAdmin    = user?.role === 'admin';
  const canEdit    = isAdmin;
  const canComment = isAdmin || user?.role === 'commenter';

  // ── Token tekshirish ──
  useEffect(() => {
    if (!token) { setAuthLoading(false); return; }
    apiFetch('/api/auth/me', token)
      .then(r => r.ok ? r.json() : null)
      .then(u => {
        if (u) setUser(u);
        else   handleLogout();
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth_token', newToken);
  };

  const handleLogout = () => {
    setToken(null); setUser(null);
    setProjects([]); setSteps([]);
    setSelectedProjectId(null);
    localStorage.removeItem('auth_token');
  };

  // ── Ma'lumotlarni yuklash ──
  useEffect(() => {
    if (!user || !token) return;
    hasLoaded.current = false;
    setLoading(true);
    apiFetch('/api/data', token)
      .then(r => r.json())
      .then(d => {
        const prjs = d.projects || [];
        const stps = d.steps    || [];
        setProjects(prjs);
        setSteps(stps);
        if (prjs.length > 0) setSelectedProjectId(prjs[0].id);
        hasLoaded.current = true;
        setLoading(false);
      })
      .catch(() => {
        // Xatolikda projectlarni o'zgartirmaymiz
        hasLoaded.current = true;
        setLoading(false);
      });
  }, [user]);

  // ── Ma'lumotlarni saqlash (faqat admin, faqat yuklangandan keyin) ──
  useEffect(() => {
    if (loading || !isAdmin || !token || !hasLoaded.current) return;
    apiFetch('/api/data', token, {
      method: 'POST',
      body: JSON.stringify({ projects, steps, selectedProjectId }),
    }).catch(console.warn);
  }, [projects, steps, selectedProjectId, loading, isAdmin]);

  // ── Computed ──
  const sortedProjects = useMemo(() =>
    [...projects].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
    [projects]
  );

  const currentProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const projectSteps = useMemo(() => {
    if (!selectedProjectId) return [];
    return steps
      .filter(s => s.projectId === selectedProjectId)
      .filter(s => filterStatus === 'all' || s.status === filterStatus)
      .sort((a, b) => {
        const da = effectiveDate(a), db_ = effectiveDate(b);
        if (!da) return 1; if (!db_) return -1;
        return da.localeCompare(db_);
      });
  }, [steps, selectedProjectId, filterStatus]);

  const allProjectSteps = useMemo(
    () => selectedProjectId ? steps.filter(s => s.projectId === selectedProjectId) : [],
    [steps, selectedProjectId]
  );

  const stats = useMemo(() => {
    const total    = allProjectSteps.length;
    const done     = allProjectSteps.filter(s => s.status === 'done').length;
    const progress = allProjectSteps.filter(s => s.status === 'progress').length;
    const pending  = allProjectSteps.filter(s => s.status === 'pending').length;
    return { total, done, progress, pending, percent: total ? Math.round((done / total) * 100) : 0 };
  }, [allProjectSteps]);

  // ── Drag & Drop ──
  const handleDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver  = (e, id) => { e.preventDefault(); if (id !== dragId) setDragOverId(id); };
  const handleDragEnd   = () => { setDragId(null); setDragOverId(null); };
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { handleDragEnd(); return; }
    const sorted = [...sortedProjects];
    const fi = sorted.findIndex(p => p.id === dragId);
    const ti = sorted.findIndex(p => p.id === targetId);
    const r  = [...sorted];
    const [m] = r.splice(fi, 1);
    r.splice(ti, 0, m);
    setProjects(r.map((p, i) => ({ ...p, order: i })));
    handleDragEnd();
  };

  // ── CRUD ──
  const saveProject = (p) => {
    if (p.id) {
      setProjects(prev => prev.map(x => x.id === p.id ? { ...x, name: p.name, description: p.description } : x));
    } else {
      const maxOrder = projects.reduce((m, x) => Math.max(m, x.order ?? 0), -1);
      const np = { id: newId(), name: p.name, description: p.description, order: maxOrder + 1 };
      setProjects(prev => [...prev, np]);
      setSelectedProjectId(np.id);
    }
    setProjectModal(null);
  };

  const deleteProject = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setSteps(prev => prev.filter(s => s.projectId !== id));
    if (selectedProjectId === id) {
      const rem = sortedProjects.filter(p => p.id !== id);
      setSelectedProjectId(rem[0]?.id || null);
    }
    setConfirmDelete(null);
  };

  const saveStep = (s) => {
    if (s.id) setSteps(prev => prev.map(x => x.id === s.id ? { ...x, ...s } : x));
    else      setSteps(prev => [...prev, { ...s, id: newId(), projectId: selectedProjectId }]);
    setStepModal(null);
  };

  const deleteStep = (id) => {
    setSteps(prev => prev.filter(s => s.id !== id));
    if (expandedStepId === id) setExpandedStepId(null);
    setConfirmDelete(null);
  };

  const resetDemo = () => {
    setProjects(prev => [...prev.filter(p => p.id !== DEMO_ID), DEMO_PROJECTS[0]]);
    setSteps(prev => [...prev.filter(s => s.projectId !== DEMO_ID), ...DEMO_STEPS]);
    setSelectedProjectId(DEMO_ID);
    setConfirmDelete(null);
  };

  const restoreFromHistory = (data) => {
    setProjects(data.projects || []);
    setSteps(data.steps    || []);
    setSelectedProjectId(data.selectedProjectId || data.projects?.[0]?.id || null);
    setShowHistory(false);
  };

  const openLightbox = useCallback((images, index) => setLightbox({ images, index }), []);

  if (authLoading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="font-body min-h-screen bg-stone-50 text-stone-900">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 rounded-md hover:bg-stone-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-stone-900 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-stone-50" />
              </div>
              <span className="font-display text-lg" style={{ fontWeight: 500 }}>Loyihalarim</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <>
                <button onClick={() => setShowAdmin(true)}  title="Admin panel"           className="p-2 rounded-md hover:bg-stone-100 text-stone-500"><Shield  className="w-4 h-4" /></button>
                <button onClick={() => setShowHistory(true)} title="O'zgartirishlar tarixi" className="p-2 rounded-md hover:bg-stone-100 text-stone-500"><History className="w-4 h-4" /></button>
              </>
            )}
            {canEdit && (
              <button onClick={() => setProjectModal('new')} className="text-sm px-3 py-1.5 rounded-md bg-stone-900 text-white hover:bg-stone-800 flex items-center gap-1.5 ml-1">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Yangi loyiha</span>
              </button>
            )}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-stone-200">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-stone-800">{user.name}</span>
                <span className="text-[10px] text-stone-400 capitalize">{user.role === 'admin' ? 'Admin' : user.role === 'commenter' ? 'Kommentchi' : 'Kuzatuvchi'}</span>
              </div>
              <button onClick={handleLogout} title="Chiqish" className="p-1.5 rounded-md hover:bg-stone-100 text-stone-500">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex gap-8">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'fixed inset-0 z-40 bg-black/40 md:bg-transparent md:static md:inset-auto' : 'hidden md:block'}`}
               onClick={(e) => { if (e.target === e.currentTarget) setSidebarOpen(false); }}>
          <div className="bg-white md:bg-transparent w-72 md:w-56 h-full md:h-auto p-4 md:p-0 border-r md:border-0 border-stone-200 flex flex-col">
            <div className="flex items-center justify-between mb-3 md:mb-2">
              <span className="text-xs uppercase tracking-wider text-stone-500" style={{ letterSpacing: '0.08em' }}>Loyihalar</span>
              <button className="md:hidden p-1" onClick={() => setSidebarOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <nav className="space-y-0.5 flex-1">
              {sortedProjects.length === 0 && <div className="text-sm text-stone-500 py-2">Hali loyiha yo'q</div>}
              {sortedProjects.map(p => (
                <div key={p.id}
                  draggable={canEdit}
                  onDragStart={(e) => canEdit && handleDragStart(e, p.id)}
                  onDragOver={(e)  => canEdit && handleDragOver(e, p.id)}
                  onDrop={(e)      => canEdit && handleDrop(e, p.id)}
                  onDragEnd={handleDragEnd}
                  className={`rounded-md transition-all ${dragOverId === p.id && dragId !== p.id ? 'border-2 border-stone-400 border-dashed' : 'border-2 border-transparent'} ${dragId === p.id ? 'opacity-40' : ''}`}
                >
                  <button
                    onClick={() => { setSelectedProjectId(p.id); setSidebarOpen(false); setExpandedStepId(null); setFilterStatus('all'); }}
                    className={`w-full text-left px-2.5 py-2 rounded-md text-sm flex items-center gap-2 ${p.id === selectedProjectId ? 'bg-stone-900 text-white' : 'hover:bg-stone-100 text-stone-700'}`}
                  >
                    {canEdit && <GripVertical className="w-3.5 h-3.5 flex-shrink-0 opacity-30 cursor-grab" />}
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.id === selectedProjectId ? 'bg-emerald-400' : 'bg-stone-300'}`}></span>
                    <span className="flex-1 truncate">{p.name}</span>
                  </button>
                </div>
              ))}
            </nav>
            {isAdmin && (
              <button onClick={() => setConfirmDelete({ type: 'reset' })} className="mt-4 text-xs text-stone-400 hover:text-stone-600 inline-flex items-center gap-1 self-start">
                <RotateCcw className="w-3 h-3" /> Demo tiklash
              </button>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-stone-400" /></div>
          ) : !currentProject ? (
            <EmptyState onCreate={() => canEdit && setProjectModal('new')} canCreate={canEdit} />
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h1 className="font-display text-3xl md:text-4xl leading-tight" style={{ fontWeight: 500 }}>{currentProject.name}</h1>
                  {canEdit && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setProjectModal(currentProject)} className="p-2 rounded-md hover:bg-stone-100 text-stone-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDelete({ type: 'project', id: currentProject.id, name: currentProject.name })} className="p-2 rounded-md hover:bg-red-50 text-stone-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
                {currentProject.description && <p className="text-stone-600 text-sm">{currentProject.description}</p>}
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 mb-5">
                <div className="flex items-baseline justify-between mb-2.5">
                  <span className="text-xs uppercase tracking-wider text-stone-500" style={{ letterSpacing: '0.08em' }}>Umumiy progress</span>
                  <span className="font-display text-2xl" style={{ fontWeight: 500 }}>{stats.percent}<span className="text-stone-400 text-base">%</span></span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${stats.percent}%` }}></div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <FilterPill active={filterStatus === 'all'}      onClick={() => setFilterStatus('all')}>Hammasi · {stats.total}</FilterPill>
                  <FilterPill active={filterStatus === 'done'}     onClick={() => setFilterStatus('done')}     status="done">    <Check className="w-3 h-3" /> {stats.done}</FilterPill>
                  <FilterPill active={filterStatus === 'progress'} onClick={() => setFilterStatus('progress')} status="progress"><Clock className="w-3 h-3" /> {stats.progress}</FilterPill>
                  <FilterPill active={filterStatus === 'pending'}  onClick={() => setFilterStatus('pending')}  status="pending"> <Circle className="w-3 h-3" /> {stats.pending}</FilterPill>
                </div>
              </div>

              {canEdit && (
                <button onClick={() => setStepModal('new')} className="w-full mb-4 py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-600 hover:border-stone-400 hover:bg-white text-sm flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Yangi bosqich qo'shish
                </button>
              )}

              {projectSteps.length === 0 ? (
                <div className="text-center py-12 text-stone-500 text-sm">Bu filtrda bosqich topilmadi.</div>
              ) : (
                <div className="space-y-2.5">
                  {projectSteps.map((step, idx) => (
                    <StepCard
                      key={step.id} step={step} isLast={idx === projectSteps.length - 1}
                      expanded={expandedStepId === step.id}
                      onToggle={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)}
                      onEdit={canEdit ? () => setStepModal(step) : null}
                      onDelete={canEdit ? () => setConfirmDelete({ type: 'step', id: step.id, name: step.title }) : null}
                      onOpenLightbox={openLightbox}
                      canComment={canComment}
                      user={user} token={token}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {canEdit && projectModal !== null && <ProjectModal project={projectModal === 'new' ? null : projectModal} onSave={saveProject} onClose={() => setProjectModal(null)} />}
      {canEdit && stepModal !== null && selectedProjectId && <StepModal step={stepModal === 'new' ? null : stepModal} onSave={saveStep} onClose={() => setStepModal(null)} />}
      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.type === 'reset' ? "Demo tiklash?" : confirmDelete.type === 'project' ? "Loyihani o'chirish?" : "Bosqichni o'chirish?"}
          message={confirmDelete.type === 'reset' ? `"Yoshlar tadbirkorligi" demo loyihasi tiklanadi. Boshqa loyihalar o'zgarmaydi.` : `"${confirmDelete.name}" — qaytarib bo'lmaydi.`}
          confirmLabel={confirmDelete.type === 'reset' ? 'Tiklash' : "O'chirish"}
          danger={confirmDelete.type !== 'reset'}
          onConfirm={() => {
            if      (confirmDelete.type === 'project') deleteProject(confirmDelete.id);
            else if (confirmDelete.type === 'step')    deleteStep(confirmDelete.id);
            else                                       resetDemo();
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {lightbox    && <Lightbox images={lightbox.images} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
      {showHistory && isAdmin && <HistoryModal token={token} onRestore={restoreFromHistory} onClose={() => setShowHistory(false)} />}
      {showAdmin   && isAdmin && <AdminPanel token={token} projects={projects} onClose={() => setShowAdmin(false)} />}
    </div>
  );
}

// ============ LOGIN SCREEN ============

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    if (!username || !password) return;
    setLoading(true); setError('');
    try {
      const r    = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const data = await r.json();
      if (data.token) onLogin(data.token, data.user);
      else            setError(data.error || 'Noto\'g\'ri login yoki parol');
    } catch { setError('Server bilan bog\'lanib bo\'lmadi'); }
    setLoading(false);
  };

  return (
    <div className="font-body min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-stone-200 p-8 w-full max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center mx-auto mb-5">
          <FolderOpen className="w-6 h-6 text-stone-50" />
        </div>
        <h1 className="font-display text-2xl text-center mb-1" style={{ fontWeight: 500 }}>Loyihalarim</h1>
        <p className="text-stone-500 text-sm text-center mb-6">Kirish uchun ma'lumotlaringizni kiriting</p>
        <div className="space-y-3">
          <input className={inputCls} placeholder="Login" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
          <input type="password" className={inputCls} placeholder="Parol" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</div>}
          <button onClick={submit} disabled={loading} className="w-full py-2.5 bg-stone-900 text-white rounded-md text-sm hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Kirish
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ ADMIN PANEL ============

function AdminPanel({ token, projects, onClose }) {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [userModal,  setUserModal]  = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const [importData, setImportData] = useState(null);
  const [importing,  setImporting]  = useState(false);

  const loadUsers = () => {
    apiFetch('/api/users', token)
      .then(r => r.json())
      .then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { loadUsers(); }, []);

  const handleExport = async () => {
    try {
      const r    = await apiFetch('/api/data', token);
      const data = await r.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `loyihalarim_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export xatoligi: ' + e.message); }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.projects || !data.steps) { alert('Noto\'g\'ri fayl formati'); return; }
      setImportData(data);
    } catch { alert('Fayl o\'qishda xatolik — JSON format to\'g\'ri emas'); }
    e.target.value = '';
  };

  const [cleaning,   setCleaning]   = useState(false);
  const [cleanResult,setCleanResult]= useState('');

  const handleCleanImages = async () => {
    setCleaning(true); setCleanResult('');
    try {
      const r = await apiFetch('/api/admin/clean-images', token, { method: 'POST' });
      const d = await r.json();
      setCleanResult(d.message || 'Tozalandi');
    } catch { setCleanResult('Xatolik yuz berdi'); }
    setCleaning(false);
  };
    if (!importData) return;
    setImporting(true);
    try {
      await apiFetch('/api/data', token, { method: 'POST', body: importData });
      setImportData(null);
      onClose();
      window.location.reload();
    } catch { alert('Import xatoligi'); }
    setImporting(false);
  };

  const deleteUser = async (id) => {
    await apiFetch(`/api/users/${id}`, token, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.id !== id));
    setDelConfirm(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl font-body">
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-stone-500" />
            <h3 className="font-display text-lg" style={{ fontWeight: 500 }}>Admin panel</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setUserModal('new')} className="text-sm px-3 py-1.5 rounded-md bg-stone-900 text-white hover:bg-stone-800 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" /> Foydalanuvchi qo'shish
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-stone-100"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-stone-400" /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-stone-500 text-sm">
              Hali foydalanuvchi qo'shilmagan.<br />
              "Foydalanuvchi qo'shish" tugmasini bosing.
            </div>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center text-sm font-medium text-stone-700 flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-stone-900">{u.name}</span>
                      <span className="text-xs text-stone-500">@{u.username}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${u.role === 'commenter' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-700'}`}>
                        {u.role === 'commenter' ? 'Kommentchi' : 'Kuzatuvchi'}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {u.projects.length === 0 ? 'Hech qaysi loyiha biriktirilmagan' :
                        u.projects.map(pid => projects.find(p => p.id === pid)?.name || pid).join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setUserModal(u)} className="p-1.5 rounded-md hover:bg-stone-200 text-stone-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDelConfirm(u)} className="p-1.5 rounded-md hover:bg-red-50 text-stone-600 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export / Import */}
        <div className="px-5 pb-5 pt-4 border-t border-stone-100 flex-shrink-0">
          <div className="text-xs uppercase tracking-wider text-stone-500 mb-3" style={{ letterSpacing: '0.08em' }}>
            Ma'lumotlarni boshqarish
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleExport}
                    className="px-3 py-2 text-sm rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 inline-flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export (JSON)
            </button>
            <label className="px-3 py-2 text-sm rounded-md bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 inline-flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4" /> Import (JSON)
              <input type="file" accept=".json" className="hidden" onChange={handleImportFile} />
            </label>
            <button onClick={handleCleanImages} disabled={cleaning}
                    className="px-3 py-2 text-sm rounded-md bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 inline-flex items-center gap-1.5 disabled:opacity-50">
              {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Base64 rasmlarni tozalash
            </button>
          </div>
          {cleanResult && (
            <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded mt-2">{cleanResult}</p>
          )}
          <p className="text-xs text-stone-400 mt-2 leading-relaxed">
            Export — zaxira nusxa. Import — boshqa qurilmadan ma'lumot yuklash (joriy ma'lumotlar almashtiriladi).
          </p>
        </div>

        {userModal !== null && (
          <UserModal
            user={userModal === 'new' ? null : userModal}
            projects={projects}
            token={token}
            onSave={() => { loadUsers(); setUserModal(null); }}
            onClose={() => setUserModal(null)}
          />
        )}

        {delConfirm && (
          <ConfirmDialog
            title="Foydalanuvchini o'chirish?"
            message={`"${delConfirm.name}" — bu amalni qaytarib bo'lmaydi.`}
            onConfirm={() => deleteUser(delConfirm.id)}
            onCancel={() => setDelConfirm(null)}
          />
        )}

        {importData && (
          <ConfirmDialog
            title="Import qilasizmi?"
            message={`${importData.projects?.length || 0} ta loyiha, ${importData.steps?.length || 0} ta bosqich yuklanadi. Joriy barcha ma'lumotlar almashtiriladi.`}
            confirmLabel={importing ? 'Yuklanmoqda...' : 'Ha, import qilish'}
            danger={true}
            onConfirm={confirmImport}
            onCancel={() => setImportData(null)}
          />
        )}
      </div>
    </div>
  );
}

function UserModal({ user, projects, token, onSave, onClose }) {
  const [name,     setName]     = useState(user?.name     || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState(user?.role     || 'viewer');
  const [selected, setSelected] = useState(new Set(user?.projects || []));
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState(false);

  const toggleProject = (pid) => {
    setSelected(prev => { const s = new Set(prev); s.has(pid) ? s.delete(pid) : s.add(pid); return s; });
  };

  const submit = async () => {
    if (!name || !username || (!user && !password)) { setError('Ism, login va parol majburiy'); return; }
    setSaving(true); setError('');
    const body = { name, username, role, projects: [...selected], ...(password ? { password } : {}) };
    try {
      const r    = user
        ? await apiFetch(`/api/users/${user.id}`, token, { method: 'PUT',  body })
        : await apiFetch('/api/users',            token, { method: 'POST', body });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Xatolik'); setSaving(false); return; }
      onSave();
    } catch { setError('Server xatoligi'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl font-body" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-3 flex items-center justify-between z-10">
          <h3 className="font-display text-lg" style={{ fontWeight: 500 }}>{user ? 'Tahrirlash' : 'Yangi foydalanuvchi'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-stone-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block">
            <div className="text-xs font-medium text-stone-700 mb-1.5">Ism *</div>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="To'liq ism" autoFocus />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-stone-700 mb-1.5">Login *</div>
            <input className={inputCls} value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-stone-700 mb-1.5">Parol {user ? '(bo\'sh qolsa — o\'zgarmaydi)' : '*'}</div>
            <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} placeholder={user ? 'Yangi parol...' : 'Parol'} />
          </label>
          <label className="block">
            <div className="text-xs font-medium text-stone-700 mb-1.5">Rol</div>
            <select className={inputCls} value={role} onChange={e => setRole(e.target.value)}>
              <option value="viewer">Kuzatuvchi (faqat o'qiydi)</option>
              <option value="commenter">Kommentchi (o'qiydi + komment yozadi)</option>
            </select>
          </label>
          <div>
            <div className="text-xs font-medium text-stone-700 mb-2">Loyihalar</div>
            {projects.length === 0 ? (
              <p className="text-xs text-stone-500">Hali loyiha qo'shilmagan.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {projects.map(p => (
                  <label key={p.id} className="flex items-center gap-2.5 cursor-pointer p-2 rounded-md hover:bg-stone-50">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleProject(p.id)} className="rounded" />
                    <span className="text-sm text-stone-800">{p.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {error && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</div>}
          <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
            <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border border-stone-200 hover:bg-stone-50">Bekor</button>
            <button onClick={submit} disabled={saving} className="px-3 py-1.5 text-sm rounded-md bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 inline-flex items-center gap-1.5">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ COMMENTS ============

function Comments({ step, user, token, canComment }) {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);

  useEffect(() => {
    if (!step.projectId || !step.id) return;
    apiFetch(`/api/comments/${step.projectId}/${step.id}`, token)
      .then(r => r.json())
      .then(d => { setComments(Array.isArray(d) ? d : []); setLoading(false); });
  }, [step.id, step.projectId, token]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const r = await apiFetch(`/api/comments/${step.projectId}/${step.id}`, token, { method: 'POST', body: { text } });
    const c = await r.json();
    if (r.ok) { setComments(prev => [...prev, c]); setText(''); }
    setSending(false);
  };

  const del = async (id) => {
    await apiFetch(`/api/comments/${id}`, token, { method: 'DELETE' });
    setComments(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-2" style={{ letterSpacing: '0.08em' }}>
        <MessageCircle className="w-3.5 h-3.5" />
        <span>Kommentlar {!loading && comments.length > 0 && `· ${comments.length}`}</span>
        <span className="flex-1 h-px bg-stone-200"></span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-stone-400 py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Yuklanmoqda...</div>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.length === 0 && <p className="text-xs text-stone-400">Hali komment yo'q.</p>}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-700 flex-shrink-0 mt-0.5">
                {c.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-stone-800">{c.authorName}</span>
                  <span className="text-[11px] text-stone-400">{formatCommentDate(c.createdAt)}</span>
                  {(user?.role === 'admin' || user?.id === c.authorId) && (
                    <button onClick={() => del(c.id)} className="ml-auto text-stone-300 hover:text-red-500 p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-stone-700 leading-relaxed">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {canComment && (
        <div className="flex gap-2 items-end">
          <textarea
            className={`${inputCls} resize-none flex-1`}
            rows={2}
            placeholder="Komment yozing..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button onClick={send} disabled={!text.trim() || sending} className="p-2 rounded-md bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 flex-shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}

// ============ SMALL COMPONENTS ============

function FilterPill({ active, onClick, status, children }) {
  const styles = active
    ? (status ? STATUSES[status].pill : 'bg-stone-900 text-white border-stone-900')
    : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300';
  return <button onClick={onClick} className={`text-xs px-2.5 py-1 rounded-md border inline-flex items-center gap-1 transition ${styles}`}>{children}</button>;
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex-1 min-w-[140px] bg-stone-50 border border-stone-100 rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="text-sm font-medium text-stone-900 truncate">{value}</div>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <div className="text-xs uppercase tracking-wider text-stone-500 mb-2.5 flex items-center gap-2" style={{ letterSpacing: '0.08em' }}>
      <span>{children}</span><span className="flex-1 h-px bg-stone-200"></span>
    </div>
  );
}

function EmptyState({ onCreate, canCreate }) {
  return (
    <div className="text-center py-16">
      <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4"><FolderOpen className="w-6 h-6 text-stone-500" /></div>
      <h2 className="font-display text-2xl mb-2" style={{ fontWeight: 500 }}>Hali loyiha yo'q</h2>
      <p className="text-stone-600 text-sm mb-5">{canCreate ? 'Birinchi loyihangizni yarating.' : 'Sizga hali loyiha biriktirilmagan.'}</p>
      {canCreate && (
        <button onClick={onCreate} className="px-4 py-2 bg-stone-900 text-white rounded-md text-sm inline-flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Loyiha yaratish
        </button>
      )}
    </div>
  );
}

// ============ STEP CARD ============

function StepCard({ step, expanded, onToggle, onEdit, onDelete, onOpenLightbox, isLast, canComment, user, token }) {
  const typeMeta  = getStepTypeMeta(step.type);
  const TypeIcon  = typeMeta.icon;
  const statusCfg = STATUSES[step.status];
  const StatusIcon = statusCfg.icon;
  const isPending  = step.status === 'pending';
  const hasImages  = step.images?.length > 0;
  const heroImage  = hasImages ? step.images[0] : null;
  const galleryImages = hasImages ? step.images.slice(1) : [];

  return (
    <div className="flex gap-3 sm:gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusCfg.circle} ${isPending ? 'grayscale opacity-70' : ''}`}><TypeIcon className="w-5 h-5" /></div>
        {!isLast && <div className="w-px flex-1 bg-stone-200 my-1 min-h-4"></div>}
      </div>
      <div className={`flex-1 min-w-0 mb-2 ${isPending ? 'opacity-65' : ''}`}>
        <div className="bg-white border border-stone-200 rounded-xl hover:border-stone-300 transition overflow-hidden">
          <button onClick={onToggle} className="w-full text-left p-4 sm:p-5" aria-expanded={expanded}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-xs text-stone-500 tabular-nums">{formatDateShort(effectiveDate(step))}</span>
                  <span className="text-stone-300 text-xs">·</span>
                  <span className="text-xs text-stone-500">{typeMeta.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border inline-flex items-center gap-1 ${statusCfg.pill}`}><StatusIcon className="w-3 h-3" /> {statusCfg.label}</span>
                </div>
                <h3 className="font-display text-lg leading-tight mb-1" style={{ fontWeight: 500 }}>{step.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed">{step.shortDescription}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-stone-400 flex-shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {expanded && (
            <div className="border-t border-stone-100">
              {heroImage && (
                <button onClick={() => onOpenLightbox(step.images, 0)} className="block w-full relative group bg-stone-100">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={heroImage.url} alt={heroImage.caption || ''} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                         onError={(e) => { e.currentTarget.parentElement.parentElement.style.display = 'none'; }} />
                  </div>
                  <div className="absolute top-3 right-3 bg-black/50 rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition"><ZoomIn className="w-4 h-4 text-white" /></div>
                  {heroImage.caption && (
                    <div className="absolute bottom-0 left-0 right-0 pt-12 pb-3 px-4 sm:px-6 text-left" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                      <p className="text-white text-sm font-medium">{heroImage.caption}</p>
                    </div>
                  )}
                </button>
              )}

              <div className="p-4 sm:p-6">
                <div className="flex flex-wrap gap-2 mb-5">
                  <StatCard icon={Calendar} label="Reja sanasi"    value={formatDateShort(step.scheduledDate)} />
                  {step.completedDate && <StatCard icon={Check}    label="Bajarilgan"    value={formatDateShort(step.completedDate)} />}
                  {step.location      && <StatCard icon={MapPin}   label="Manzil"        value={step.location} />}
                  {step.participants  && <StatCard icon={Users}    label="Qatnashchilar" value={`${step.participants} kishi`} />}
                </div>

                {step.fullDescription && (
                  <div className="tracker-prose font-display text-stone-800 text-[15px] mb-6 max-w-2xl" style={{ fontWeight: 400 }}>
                    {step.fullDescription.split(/\n\n+/).map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                )}

                {galleryImages.length > 0 && (
                  <div className="mb-6">
                    <SectionHeader>Galereya</SectionHeader>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {galleryImages.map((img, i) => (
                        <button key={i} onClick={() => onOpenLightbox(step.images, i + 1)}
                                className="group relative block aspect-square bg-stone-100 rounded-lg overflow-hidden border border-stone-200 hover:border-stone-300">
                          <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                               onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          {img.caption && (
                            <div className="absolute bottom-0 left-0 right-0 pt-8 pb-2 px-2.5 text-left opacity-0 group-hover:opacity-100 transition" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}>
                              <p className="text-white text-xs leading-tight">{img.caption}</p>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step.files?.length > 0 && (
                  <div className="mb-6">
                    <SectionHeader>Fayllar</SectionHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {step.files.map((f, i) => {
                        const meta = getFileMeta(f); const FIcon = meta.icon;
                        return (
                          <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-3 px-3 py-2.5 bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50 rounded-lg group">
                            <div className={`w-9 h-9 rounded-md flex items-center justify-center ${meta.color} flex-shrink-0`}><FIcon className="w-4 h-4" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-stone-900 truncate">{f.name || f.url}</div>
                              <div className="text-xs text-stone-500">{meta.label}</div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Kommentlar */}
                <div className="mb-4">
                  <Comments step={step} user={user} token={token} canComment={canComment} />
                </div>

                {(onEdit || onDelete) && (
                  <div className="flex gap-2 pt-4 border-t border-stone-100">
                    {onEdit   && <button onClick={onEdit}   className="text-xs px-3 py-1.5 rounded-md border border-stone-200 hover:bg-stone-50 inline-flex items-center gap-1.5"><Pencil className="w-3.5 h-3.5" /> Tahrirlash</button>}
                    {onDelete && <button onClick={onDelete} className="text-xs px-3 py-1.5 rounded-md border border-stone-200 text-red-700 hover:bg-red-50 hover:border-red-200 inline-flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> O'chirish</button>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ LIGHTBOX ============

function Lightbox({ images, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex || 0);
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  setIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex(i => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [images.length, onClose]);
  const img = images[index];
  if (!img) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col font-body" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 text-white/80 text-sm flex-shrink-0">
        <span>{index + 1} / {images.length}</span>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-md"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 flex items-center justify-center px-2 sm:px-12 min-h-0 relative" onClick={e => e.stopPropagation()}>
        {index > 0          && <button onClick={() => setIndex(i => i - 1)} className="absolute left-2 sm:left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"><ChevronLeft  className="w-5 h-5" /></button>}
        <img src={img.url} alt={img.caption || ''} className="max-h-full max-w-full object-contain select-none" />
        {index < images.length - 1 && <button onClick={() => setIndex(i => i + 1)} className="absolute right-2 sm:right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"><ChevronRight className="w-5 h-5" /></button>}
      </div>
      {img.caption && <div className="px-4 py-4 text-center text-white/90 text-sm flex-shrink-0" onClick={e => e.stopPropagation()}>{img.caption}</div>}
    </div>
  );
}

// ============ HISTORY MODAL ============

function HistoryModal({ token, onRestore, onClose }) {
  const [list,      setList]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  useEffect(() => {
    apiFetch('/api/history', token).then(r => r.json()).then(d => { setList(d); setLoading(false); });
  }, []);

  const restore = async (id) => {
    setRestoring(id);
    const r = await apiFetch(`/api/history/${id}`, token);
    const e = await r.json();
    onRestore(e.data);
    setRestoring(null); setConfirmId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 font-body" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md max-h-[80vh] flex flex-col rounded-t-2xl sm:rounded-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2"><History className="w-4 h-4 text-stone-500" /><h3 className="font-display text-lg" style={{ fontWeight: 500 }}>O'zgartirishlar tarixi</h3></div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-stone-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-stone-400" /></div>
          : list.length === 0 ? <div className="text-center py-8 text-stone-500 text-sm">Hali tarix yo'q.</div>
          : (
            <div className="space-y-1.5">
              {list.map((entry, idx) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-100">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${idx === 0 ? 'bg-emerald-500' : 'bg-stone-300'}`}></div>
                    <div>
                      <div className="text-sm text-stone-800">{formatHistoryDate(entry.timestamp)}</div>
                      {idx === 0 && <div className="text-xs text-emerald-600">Joriy holat</div>}
                    </div>
                  </div>
                  {idx > 0 && (confirmId === entry.id ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs text-stone-500">Ishonchingiz komilmi?</span>
                      <button onClick={() => restore(entry.id)} disabled={!!restoring} className="text-xs px-2 py-1 rounded bg-stone-900 text-white hover:bg-stone-700 disabled:opacity-50 inline-flex items-center gap-1">
                        {restoring === entry.id && <Loader2 className="w-3 h-3 animate-spin" />} Ha
                      </button>
                      <button onClick={() => setConfirmId(null)} className="text-xs px-2 py-1 rounded border border-stone-200 hover:bg-stone-50">Yo'q</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(entry.id)} className="text-xs px-2.5 py-1 rounded border border-stone-200 hover:border-stone-400 text-stone-600 flex-shrink-0">Tiklash</button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-stone-100 flex-shrink-0">
          <p className="text-xs text-stone-400">Har daqiqada avtomatik saqlanadi. Maksimum 50 ta yozuv.</p>
        </div>
      </div>
    </div>
  );
}

// ============ MODALS ============

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 font-body" onClick={onClose}>
      <div className={`bg-white w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl`} onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-stone-100 px-5 py-3 flex items-center justify-between z-10">
          <h3 className="font-display text-lg" style={{ fontWeight: 500 }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-stone-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block mb-4">
      <div className="text-xs font-medium text-stone-700 mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-xs text-stone-500 mt-1">{hint}</div>}
    </label>
  );
}

const inputCls = "w-full px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:border-stone-400 bg-white";

function ProjectModal({ project, onSave, onClose }) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const submit = () => { if (!name.trim()) return; onSave({ id: project?.id || null, name: name.trim(), description: description.trim() }); };
  return (
    <Modal title={project ? 'Loyihani tahrirlash' : 'Yangi loyiha'} onClose={onClose}>
      <Field label="Loyiha nomi *"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && submit()} /></Field>
      <Field label="Tavsif"><textarea className={inputCls} rows={2} value={description} onChange={e => setDescription(e.target.value)} /></Field>
      <div className="flex gap-2 justify-end mt-2">
        <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border border-stone-200 hover:bg-stone-50">Bekor</button>
        <button onClick={submit}  className="px-3 py-1.5 text-sm rounded-md bg-stone-900 text-white hover:bg-stone-800">Saqlash</button>
      </div>
    </Modal>
  );
}

function StepModal({ step, onSave, onClose }) {
  const [title,            setTitle]            = useState(step?.title || '');
  const [type,             setType]             = useState(step?.type || 'meeting');
  const [scheduledDate,    setScheduledDate]    = useState(step?.scheduledDate || '');
  const [completedDate,    setCompletedDate]    = useState(step?.completedDate || '');
  const [status,           setStatus]           = useState(step?.status || 'pending');
  const [shortDescription, setShortDescription] = useState(step?.shortDescription || '');
  const [fullDescription,  setFullDescription]  = useState(step?.fullDescription || '');
  const [location,         setLocation]         = useState(step?.location || '');
  const [participants,     setParticipants]     = useState(step?.participants?.toString() || '');
  const [images,           setImages]           = useState(step?.images || []);
  const [files,            setFiles]            = useState(step?.files || []);
  const [imageUrl,         setImageUrl]         = useState('');
  const [imageCaption,     setImageCaption]     = useState('');
  const [fileUrl,          setFileUrl]          = useState('');
  const [fileName,         setFileName]         = useState('');

  const submit = () => {
    if (!title.trim() || !scheduledDate) return;
    onSave({
      id: step?.id || null, title: title.trim(), type, scheduledDate,
      completedDate: status === 'done' ? (completedDate || scheduledDate) : null,
      status, shortDescription: shortDescription.trim(), fullDescription: fullDescription.trim(),
      location: location.trim(), participants: participants ? parseInt(participants) : null, images, files,
    });
  };

  const addImageUrl = () => { if (!imageUrl.trim()) return; setImages(p => [...p, { url: imageUrl.trim(), caption: imageCaption.trim() }]); setImageUrl(''); setImageCaption(''); };
  const addFileUrl  = () => { if (!fileUrl.trim())  return; setFiles(p  => [...p, { url: fileUrl.trim(),  name: fileName.trim() || fileUrl.trim().split('/').pop() }]); setFileUrl(''); setFileName(''); };

  const handleUpload = (e, isImage) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (isImage) setImages(p => [...p, { url: reader.result, caption: '' }]);
      else         setFiles(p  => [...p, { url: reader.result, name: file.name }]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <Modal title={step ? 'Bosqichni tahrirlash' : 'Yangi bosqich'} onClose={onClose} wide>
      <Field label="Mavzu *"><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} autoFocus /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Turi"><select className={inputCls} value={type} onChange={e => setType(e.target.value)}>{STEP_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></Field>
        <Field label="Holati"><select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}><option value="pending">Rejada</option><option value="progress">Jarayonda</option><option value="done">Bajarilgan</option></select></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rejalashtirilgan sana *"><input type="date" className={inputCls} value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} /></Field>
        {status === 'done' && <Field label="Bajarilgan sana"><input type="date" className={inputCls} value={completedDate} onChange={e => setCompletedDate(e.target.value)} /></Field>}
      </div>
      <Field label="Qisqa tavsif"><textarea className={inputCls} rows={2} value={shortDescription} onChange={e => setShortDescription(e.target.value)} /></Field>
      <Field label="To'liq ma'lumot" hint="Yangi paragraf uchun bo'sh qator qoldiring"><textarea className={inputCls} rows={5} value={fullDescription} onChange={e => setFullDescription(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Manzil"><input className={inputCls} value={location} onChange={e => setLocation(e.target.value)} /></Field>
        <Field label="Qatnashchilar"><input type="number" className={inputCls} value={participants} onChange={e => setParticipants(e.target.value)} /></Field>
      </div>

      {/* Rasmlar */}
      <div className="mb-4">
        <div className="text-xs font-medium text-stone-700 mb-1.5">Rasmlar</div>
        <div className="flex gap-2 mb-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer border border-emerald-200"><Upload className="w-4 h-4" /> Yuklash<input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, true)} /></label>
          <span className="text-xs text-stone-400 self-center">yoki URL:</span>
        </div>
        <div className="flex gap-2 mb-2">
          <input className={inputCls} placeholder="https://..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
          <input className={`${inputCls} max-w-[120px]`} placeholder="Izoh" value={imageCaption} onChange={e => setImageCaption(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())} />
          <button onClick={addImageUrl} className="px-3 py-2 text-sm rounded-md bg-stone-100 hover:bg-stone-200 flex-shrink-0"><Plus className="w-4 h-4" /></button>
        </div>
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative group aspect-square bg-stone-100 rounded-lg overflow-hidden border border-stone-200">
                <img src={img.url} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                {i === 0 && <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-medium">Asosiy</span>}
                <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-md text-white opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fayllar */}
      <div className="mb-4">
        <div className="text-xs font-medium text-stone-700 mb-1.5">Fayllar</div>
        <div className="flex gap-2 mb-2">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md bg-blue-50 text-blue-800 hover:bg-blue-100 cursor-pointer border border-blue-200"><Upload className="w-4 h-4" /> Yuklash<input type="file" className="hidden" onChange={e => handleUpload(e, false)} /></label>
          <span className="text-xs text-stone-400 self-center">yoki URL:</span>
        </div>
        <div className="flex gap-2 mb-2">
          <input className={inputCls} placeholder="https://..." value={fileUrl} onChange={e => setFileUrl(e.target.value)} />
          <input className={`${inputCls} max-w-[120px]`} placeholder="Nomi" value={fileName} onChange={e => setFileName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFileUrl())} />
          <button onClick={addFileUrl} className="px-3 py-2 text-sm rounded-md bg-stone-100 hover:bg-stone-200 flex-shrink-0"><Plus className="w-4 h-4" /></button>
        </div>
        {files.length > 0 && (
          <div className="space-y-1.5">
            {files.map((f, i) => { const meta = getFileMeta(f); const FIcon = meta.icon; return (
              <div key={i} className="flex items-center gap-2 text-xs bg-stone-50 px-2 py-2 rounded-md border border-stone-100">
                <div className={`w-6 h-6 rounded flex items-center justify-center ${meta.color} flex-shrink-0`}><FIcon className="w-3.5 h-3.5" /></div>
                <span className="flex-1 truncate text-stone-700">{f.name}</span>
                <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-stone-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
              </div>
            );})}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-3 border-t border-stone-100">
        <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border border-stone-200 hover:bg-stone-50">Bekor</button>
        <button onClick={submit}  className="px-3 py-1.5 text-sm rounded-md bg-stone-900 text-white hover:bg-stone-800">Saqlash</button>
      </div>
    </Modal>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = "O'chirish", danger = true }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-stone-600 mb-4">{message}</p>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}  className="px-3 py-1.5 text-sm rounded-md border border-stone-200 hover:bg-stone-50">Bekor</button>
        <button onClick={onConfirm} className={`px-3 py-1.5 text-sm rounded-md text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-stone-900 hover:bg-stone-800'}`}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}
