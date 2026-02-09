import { useApp } from '../contexts/AppContext';
import { FileText, TrendingUp, Calculator } from 'lucide-react';
import {
    calculateTKP,
    calculateSR,
    calculateFCR,
    calculateAbsoluteWeight,
    getFormulaDisplay,
    interpretSR,
    interpretFCR
} from '../utils/calculations';
import { Line } from 'react-chartjs-2';

interface ReportsPageProps {
    selectedPondId: string | null;
}

export function ReportsPage({ selectedPondId }: ReportsPageProps) {
    const { state } = useApp();

    const pond = state.ponds.find(p => p.id === selectedPondId);
    if (!pond) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <div className="text-center text-zinc-500">
                    <p className="text-lg font-medium">Belum Ada Kolam</p>
                    <p className="text-sm mt-1">Silakan tambah kolam di Dashboard terlebih dahulu.</p>
                </div>
            </div>
        );
    }


    // Get all data for this pond
    const samplings = state.samplings.filter(s => s.pondId === selectedPondId).sort((a, b) => a.day - b.day);
    const feedLogs = state.feedLogs.filter(f => f.pondId === selectedPondId);
    const mortalities = state.mortalities.filter(m => m.pondId === selectedPondId);

    // Calculate metrics
    const W0 = pond.initialTotalWeight; // Total initial weight
    const N0 = pond.initialStock;
    const F = calculateTKP(feedLogs.map(f => f.feedGiven));

    // Get latest sampling data
    const latestSampling = samplings[samplings.length - 1];
    const Wt = latestSampling
        ? (latestSampling.sampleWeights.reduce((a, b) => a + b, 0) / latestSampling.sampleWeights.length) *
        (N0 - mortalities.reduce((sum, m) => sum + m.deadCount, 0))
        : W0;

    const Lt = latestSampling && latestSampling.sampleLengths && latestSampling.sampleLengths.length > 0
        ? latestSampling.sampleLengths.reduce((a, b) => a + b, 0) / latestSampling.sampleLengths.length
        : 0;

    const L0 = 0; // Initial length not tracked in setup

    const D = mortalities.reduce((sum, m) => sum + m.deadWeight, 0);
    const Nt = N0 - mortalities.reduce((sum, m) => sum + m.deadCount, 0);

    // Calculate days
    const startDate = new Date(pond.startDate);
    const today = new Date();
    const t = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get individual fish weights for calculations
    const W0_individual = W0 / N0;
    const Wt_individual = latestSampling
        ? latestSampling.sampleWeights.reduce((a, b) => a + b, 0) / latestSampling.sampleWeights.length
        : W0_individual;

    // Prepare formula displays
    const formulas = [
        getFormulaDisplay('TKP', { F }),
        getFormulaDisplay('SR', { N0, Nt }),
        getFormulaDisplay('FCR', { F, W0, Wt, D }),
        getFormulaDisplay('SGR', { W0: W0_individual, Wt: Wt_individual, t }),
        getFormulaDisplay('RGR', { W0: W0_individual, Wt: Wt_individual, t }),
        getFormulaDisplay('EPP', { W0, Wt, D, F }),
        getFormulaDisplay('AbsoluteWeight', { W0: W0_individual, Wt: Wt_individual }),
    ];

    if (Lt > 0 && L0 >= 0) {
        formulas.push(getFormulaDisplay('AbsoluteLength', { L0, Lt }));
    }

    // Prepare growth chart
    const initialWeight = W0 / N0;
    const growthChartData = {
        labels: ['Hari 0', ...samplings.map(s => `Hari ${s.day}`)],
        datasets: [
            {
                label: 'Bobot Rata-rata (g)',
                data: [
                    initialWeight,
                    ...samplings.map(s => s.sampleWeights.reduce((a, b) => a + b, 0) / s.sampleWeights.length)
                ],
                borderColor: 'rgb(20, 184, 166)',
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                tension: 0.3,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            x: {
                grid: { color: 'rgba(63, 63, 70, 0.3)' },
                ticks: { color: 'rgb(161, 161, 170)', font: { size: 10 } }
            },
            y: {
                grid: { color: 'rgba(63, 63, 70, 0.3)' },
                ticks: { color: 'rgb(161, 161, 170)', font: { size: 10 } }
            }
        }
    };

    const sr = calculateSR(N0, Nt);
    const fcr = calculateFCR(F, W0, Wt, D);

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-medium text-zinc-100 tracking-tight">Laporan & Evaluasi</h1>
                    <p className="text-sm text-zinc-400 mt-1">Hasil perhitungan dan analisis pemeliharaan</p>
                </div>
                <FileText className="w-8 h-8 text-aqua-400" />
            </div>





            {/* Key Metrics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-panel p-4 rounded-xl border border-zinc-800/50">
                    <p className="text-xs text-zinc-500 uppercase font-medium mb-2">Survival Rate (SR)</p>
                    <p className="text-2xl font-semibold text-zinc-100">
                        {sr.toFixed(2)}<span className="text-sm text-zinc-400">%</span>
                    </p>
                    <p className={`text-xs mt-1 ${interpretSR(sr).color}`}>{interpretSR(sr).status}</p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-800/50">
                    <p className="text-xs text-zinc-500 uppercase font-medium mb-2">FCR</p>
                    <p className="text-2xl font-semibold text-zinc-100">{fcr.toFixed(3)}</p>
                    <p className={`text-xs mt-1 ${interpretFCR(fcr).color}`}>{interpretFCR(fcr).status}</p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-800/50">
                    <p className="text-xs text-zinc-500 uppercase font-medium mb-2">Total Pakan (TKP)</p>
                    <p className="text-2xl font-semibold text-zinc-100">
                        {(F / 1000).toFixed(2)}<span className="text-sm text-zinc-400">kg</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">{feedLogs.length} kali pemberian</p>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-zinc-800/50">
                    <p className="text-xs text-zinc-500 uppercase font-medium mb-2">Bobot Mutlak</p>
                    <p className="text-2xl font-semibold text-zinc-100">
                        {calculateAbsoluteWeight(W0_individual, Wt_individual).toFixed(2)}
                        <span className="text-sm text-zinc-400">g</span>
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">Pertumbuhan per ekor</p>
                </div>
            </div>

            {/* Growth Chart */}
            {samplings.length > 0 && (
                <div className="glass-panel rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-medium text-zinc-200 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-aqua-400" />
                        Grafik Pertumbuhan Bobot
                    </h2>
                    <div style={{ height: '300px' }}>
                        <Line data={growthChartData} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* Formula Details */}
            <div className="glass-panel rounded-xl p-6 mb-6">
                <h2 className="text-lg font-medium text-zinc-200 mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-aqua-400" />
                    Detail Perhitungan
                </h2>
                <div className="space-y-4">
                    {formulas.map((formula, idx) => (
                        <div key={idx} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
                            <h3 className="text-sm font-semibold text-zinc-200 mb-2">{formula.name}</h3>
                            <div className="space-y-1 text-sm">
                                <p className="text-zinc-400">
                                    <span className="text-zinc-500">Rumus:</span> {formula.formula}
                                </p>
                                <p className="text-zinc-400">
                                    <span className="text-zinc-500">Perhitungan:</span> {formula.calculation}
                                </p>
                                <p className="text-aqua-400 font-semibold">
                                    <span className="text-zinc-500">Hasil:</span> {formula.result} {formula.unit}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Variable Explanation */}
            <div className="glass-panel rounded-xl p-6">
                <h2 className="text-lg font-medium text-zinc-200 mb-4">Keterangan Variabel</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex gap-2">
                        <span className="text-zinc-500 font-mono">W0:</span>
                        <span className="text-zinc-300">Bobot awal (gram)</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-zinc-500 font-mono">Wt:</span>
                        <span className="text-zinc-300">Bobot akhir (gram)</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-zinc-500 font-mono">N0:</span>
                        <span className="text-zinc-300">Jumlah ikan awal (ekor)</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-zinc-500 font-mono">Nt:</span>
                        <span className="text-zinc-300">Jumlah ikan akhir (ekor)</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-zinc-500 font-mono">F:</span>
                        <span className="text-zinc-300">Total konsumsi pakan (gram)</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-zinc-500 font-mono">D:</span>
                        <span className="text-zinc-300">Total bobot ikan mati (gram)</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-zinc-500 font-mono">t:</span>
                        <span className="text-zinc-300">Lama pemeliharaan (hari)</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-zinc-500 font-mono">L0:</span>
                        <span className="text-zinc-300">Panjang awal (cm)</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-zinc-500 font-mono">Lt:</span>
                        <span className="text-zinc-300">Panjang akhir (cm)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
