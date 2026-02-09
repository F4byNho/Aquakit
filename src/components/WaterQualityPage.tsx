import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Droplets, Plus, Thermometer, Activity, Waves, Edit2, Trash2, X, Check, FlaskConical } from 'lucide-react';
import { WaterQuality } from '../types/models';
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

interface WaterQualityPageProps {
    selectedPondId: string | null;
}

export function WaterQualityPage({ selectedPondId }: WaterQualityPageProps) {
    const { state, addWaterQuality, updateWaterQuality, deleteWaterQuality } = useApp();

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


    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: 'Pagi',
        ph: '',
        do: '',
        salinity: '',
        temperature: ''
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<{ ph: string, do: string, salinity: string, temperature: string }>({
        ph: '', do: '', salinity: '', temperature: ''
    });

    // Helper: Period/Time handling
    const periodToTime: Record<string, string> = {
        'Pagi': '07:00',
        'Siang': '12:00',
        'Sore': '17:00',
        'Malam': '21:00'
    };

    const getPeriodFromTime = (timeStr: string) => {
        if (!timeStr) return 'Pagi';
        if (['Pagi', 'Siang', 'Sore', 'Malam'].includes(timeStr)) return timeStr;
        const hour = parseInt(timeStr.split(':')[0]);
        if (isNaN(hour)) return 'Pagi';
        if (hour < 10) return 'Pagi';
        if (hour < 15) return 'Siang';
        if (hour < 19) return 'Sore';
        return 'Malam';
    };

    // Filter Logs
    const pondLogs = selectedPondId
        ? state.waterQuality
            .filter(log => log.pondId === selectedPondId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        : [];

    // Check available time slots for selected date
    const getAvailableTimeSlots = () => {
        const logsForDate = pondLogs.filter(log => log.timestamp.startsWith(formData.date));
        const usedPeriods = logsForDate.map(log => {
            const timePart = log.timestamp.includes('T') ? log.timestamp.split('T')[1] : '';
            return getPeriodFromTime(timePart.substring(0, 5));
        });
        return {
            'Pagi': !usedPeriods.includes('Pagi'),
            'Siang': !usedPeriods.includes('Siang'),
            'Sore': !usedPeriods.includes('Sore'),
            'Malam': !usedPeriods.includes('Malam')
        };
    };

    const timeSlots = getAvailableTimeSlots();

    // Charts Data Preparation
    const reversedLogs = [...pondLogs].reverse(); // Oldest to newest for charts
    const chartLabels = reversedLogs.map(log => {
        if (!log.timestamp) return '-';
        const date = new Date(log.timestamp);
        const timePart = log.timestamp.includes('T') ? log.timestamp.split('T')[1] : '';
        return `${date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${getPeriodFromTime(timePart?.substring(0, 5) || '')}`;
    });

    const createChartData = (label: string, data: (number | null | undefined)[], color: string, bgColor: string) => ({
        labels: chartLabels,
        datasets: [{
            label,
            data,
            borderColor: color,
            backgroundColor: bgColor,
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
        }]
    });

    const phData = createChartData('pH', reversedLogs.map(l => l.pH), 'rgb(59, 130, 246)', 'rgba(59, 130, 246, 0.1)');
    const doData = createChartData('DO (ppm)', reversedLogs.map(l => l.dissolvedOxygen), 'rgb(34, 197, 94)', 'rgba(34, 197, 94, 0.1)');
    const salinityData = createChartData('Salinitas (ppt)', reversedLogs.map(l => l.salinity), 'rgb(168, 85, 247)', 'rgba(168, 85, 247, 0.1)');
    const tempData = createChartData('Suhu (°C)', reversedLogs.map(l => l.temperature), 'rgb(239, 68, 68)', 'rgba(239, 68, 68, 0.1)');

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPondId) return;

        // Double check availability
        const currentPeriod = formData.time;
        if (!timeSlots[currentPeriod as keyof typeof timeSlots]) {
            alert(`Data kualitas air untuk waktu ${currentPeriod} pada tanggal ini sudah ada.`);
            return;
        }

        let timeStr = periodToTime[formData.time] || '07:00';
        const timestamp = `${formData.date}T${timeStr}:00`;

        const log: WaterQuality = {
            id: `wq-${Date.now()}`,
            pondId: selectedPondId,
            timestamp,
            pH: parseFloat(formData.ph),
            dissolvedOxygen: parseFloat(formData.do),
            temperature: parseFloat(formData.temperature),
            salinity: formData.salinity ? parseFloat(formData.salinity) : undefined,
            notes: ''
        };

        addWaterQuality(log);

        setFormData({
            ...formData,
            ph: '',
            do: '',
            salinity: '',
            temperature: ''
        });
    };

    const handleEdit = (log: WaterQuality) => {
        setEditingId(log.id);
        setEditValues({
            ph: log.pH.toString(),
            do: log.dissolvedOxygen.toString(),
            salinity: log.salinity != null ? log.salinity.toString() : '',
            temperature: log.temperature.toString()
        });
    };

    const handleSaveEdit = (id: string) => {
        updateWaterQuality(id, {
            pH: parseFloat(editValues.ph),
            dissolvedOxygen: parseFloat(editValues.do),
            salinity: editValues.salinity ? parseFloat(editValues.salinity) : undefined,
            temperature: parseFloat(editValues.temperature)
        });
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Hapus data ini?')) {
            deleteWaterQuality(id);
        }
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-medium text-zinc-100 tracking-tight">Kualitas Air</h1>
                    <p className="text-sm text-zinc-400 mt-1">Monitoring parameter air harian</p>
                </div>
                <Droplets className="w-8 h-8 text-aqua-400" />
            </div>



            {/* Input Form */}
            <div className="glass-panel rounded-xl p-6 mb-6">
                <h2 className="text-lg font-medium text-zinc-200 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-aqua-400" />
                    Input Kualitas Air
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-xs text-zinc-500 mb-1">Tanggal</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs text-zinc-500 mb-1">Waktu</label>
                        <select
                            value={formData.time}
                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                        >
                            <option value="Pagi" disabled={!timeSlots['Pagi']}>Pagi {!timeSlots['Pagi'] ? '(Sudah Diisi)' : ''}</option>
                            <option value="Siang" disabled={!timeSlots['Siang']}>Siang {!timeSlots['Siang'] ? '(Sudah Diisi)' : ''}</option>
                            <option value="Sore" disabled={!timeSlots['Sore']}>Sore {!timeSlots['Sore'] ? '(Sudah Diisi)' : ''}</option>
                            <option value="Malam" disabled={!timeSlots['Malam']}>Malam {!timeSlots['Malam'] ? '(Sudah Diisi)' : ''}</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs text-zinc-500 mb-1">pH</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formData.ph}
                            onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            placeholder="7.5"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs text-zinc-500 mb-1">DO (ppm)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formData.do}
                            onChange={(e) => setFormData({ ...formData, do: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            placeholder="6.0"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs text-zinc-500 mb-1">Suhu (°C)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formData.temperature}
                            onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            placeholder="28.5"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs text-zinc-500 mb-1">Salinitas (ppt)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formData.salinity}
                            onChange={(e) => setFormData({ ...formData, salinity: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            placeholder="15 (Opsional)"
                        />
                    </div>
                    <div className="md:col-span-6">
                        <button
                            type="submit"
                            className="w-full bg-aqua-600 hover:bg-aqua-500 text-white font-medium py-2 rounded-lg transition-colors"
                        >
                            Simpan Data
                        </button>
                    </div>
                </form>
            </div>

            {/* Trends Section */}
            {pondLogs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* pH Chart */}
                    <div className="glass-panel rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <FlaskConical className="w-4 h-4 text-blue-500" />
                                pH
                            </h3>
                        </div>
                        <div className="h-48">
                            <Line data={phData} options={chartOptions} />
                        </div>
                    </div>

                    {/* DO Chart */}
                    <div className="glass-panel rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-500" />
                                DO (Dissolved Oxygen)
                            </h3>
                        </div>
                        <div className="h-48">
                            <Line data={doData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Temperature Chart */}
                    <div className="glass-panel rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Thermometer className="w-4 h-4 text-red-500" />
                                Suhu
                            </h3>
                        </div>
                        <div className="h-48">
                            <Line data={tempData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Salinity Chart */}
                    <div className="glass-panel rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                                <Waves className="w-4 h-4 text-purple-500" />
                                Salinitas
                            </h3>
                        </div>
                        <div className="h-48">
                            <Line data={salinityData} options={chartOptions} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-panel rounded-xl p-8 mb-8 text-center border-dashed border-2 border-zinc-800">
                    <p className="text-zinc-500">Belum ada data visualisasi. Input data kualitas air untuk melihat tren.</p>
                </div>
            )}



            {/* Data Table */}
            <div className="glass-panel rounded-xl p-6">
                <h2 className="text-lg font-medium text-zinc-200 mb-4">Riwayat Pengukuran</h2>
                {pondLogs.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Belum ada data kualitas air.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Tanggal</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Waktu</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">pH</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">DO</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Suhu</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Salinitas</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium w-32">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pondLogs.map((log) => (
                                    <tr key={log.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                                        <td className="py-3 px-4 text-zinc-300 text-center">
                                            {new Date(log.timestamp).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="py-3 px-4 text-zinc-300 text-center">
                                            {getPeriodFromTime(log.timestamp ? (log.timestamp.includes('T') ? log.timestamp.split('T')[1]?.substring(0, 5) : '') : '')}
                                        </td>

                                        {/* Editable Columns */}
                                        <td className="py-3 px-4 text-center">
                                            {editingId === log.id ? (
                                                <input
                                                    type="number"
                                                    value={editValues.ph}
                                                    onChange={(e) => setEditValues({ ...editValues, ph: e.target.value })}
                                                    className="w-16 bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-center text-xs"
                                                />
                                            ) : (
                                                <span className="text-zinc-200">{log.pH}</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {editingId === log.id ? (
                                                <input
                                                    type="number"
                                                    value={editValues.do}
                                                    onChange={(e) => setEditValues({ ...editValues, do: e.target.value })}
                                                    className="w-16 bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-center text-xs"
                                                />
                                            ) : (
                                                <span className="text-zinc-200">{log.dissolvedOxygen}</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {editingId === log.id ? (
                                                <input
                                                    type="number"
                                                    value={editValues.temperature}
                                                    onChange={(e) => setEditValues({ ...editValues, temperature: e.target.value })}
                                                    className="w-16 bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-center text-xs"
                                                />
                                            ) : (
                                                <span className="text-zinc-200">{log.temperature}</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {editingId === log.id ? (
                                                <input
                                                    type="number"
                                                    value={editValues.salinity}
                                                    onChange={(e) => setEditValues({ ...editValues, salinity: e.target.value })}
                                                    className="w-16 bg-zinc-800 border border-zinc-600 rounded px-1 py-1 text-center text-xs"
                                                />
                                            ) : (
                                                <span className="text-zinc-200">{log.salinity ?? '-'}</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3 px-4 text-center">
                                            {editingId === log.id ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleSaveEdit(log.id)} className="text-green-500 hover:text-green-400"><Check size={16} /></button>
                                                    <button onClick={() => setEditingId(null)} className="text-zinc-500 hover:text-zinc-400"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEdit(log)} className="p-1 text-zinc-500 hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDelete(log.id)} className="p-1 text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
