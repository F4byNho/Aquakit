import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { DashboardLayout, useDashboardContext } from './components/DashboardLayout';
import { Dashboard } from './components/Dashboard';
import { WaterQualityPage } from './components/WaterQualityPage';
import { FeedLogPage } from './components/FeedLogPage';
import { SamplingPage } from './components/SamplingPage';
import { ReportsPage } from './components/ReportsPage';
import { LandingPage } from './components/LandingPage';
import { ScientificCalculator } from './components/ScientificCalculator';
import './index.css';

// Wrappers to pass context as props to existing components
const DashboardWrapper = () => {
    const { activePondId, onAddPond } = useDashboardContext();
    return <Dashboard selectedPondId={activePondId} onAddPond={onAddPond} />;
};

// Generic wrapper for pages that only need selectedPondId
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PageWrapper = ({ Component }: { Component: React.ComponentType<any> }) => {
    const { activePondId } = useDashboardContext();
    return <Component selectedPondId={activePondId} />;
};

const SettingsPage = () => {
    const { resetApp } = useApp();
    return (
        <div className="flex-1 overflow-y-auto p-8">
            <h1 className="text-2xl font-medium text-zinc-100 tracking-tight mb-6">Pengaturan</h1>
            <div className="glass-panel rounded-xl p-6">
                <button
                    onClick={() => {
                        if (window.confirm('Apakah anda yakin ingin menghapus semua data? Anda akan kembali ke halaman awal.')) {
                            resetApp();
                            window.location.href = '/'; // Force reload/redirect
                        }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                    Hapus Semua Data
                </button>
            </div>
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <AppProvider>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/calculator" element={<ScientificCalculator />} />

                    {/* Dashboard Routes with Layout */}
                    <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<DashboardWrapper />} />
                        <Route path="/feed" element={<PageWrapper Component={FeedLogPage} />} />
                        <Route path="/samplings" element={<PageWrapper Component={SamplingPage} />} />
                        <Route path="/water" element={<PageWrapper Component={WaterQualityPage} />} />
                        <Route path="/reports" element={<PageWrapper Component={ReportsPage} />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Route>

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AppProvider>
        </BrowserRouter>
    );
}

export default App;
