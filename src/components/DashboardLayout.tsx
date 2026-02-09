import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Sidebar } from './Sidebar';
import { AddPondModal } from './AddPondModal';

type DashboardContextType = {
    activePondId: string | null;
    onAddPond: () => void;
};

export function useDashboardContext() {
    return useOutletContext<DashboardContextType>();
}

export function DashboardLayout() {
    const { state } = useApp();
    const [activePondId, setActivePondId] = useState<string | null>(null);
    const [isAddPondModalOpen, setIsAddPondModalOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Auto-select pond logic
    useEffect(() => {
        if (state.ponds.length > 0) {
            if (!activePondId || !state.ponds.find(p => p.id === activePondId)) {
                setActivePondId(state.ponds[0].id);
            }
        } else {
            if (activePondId) setActivePondId(null);
        }
    }, [state.ponds, activePondId]);

    const handleAddPondClick = () => {
        setIsAddPondModalOpen(true);
    };

    // Determine current view name for header
    const getPageTitle = () => {
        const path = location.pathname.substring(1);
        if (path === 'dashboard') return 'Dashboard';
        if (path === 'feed') return 'Pemberian Pakan';
        if (path === 'samplings') return 'Sampling Mingguan';
        if (path === 'water') return 'Kualitas Air';
        if (path === 'reports') return 'Laporan & Evaluasi';
        if (path === 'settings') return 'Pengaturan';
        if (path === 'calculator') return 'Kalkulator';
        return path || 'Home';
    };

    return (
        <div className="h-screen flex overflow-hidden bg-zinc-950 text-zinc-400 font-sans antialiased">
            <Sidebar
                activePondId={activePondId}
                onPondChange={setActivePondId}
                onAddPond={handleAddPondClick}
            />

            <AddPondModal
                isOpen={isAddPondModalOpen}
                onClose={() => setIsAddPondModalOpen(false)}
            />

            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Top Gradient Glow */}
                <div className="absolute top-0 left-0 w-full h-96 bg-aqua-900/10 blur-[100px] pointer-events-none z-0"></div>

                {/* Header */}
                <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-800/40 z-10 shrink-0">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-zinc-500">AquaMetric / </span>
                        <span className="text-zinc-200 font-medium capitalize">{getPageTitle()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            Sistem Aktif
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-auto z-10">
                    <Outlet context={{ activePondId, onAddPond: handleAddPondClick }} />
                </div>
            </main>
        </div>
    );
}
