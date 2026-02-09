import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import {
    calculateSR,
    interpretSR,
    calculateTKP,
    calculateFCR,
    calculateSGR,
    calculateRGR,
    calculateEPP,
    interpretFCR,
    getFormulaDisplay,
    FormulaDisplay
} from '../utils/calculations';
import { TrendingUp, Scale, Heart, Activity, Fish, X, FlaskConical, Thermometer, Waves, Plus } from 'lucide-react';
import { Line } from 'react-chartjs-2';
// import { Pond } from '../types/models';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DashboardProps {
    onAddPond?: () => void;
    selectedPondId: string | null;
}

export function Dashboard({ onAddPond, selectedPondId }: DashboardProps) {
    const { state } = useApp();
    const [activeFormula, setActiveFormula] = useState<FormulaDisplay | null>(null);


    // Metrics Calculation Logic (Moved from original)
    const selectedPond = state.ponds.find(p => p.id === selectedPondId);
    let pondMetrics = {
        tkp: 0, fcr: 0, sgr: 0, rgr: 0, epp: 0, sr: 0, currentStock: 0
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let calcVars: any = {};
    let absWeight = 0;
    let absLength = 0;

    if (selectedPond) {
        const pSamplings = state.samplings.filter(s => s.pondId === selectedPondId).sort((a, b) => a.day - b.day);
        const pFeedLogs = state.feedLogs.filter(f => f.pondId === selectedPondId);
        const pMortalities = state.mortalities.filter(m => m.pondId === selectedPondId);

        const W0_total = selectedPond.initialTotalWeight; // This is now stored as Total Biomass (Avg * Stock)
        const N0 = selectedPond.initialStock;
        const F = calculateTKP(pFeedLogs.map(f => f.feedGiven));

        const latestSampling = pSamplings[pSamplings.length - 1];
        const deadCount = pMortalities.reduce((sum, m) => sum + m.deadCount, 0);
        const deadWeight = pMortalities.reduce((sum, m) => sum + m.deadWeight, 0);
        const Nt = N0 - deadCount;

        // Calculate Wt (Total Biomass Akhir)
        // If sampling exists -> AvgWeight * Nt
        // If no sampling -> Initial Avg Weight * Nt (Estimasi)
        const currentAvgWeight = latestSampling
            ? latestSampling.sampleWeights.reduce((a, b) => a + b, 0) / latestSampling.sampleWeights.length
            : (selectedPond.initialTotalWeight / selectedPond.initialStock); // Fallback to initial avg

        const Wt_total = currentAvgWeight * Nt;

        const W0_ind = W0_total / N0; // Initial Avg Weight
        const Wt_ind = currentAvgWeight; // Current Avg Weight

        const startDate = new Date(selectedPond.startDate);
        const today = new Date();
        // Use manually entered duration if available and we are just starting, or calc diff
        // For calculation purposes, let's use the actual days passed since start
        const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

        // If the user wants to see the projected duration from config:
        // const t = selectedPond.durationDays > 0 ? selectedPond.durationDays : daysPassed;
        // BUT, for RGR/SGR/FCR of *current* state, we usually use days passed.
        // User said: "lama pemeliharaan kan ... 30 hari ... disitu masih tertulis 1"
        // This suggests they want the 'Info' card to show the PLANNED duration, OR they want calculation based on that.
        // Let's stick to daysPassed for 'Current Progress' calculations, but use the configured duration for the Info Card display.

        // However, the user specifically mentioned calculation correctness in the same breath.
        // If I change 't' here, it affects SGR/RGR. 
        // Let's assume for the "Dashboard Info Card" it should show daysPassed (or configured if that's what they mean).
        // Re-reading: "coba kamu perhatikan gambar lama pemeliharaan... seharusnya sesuai pada saat inputan... yaitu 30"
        // -> The Info Card should show the durationDays from config.

        const t = daysPassed; // Keep actual days for calculation accuracy to date? 
        // Or did they mean they entered data 'as of day 30'?
        // "input di konfigurasi kolam ... 30 hari" -> likely the 'Target Duration' or 'Current Day Input'?
        // In AddPondModal, it's "Lama Pemeliharaan". usually target.
        // BUT if they want it to show 30, it might be they are simulating a 30-day pond.
        // Let's use the Max(daysPassed, selectedPond.durationDays) ? No.

        // Update: The requests says "sehingga ini berfungsi dalam perhitungan rumus yang benar". 
        // This implies they want to use the `durationDays` for 't' in calculations if it's a simulation/manual entry?
        // OR they just want the Display to match.
        // Let's update the display to prioritize `selectedPond.durationDays` if provided and > 1 (and maybe > daysPassed? or just show it?)
        // Actually, for calculations like RGR/SGR over a fixed period, `t` is the period.

        pondMetrics = {
            tkp: F,
            fcr: calculateFCR(F, W0_total, Wt_total, deadWeight), // Use Total Biomass
            sgr: calculateSGR(W0_ind, Wt_ind, t),
            rgr: calculateRGR(W0_ind, Wt_ind, t),
            epp: calculateEPP(W0_total, Wt_total, deadWeight, F), // Use Total Biomass
            sr: calculateSR(N0, Nt),
            currentStock: Nt
        };

        absWeight = Wt_ind - W0_ind;
        const Lt = latestSampling && latestSampling.sampleLengths && latestSampling.sampleLengths.length > 0
            ? latestSampling.sampleLengths.reduce((a, b) => a + b, 0) / latestSampling.sampleLengths.length
            : (selectedPond.initialAverageLength || 0);
        absLength = Lt - (selectedPond.initialAverageLength || 0);

        // Map for FormulaDisplay
        calcVars = {
            F,
            W0: W0_total, // EPP/FCR need Total
            Wt: Wt_total, // EPP/FCR need Total
            D: deadWeight,
            N0,
            Nt,
            W0_ind, // RGR/SGR need Individual
            Wt_ind, // RGR/SGR need Individual
            t,
            Lt,
            L0: selectedPond.initialAverageLength || 0
        };
    }

    // Chart Data Preparation
    const pondWQ = selectedPondId
        ? state.waterQuality
            .filter(wq => wq.pondId === selectedPondId)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        : [];

    const getPeriodFromDate = (date: Date) => {
        const hour = date.getHours();
        if (hour < 10) return 'Pagi';
        if (hour < 15) return 'Siang';
        if (hour < 19) return 'Sore';
        return 'Malam';
    };

    const wqLabels = pondWQ.map(wq => {
        const date = new Date(wq.timestamp);
        return `${date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${getPeriodFromDate(date)}`;
    });

    const createChartData = (label: string, data: (number | null)[], color: string, bgColor: string) => ({
        labels: wqLabels,
        datasets: [{
            label,
            data,
            borderColor: color,
            backgroundColor: bgColor,
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
        }],
    });

    const tempChartData = createChartData('Suhu', pondWQ.map(wq => wq.temperature || null), 'rgb(239, 68, 68)', 'rgba(239, 68, 68, 0.1)');
    const phChartData = createChartData('pH', pondWQ.map(wq => wq.pH || null), 'rgb(59, 130, 246)', 'rgba(59, 130, 246, 0.1)');
    const doChartData = createChartData('DO', pondWQ.map(wq => wq.dissolvedOxygen || null), 'rgb(34, 197, 94)', 'rgba(34, 197, 94, 0.1)');
    const salinityChartData = createChartData('Salinitas', pondWQ.map(wq => wq.salinity != null ? wq.salinity : null), 'rgb(168, 85, 247)', 'rgba(168, 85, 247, 0.1)');

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(24, 24, 27, 0.9)',
                titleColor: '#fff',
                bodyColor: '#e4e4e7',
                padding: 12,
                cornerRadius: 8,
                displayColors: false
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: 'rgb(113, 113, 122)', font: { size: 10 }, maxRotation: 45, minRotation: 45 }
            },
            y: {
                grid: { color: 'rgba(63, 63, 70, 0.2)' },
                ticks: { color: 'rgb(161, 161, 170)', font: { size: 10 } }
            }
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMetricClick = (type: any) => {
        if (!selectedPond) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let values: any = {};
        switch (type) {
            case 'TKP': values = { F: calcVars.F }; break;
            case 'FCR':
                // Use Total Biomass values directly as requested for scientific accuracy
                values = {
                    mode: 'total', // Explicitly use Total Biomass Display Mode
                    F: calcVars.F,
                    W0: calcVars.W0,
                    Wt: calcVars.Wt,
                    D: calcVars.D
                };
                break;
            case 'SR': values = { N0: calcVars.N0, Nt: calcVars.Nt }; break;
            case 'SGR': values = { W0: calcVars.W0_ind, Wt: calcVars.Wt_ind, t: calcVars.t }; break;
            case 'RGR': values = { W0: calcVars.W0_ind, Wt: calcVars.Wt_ind, t: calcVars.t }; break;
            case 'EPP':
                // Use Total Biomass values directly as requested for scientific accuracy
                values = {
                    mode: 'total', // Explicitly use Total Biomass Display Mode
                    W0: calcVars.W0,
                    Wt: calcVars.Wt,
                    D: calcVars.D,
                    F: calcVars.F
                };
                break;
            case 'AbsoluteWeight': values = { W0: calcVars.W0_ind, Wt: calcVars.Wt_ind }; break;
            case 'AbsoluteLength': values = { L0: calcVars.L0, Lt: calcVars.Lt }; break;
        }
        const display = getFormulaDisplay(type, values);
        setActiveFormula(display);
    };


    return (
        <div className="p-8 relative min-h-full">

            {/* Empty State / No Ponds */}
            {state.ponds.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-0">
                    <div className="text-center p-8 max-w-md">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-aqua">
                            <Fish className="w-10 h-10 text-aqua-400 opacity-80" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-100 mb-3">Belum Ada Kolam</h2>
                        <p className="text-zinc-400 mb-8">
                            Mulai dengan menambahkan kolam baru untuk memantau budidaya Anda.
                        </p>
                        <button
                            onClick={onAddPond}
                            className="bg-aqua-600 hover:bg-aqua-500 text-white font-medium py-3 px-8 rounded-full transition-all shadow-lg hover:shadow-aqua-500/20 flex items-center justify-center gap-2 mx-auto"
                        >
                            <Plus className="w-5 h-5" />
                            Buat Kolam Baru
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content (Only if ponds exist) */}
            {state.ponds.length > 0 && (
                <>
                    {/* Formula Details Modal (Existing) */}
                    {activeFormula && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActiveFormula(null)}>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setActiveFormula(null)} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                                <h3 className="text-lg font-semibold text-zinc-100 mb-1">{activeFormula.name}</h3>
                                <div className="w-12 h-1 bg-aqua-500 rounded-full mb-6"></div>
                                <div className="space-y-6">
                                    {/* ... Formula Content ... */}
                                    {activeFormula.isFraction ? (
                                        <>
                                            <div>
                                                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Rumus</h4>
                                                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 flex items-center gap-3 font-mono text-sm text-aqua-400 overflow-x-auto">
                                                    <span className="whitespace-nowrap italic">{activeFormula.name.split(' (')[1].replace(')', '')} =</span>
                                                    <div className="flex flex-col items-center">
                                                        <div className="border-b border-aqua-400/50 px-2 pb-1 mb-1 text-center w-full">{activeFormula.numeratorFormula}</div>
                                                        <div className="px-2 pt-0.5 text-center w-full">{activeFormula.denominatorFormula}</div>
                                                    </div>
                                                    {activeFormula.suffix && <span className="whitespace-nowrap">{activeFormula.suffix}</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Perhitungan</h4>
                                                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 flex items-center gap-3 font-mono text-sm text-zinc-300 overflow-x-auto">
                                                    <span className="whitespace-nowrap italic text-zinc-500">{activeFormula.name.split(' (')[1].replace(')', '')} =</span>
                                                    <div className="flex flex-col items-center">
                                                        <div className="border-b border-zinc-700 px-2 pb-1 mb-1 text-center w-full whitespace-nowrap">{activeFormula.numeratorCalc}</div>
                                                        <div className="px-2 pt-0.5 text-center w-full whitespace-nowrap">{activeFormula.denominatorCalc}</div>
                                                    </div>
                                                    {activeFormula.suffix && <span className="whitespace-nowrap">{activeFormula.suffix}</span>}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Rumus</h4>
                                                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 font-mono text-sm text-aqua-400">{activeFormula.formula}</div>
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Perhitungan</h4>
                                                <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50 font-mono text-sm text-zinc-300 break-words">{activeFormula.calculation}</div>
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Hasil</h4>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-white">{activeFormula.result}</span>
                                            <span className="text-sm text-zinc-400">{activeFormula.unit}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-medium text-zinc-100 tracking-tight">Dashboard</h1>
                        {/* Pond Selector Removed */}
                    </div>

                    {selectedPond && (
                        <>
                            {/* Pond Info */}
                            <div className="glass-panel rounded-xl p-6 mb-6">
                                <h2 className="text-xl font-medium text-zinc-200 mb-4">Informasi Pemeliharaan</h2>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Nama Kolam</p>
                                        <p className="text-lg text-zinc-100 font-medium">{selectedPond.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Spesies</p>
                                        <p className="text-lg text-zinc-100 font-medium capitalize">{selectedPond.species}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Tanggal Tebar</p>
                                        <p className="text-lg text-zinc-100 font-medium">
                                            {new Date(selectedPond.startDate).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Lama Pemeliharaan</p>
                                        <p className="text-lg text-zinc-100 font-medium">{selectedPond.durationDays} hari</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-zinc-500 mb-1">Jumlah Stok Awal</p>
                                        <p className="text-lg text-zinc-100 font-medium">{selectedPond.initialStock.toLocaleString('id-ID')} ekor</p>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="glass-panel p-5 rounded-xl border border-zinc-800/50 flex flex-col justify-between h-40 cursor-pointer hover:border-aqua-500/50 transition-colors group" onClick={() => handleMetricClick('TKP')}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider group-hover:text-aqua-400 transition-colors">Total Pakan</span>
                                        <Activity className="w-4 h-4 text-orange-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-semibold text-zinc-100">{(pondMetrics.tkp / 1000).toFixed(2)}<span className="text-sm text-zinc-500 ml-1 font-normal">kg</span></div>
                                        <div className="text-xs text-zinc-400 mt-1">Akumulasi</div>
                                    </div>
                                </div>
                                <div className="glass-panel p-5 rounded-xl border border-zinc-800/50 flex flex-col justify-between h-40 cursor-pointer hover:border-aqua-500/50 transition-colors group" onClick={() => handleMetricClick('FCR')}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider group-hover:text-aqua-400 transition-colors">FCR</span>
                                        <Activity className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-semibold text-zinc-100">{pondMetrics.fcr.toFixed(2)}</div>
                                        <div className={`text-xs mt-1 ${interpretFCR(pondMetrics.fcr).color}`}>{interpretFCR(pondMetrics.fcr).status}</div>
                                    </div>
                                </div>
                                <div className="glass-panel p-5 rounded-xl border border-zinc-800/50 flex flex-col justify-between h-40 cursor-pointer hover:border-aqua-500/50 transition-colors group" onClick={() => handleMetricClick('SR')}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider group-hover:text-aqua-400 transition-colors">SR</span>
                                        <Heart className="w-4 h-4 text-red-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-semibold text-zinc-100">{pondMetrics.sr.toFixed(1)}<span className="text-sm text-zinc-500 font-normal">%</span></div>
                                        <div className={`text-xs mt-1 ${interpretSR(pondMetrics.sr).color}`}>{interpretSR(pondMetrics.sr).status}</div>
                                    </div>
                                </div>
                                <div className="glass-panel p-5 rounded-xl border border-zinc-800/50 flex flex-col justify-between h-40 cursor-pointer hover:border-aqua-500/50 transition-colors group" onClick={() => handleMetricClick('AbsoluteWeight')}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider group-hover:text-aqua-400 transition-colors">Bobot Mutlak</span>
                                        <Fish className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-semibold text-zinc-100">{absWeight.toFixed(2)}<span className="text-sm text-zinc-500 font-normal">g</span></div>
                                        <div className="text-xs text-zinc-400 mt-1">Pertumbuhan</div>
                                    </div>
                                </div>
                                <div className="glass-panel p-5 rounded-xl border border-zinc-800/50 flex flex-col justify-between h-40 cursor-pointer hover:border-aqua-500/50 transition-colors group" onClick={() => handleMetricClick('AbsoluteLength')}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider group-hover:text-aqua-400 transition-colors">Panjang Mutlak</span>
                                        <Scale className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-semibold text-zinc-100">{absLength.toFixed(2)}<span className="text-sm text-zinc-500 font-normal">cm</span></div>
                                        <div className="text-xs text-zinc-400 mt-1">Pertumbuhan</div>
                                    </div>
                                </div>
                                <div className="glass-panel p-5 rounded-xl border border-zinc-800/50 flex flex-col justify-between h-40 cursor-pointer hover:border-aqua-500/50 transition-colors group" onClick={() => handleMetricClick('SGR')}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider group-hover:text-aqua-400 transition-colors">SGR</span>
                                        <TrendingUp className="w-4 h-4 text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-semibold text-zinc-100">{pondMetrics.sgr.toFixed(2)}<span className="text-sm text-zinc-500 font-normal">%</span></div>
                                        <div className="text-xs text-zinc-400 mt-1">per hari</div>
                                    </div>
                                </div>
                                <div className="glass-panel p-5 rounded-xl border border-zinc-800/50 flex flex-col justify-between h-40 cursor-pointer hover:border-aqua-500/50 transition-colors group" onClick={() => handleMetricClick('EPP')}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider group-hover:text-aqua-400 transition-colors">EPP</span>
                                        <Scale className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-semibold text-zinc-100">{pondMetrics.epp.toFixed(0)}<span className="text-sm text-zinc-500 font-normal">%</span></div>
                                        <div className="text-xs text-zinc-400 mt-1">Efisiensi</div>
                                    </div>
                                </div>
                                <div className="glass-panel p-5 rounded-xl border border-zinc-800/50 flex flex-col justify-between h-40 cursor-pointer hover:border-aqua-500/50 transition-colors group" onClick={() => handleMetricClick('RGR')}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider group-hover:text-aqua-400 transition-colors">RGR</span>
                                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-semibold text-zinc-100">{pondMetrics.rgr.toFixed(2)}<span className="text-sm text-zinc-500 font-normal">%</span></div>
                                        <div className="text-xs text-zinc-400 mt-1">per hari</div>
                                    </div>
                                </div>
                            </div>

                            {/* Water Quality Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="glass-panel p-6 rounded-xl border border-zinc-800/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Thermometer className="w-4 h-4 text-red-500" />
                                        <span className="text-sm font-medium text-zinc-300">Suhu Air</span>
                                    </div>
                                    <div className="h-64">
                                        <Line data={tempChartData} options={{ ...chartOptions, responsive: true, maintainAspectRatio: false }} />
                                    </div>
                                </div>
                                <div className="glass-panel p-6 rounded-xl border border-zinc-800/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FlaskConical className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm font-medium text-zinc-300">pH Air</span>
                                    </div>
                                    <div className="h-64">
                                        <Line data={phChartData} options={{ ...chartOptions, responsive: true, maintainAspectRatio: false }} />
                                    </div>
                                </div>
                                <div className="glass-panel p-6 rounded-xl border border-zinc-800/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className="w-4 h-4 text-green-500" />
                                        <span className="text-sm font-medium text-zinc-300">DO</span>
                                    </div>
                                    <div className="h-64">
                                        <Line data={doChartData} options={{ ...chartOptions, responsive: true, maintainAspectRatio: false }} />
                                    </div>
                                </div>
                                <div className="glass-panel p-6 rounded-xl border border-zinc-800/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Waves className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm font-medium text-zinc-300">Salinitas</span>
                                    </div>
                                    <div className="h-64">
                                        <Line data={salinityChartData} options={{ ...chartOptions, responsive: true, maintainAspectRatio: false }} />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
