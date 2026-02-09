import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Sampling, Mortality } from '../types/models';
import { FlaskConical, Plus, TrendingUp, Edit2, Trash2, X, Check } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface SamplingPageProps {
    selectedPondId: string | null;
}

export function SamplingPage({ selectedPondId }: SamplingPageProps) {
    const { state, addSampling, addMortality, updateSampling, deleteSampling } = useApp();

    if (state.ponds.length === 0) {
        return (
            <div className="p-8 flex items-center justify-center h-full">
                <div className="text-center text-zinc-500">
                    <p className="text-lg font-medium">Belum Ada Kolam</p>
                    <p className="text-sm mt-1">Silakan tambah kolam di Dashboard terlebih dahulu.</p>
                </div>
            </div>
        );
    }



    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState({
        sampledCount: '',
        avgWeight: '',
        avgLength: ''
    });

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        sampledCount: '10',
        averageWeight: '',
        averageLength: '',
        deadCount: '0',
        deadWeight: '0'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPondId || !formData.averageWeight) return;

        const pond = state.ponds.find(p => p.id === selectedPondId);
        if (!pond) return;

        // Calculate day number
        const startDate = new Date(pond.startDate);
        const samplingDate = new Date(formData.date);
        const dayNumber = Math.floor((samplingDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Validation: Max 1 sampling per day
        const existingSampling = state.samplings.find(s =>
            s.pondId === selectedPondId && s.date === formData.date
        );

        if (existingSampling) {
            alert('Data sampling untuk tanggal ini sudah ada. Silakan edit data yang sudah ada jika ingin mengubahnya.');
            return;
        }

        // Create sampling record
        const avgWeight = parseFloat(formData.averageWeight);
        const sampledCount = parseInt(formData.sampledCount);
        const sampling: Sampling = {
            id: `sampling-${Date.now()}`,
            pondId: selectedPondId,
            day: dayNumber,
            date: formData.date,
            sampledCount: sampledCount,
            sampleWeights: [avgWeight], // Store as single average
            sampleLengths: formData.averageLength ? [parseFloat(formData.averageLength)] : undefined,
        };

        addSampling(sampling);

        // Add mortality if any
        const deadCount = parseInt(formData.deadCount);
        if (deadCount > 0) {
            const mortality: Mortality = {
                pondId: selectedPondId,
                date: formData.date,
                deadCount: deadCount,
                deadWeight: parseFloat(formData.deadWeight) || 0,
            };
            addMortality(mortality);
        }

        // Reset form
        setFormData({
            date: new Date().toISOString().split('T')[0],
            sampledCount: '10',
            averageWeight: '',
            averageLength: '',
            deadCount: '0',
            deadWeight: '0'
        });
    };

    const pondSamplings = selectedPondId
        ? state.samplings
            .filter(s => s.pondId === selectedPondId)
            .sort((a, b) => a.day - b.day)
        : [];

    const selectedPond = state.ponds.find(p => p.id === selectedPondId);
    const initialWeight = selectedPond ? selectedPond.initialTotalWeight / selectedPond.initialStock : 0;

    // Prepare chart data
    const chartData = {
        labels: ['Hari 0', ...pondSamplings.map(s => `Hari ${s.day}`)],
        datasets: [
            {
                label: 'Bobot Rata-rata (g)',
                data: [
                    initialWeight,
                    ...pondSamplings.map(s => {
                        const avgWeight = s.sampleWeights.reduce((a, b) => a + b, 0) / s.sampleWeights.length;
                        return avgWeight;
                    })
                ],
                borderColor: 'rgb(20, 184, 166)',
                backgroundColor: 'rgba(20, 184, 166, 0.1)',
                tension: 0.3,
                fill: true,
            },
        ],
    };

    const lengthChartData = {
        labels: pondSamplings.filter(s => s.sampleLengths && s.sampleLengths.length > 0).map(s => `Hari ${s.day}`),
        datasets: [
            {
                label: 'Panjang Rata-rata (cm)',
                data: pondSamplings
                    .filter(s => s.sampleLengths && s.sampleLengths.length > 0)
                    .map(s => {
                        const avgLength = s.sampleLengths!.reduce((a, b) => a + b, 0) / s.sampleLengths!.length;
                        return avgLength;
                    }),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
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

    const handleEdit = (sampling: Sampling) => {
        setEditingId(sampling.id);
        const avgWeight = sampling.sampleWeights.reduce((a, b) => a + b, 0) / sampling.sampleWeights.length;
        const avgLength = sampling.sampleLengths && sampling.sampleLengths.length > 0
            ? sampling.sampleLengths.reduce((a, b) => a + b, 0) / sampling.sampleLengths.length
            : null;

        setEditValues({
            sampledCount: sampling.sampledCount.toString(),
            avgWeight: avgWeight.toString(),
            avgLength: avgLength ? avgLength.toString() : ''
        });
    };

    const handleSaveEdit = (id: string) => {
        const count = parseInt(editValues.sampledCount);
        const weight = parseFloat(editValues.avgWeight);
        const length = parseFloat(editValues.avgLength);

        if (count > 0 && weight > 0) {
            updateSampling(id, {
                sampledCount: count,
                sampleWeights: [weight],
                sampleLengths: !isNaN(length) ? [length] : undefined
            });
        }
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus data sampling ini?')) {
            deleteSampling(id);
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-medium text-zinc-100 tracking-tight">Sampling Mingguan</h1>
                    <p className="text-sm text-zinc-400 mt-1">Data sampling pertumbuhan ikan</p>
                </div>
                <FlaskConical className="w-8 h-8 text-aqua-400" />
            </div>



            {/* Input Form */}
            <div className="glass-panel rounded-xl p-6 mb-6">
                <h2 className="text-lg font-medium text-zinc-200 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-aqua-400" />
                    Input Data Sampling
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Tanggal Sampling</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Jumlah Ikan yang Disampling</label>
                            <input
                                type="number"
                                value={formData.sampledCount}
                                onChange={(e) => setFormData({ ...formData, sampledCount: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Bobot Rata-rata (gram)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.averageWeight}
                                onChange={(e) => setFormData({ ...formData, averageWeight: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                                placeholder="25.5"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Panjang Rata-rata (cm) - Opsional</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.averageLength}
                                onChange={(e) => setFormData({ ...formData, averageLength: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                                placeholder="12.5"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Jumlah Ikan Mati (sejak sampling terakhir)</label>
                            <input
                                type="number"
                                value={formData.deadCount}
                                onChange={(e) => setFormData({ ...formData, deadCount: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-zinc-500 mb-1">Total Bobot Ikan Mati (gram)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.deadWeight}
                                onChange={(e) => setFormData({ ...formData, deadWeight: e.target.value })}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-aqua-600 hover:bg-aqua-500 text-white font-medium py-2 rounded-lg transition-colors"
                    >
                        Simpan Data Sampling
                    </button>
                </form>
            </div>

            {/* Growth Charts */}
            {pondSamplings.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="glass-panel rounded-xl p-6">
                        <h2 className="text-lg font-medium text-zinc-200 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-aqua-400" />
                            Pertumbuhan Bobot
                        </h2>
                        <div style={{ height: '250px' }}>
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    {lengthChartData.labels.length > 0 && (
                        <div className="glass-panel rounded-xl p-6">
                            <h2 className="text-lg font-medium text-zinc-200 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                Pertumbuhan Panjang
                            </h2>
                            <div style={{ height: '250px' }}>
                                <Line data={lengthChartData} options={chartOptions} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Data Table */}
            <div className="glass-panel rounded-xl p-6">
                <h2 className="text-lg font-medium text-zinc-200 mb-4">Riwayat Sampling</h2>
                {pondSamplings.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Belum ada data sampling untuk kolam ini.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Sampling ke-</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Tanggal</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Jumlah Sampel</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Bobot (g)</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Panjang (cm)</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Ikan Mati (ekor)</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Bobot Mati (g)</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pondSamplings.map((sampling, idx) => {
                                    const avgWeight = sampling.sampleWeights.reduce((a, b) => a + b, 0) / sampling.sampleWeights.length;
                                    const avgLength = sampling.sampleLengths
                                        ? sampling.sampleLengths.reduce((a, b) => a + b, 0) / sampling.sampleLengths.length
                                        : null;

                                    // Find associated mortality for this date
                                    const mortality: Mortality | undefined = state.mortalities?.find(m => m.pondId === selectedPondId && m.date === sampling.date);

                                    return (
                                        <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                                            <td className="py-3 px-4 text-zinc-300 font-medium text-center">
                                                {idx + 1}
                                            </td>
                                            <td className="py-3 px-4 text-zinc-300 text-center">
                                                {new Date(sampling.date).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="py-3 px-4 text-zinc-300 text-center">
                                                {editingId === sampling.id ? (
                                                    <input
                                                        type="number"
                                                        value={editValues.sampledCount}
                                                        onChange={(e) => setEditValues({ ...editValues, sampledCount: e.target.value })}
                                                        className="w-16 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-center text-xs mx-auto block"
                                                    />
                                                ) : (
                                                    sampling.sampledCount
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-zinc-300 text-center font-medium">
                                                {editingId === sampling.id ? (
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editValues.avgWeight}
                                                        onChange={(e) => setEditValues({ ...editValues, avgWeight: e.target.value })}
                                                        className="w-20 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-center text-xs mx-auto block"
                                                    />
                                                ) : (
                                                    avgWeight.toFixed(2)
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-zinc-300 text-center">
                                                {editingId === sampling.id ? (
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={editValues.avgLength}
                                                        onChange={(e) => setEditValues({ ...editValues, avgLength: e.target.value })}
                                                        className="w-20 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-center text-xs mx-auto block"
                                                        placeholder="Opsional"
                                                    />
                                                ) : (
                                                    avgLength ? avgLength.toFixed(1) : '-'
                                                )}
                                            </td>
                                            {/* Mortality Data (Read-only for now) */}
                                            <td className="py-3 px-4 text-zinc-400 text-center text-sm">
                                                {mortality ? mortality.deadCount : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-zinc-400 text-center text-sm">
                                                {mortality ? mortality.deadWeight.toFixed(2) : '-'}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {editingId === sampling.id ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleSaveEdit(sampling.id)}
                                                            className="text-green-500 hover:text-green-400"
                                                            title="Simpan"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="text-zinc-500 hover:text-zinc-400"
                                                            title="Batal"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(sampling)}
                                                            className="p-1 text-zinc-500 hover:text-blue-400 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(sampling.id)}
                                                            className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                                            title="Hapus"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
