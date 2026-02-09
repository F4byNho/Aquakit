import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Home, FlaskConical, Droplets, FileText, Settings, ChevronDown, Plus, ArrowLeft } from 'lucide-react';

interface SidebarProps {
    activePondId: string | null;
    onPondChange: (pondId: string | null) => void;
    onAddPond: () => void;
    // Removed currentView and onViewChange
    currentView?: string; // Optional for compatibility if needed, but better to rely on router
    onViewChange?: (view: string) => void; // Optional
}

export function Sidebar({ activePondId, onPondChange, onAddPond }: SidebarProps) {
    const { state } = useApp();
    const [showPondSelector, setShowPondSelector] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const path = location.pathname.substring(1); // e.g., 'dashboard'

    const activePond = activePondId ? state.ponds.find(p => p.id === activePondId) : null;
    const hasPonds = state.ponds.length > 0;

    const isActive = (view: string) => path === view || (view === 'dashboard' && path === '');

    return (
        <aside className="w-64 flex flex-col border-r border-zinc-800/60 bg-zinc-950/50 pt-6 pb-4 h-full">
            <div className="px-5 mb-8 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-aqua-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                <span className="text-zinc-100 font-medium tracking-tight text-base">AquaMetric</span>
            </div>

            {/* Add Pond Button & Pond Selector */}
            <div className="px-4 mb-6 space-y-3">
                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </button>

                <button
                    onClick={onAddPond}
                    className="w-full bg-aqua-600 hover:bg-aqua-500 text-white border border-transparent rounded-lg px-3 py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Kolam
                </button>

                <div className="relative">
                    <button
                        onClick={() => hasPonds && setShowPondSelector(!showPondSelector)}
                        disabled={!hasPonds}
                        className={`w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${hasPonds ? 'text-zinc-200 hover:bg-zinc-800' : 'text-zinc-500 cursor-not-allowed opacity-70'}`}
                    >
                        <span>
                            {hasPonds
                                ? (activePond ? activePond.name : 'Pilih Kolam')
                                : 'Belum ada kolam'}
                        </span>
                        {hasPonds && <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showPondSelector && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden z-10 shadow-lg">
                            {state.ponds.map(pond => (
                                <button
                                    key={pond.id}
                                    onClick={() => { onPondChange(pond.id); setShowPondSelector(false); }}
                                    className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
                                >
                                    {pond.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${isActive('dashboard')
                        ? 'text-zinc-100 bg-zinc-900/80 shadow-sm border border-zinc-800/50'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                        }`}
                >
                    <Home className="w-4 h-4" />
                    Dashboard
                </button>

                <div className="pt-4 pb-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Data Logs
                </div>
                <button
                    onClick={() => navigate('/feed')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${isActive('feed')
                        ? 'text-zinc-100 bg-zinc-900/80 shadow-sm border border-zinc-800/50'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                        }`}
                >
                    <FlaskConical className="w-4 h-4" />
                    Pemberian Pakan
                </button>
                <button
                    onClick={() => navigate('/samplings')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${isActive('samplings')
                        ? 'text-zinc-100 bg-zinc-900/80 shadow-sm border border-zinc-800/50'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                        }`}
                >
                    <FlaskConical className="w-4 h-4" />
                    Sampling Mingguan
                </button>
                <button
                    onClick={() => navigate('/water')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${isActive('water')
                        ? 'text-zinc-100 bg-zinc-900/80 shadow-sm border border-zinc-800/50'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                        }`}
                >
                    <Droplets className="w-4 h-4" />
                    Kualitas Air
                </button>

                <div className="pt-4 pb-2 px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Reports
                </div>
                <button
                    onClick={() => navigate('/reports')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${isActive('reports')
                        ? 'text-zinc-100 bg-zinc-900/80 shadow-sm border border-zinc-800/50'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    Laporan & Evaluasi
                </button>
            </nav>

            <div className="mt-auto px-4">
                <button
                    onClick={() => navigate('/settings')}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${isActive('settings')
                        ? 'text-zinc-100 bg-zinc-900/80 shadow-sm border border-zinc-800/50'
                        : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                >
                    <Settings className="w-4 h-4" />
                    Pengaturan
                </button>
            </div>
        </aside>
    );
}
