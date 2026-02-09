import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { FeedLog } from '../types/models';
import { Utensils, Plus, TrendingUp, Edit2, Trash2, X, Check } from 'lucide-react';
import { calculateTKP } from '../utils/calculations';

interface FeedLogPageProps {
    selectedPondId: string | null;
}

export function FeedLogPage({ selectedPondId }: FeedLogPageProps) {
    const { state, addFeedLog, updateFeedLog, deleteFeedLog } = useApp();

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        time: 'Pagi',
        feedType: 'Pelet',
        feedGiven: ''
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    const periodToTime: Record<string, string> = {
        'Pagi': '07:00',
        'Siang': '12:00',
        'Sore': '17:00',
        'Malam': '21:00'
    };

    const getPeriodFromTime = (timeStr: string) => {
        if (!timeStr) return 'Pagi';
        // Handle if time is already stored as period (legacy/migration safety)
        if (['Pagi', 'Siang', 'Sore', 'Malam'].includes(timeStr)) return timeStr;

        if (!timeStr.includes(':')) return 'Pagi';

        const hour = parseInt(timeStr.split(':')[0]);
        if (isNaN(hour)) return 'Pagi';

        if (hour < 10) return 'Pagi';
        if (hour < 15) return 'Siang';
        if (hour < 19) return 'Sore';
        return 'Malam';
    };

    const getKeyFromLog = (log: FeedLog) => {
        let timeStr = log.time;
        // Normalize time if it's stored as period name
        if (timeStr === 'Pagi') timeStr = '07:00';
        else if (timeStr === 'Siang') timeStr = '12:00';
        else if (timeStr === 'Sore') timeStr = '17:00';
        else if (timeStr === 'Malam') timeStr = '21:00';
        // Fallback for invalid time
        else if (!timeStr || !timeStr.includes(':')) timeStr = '00:00';

        return new Date(`${log.date}T${timeStr}`).getTime();
    };

    const pondLogs = selectedPondId
        ? state.feedLogs
            .filter(log => log.pondId === selectedPondId)
            .sort((a, b) => getKeyFromLog(b) - getKeyFromLog(a))
        : [];

    // Check available time slots for selected date
    const getAvailableTimeSlots = () => {
        const logsForDate = pondLogs.filter(log => log.date === formData.date);
        const usedPeriods = logsForDate.map(log => getPeriodFromTime(log.time));
        return {
            'Pagi': !usedPeriods.includes('Pagi'),
            'Siang': !usedPeriods.includes('Siang'),
            'Sore': !usedPeriods.includes('Sore'),
            'Malam': !usedPeriods.includes('Malam')
        };
    };

    const timeSlots = getAvailableTimeSlots();

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


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPondId || !formData.feedGiven) return;

        // Double check availability
        const currentPeriod = formData.time;
        if (!timeSlots[currentPeriod as keyof typeof timeSlots]) {
            alert(`Data pakan untuk waktu ${currentPeriod} pada tanggal ini sudah ada.`);
            return;
        }

        const log: FeedLog = {
            id: `feed-${Date.now()}`,
            pondId: selectedPondId,
            date: formData.date,
            time: periodToTime[formData.time],
            feedType: formData.feedType,
            feedGiven: parseFloat(formData.feedGiven),
        };

        addFeedLog(log);

        // Reset only feedGiven, keep date and time
        setFormData({
            ...formData,
            feedGiven: ''
        });
    };

    const handleEdit = (log: FeedLog) => {
        setEditingId(log.id);
        setEditValue(log.feedGiven.toString());
    };

    const handleSaveEdit = (id: string) => {
        const val = parseFloat(editValue);
        if (val > 0) {
            updateFeedLog(id, { feedGiven: val });
        }
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            deleteFeedLog(id);
        }
    };

    // Calculate TKP
    const tkp = calculateTKP(pondLogs.map(log => log.feedGiven));

    // Calculate Weekly Summary
    const getWeeklySummary = () => {
        const pond = state.ponds.find(p => p.id === selectedPondId);
        if (!pond) return [];

        const startDate = new Date(pond.startDate);
        const weeklyData: Record<number, number> = {};

        pondLogs.forEach(log => {
            const logDate = new Date(log.date);
            const diffTime = Math.abs(logDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const weekNum = Math.floor(diffDays / 7) + 1;

            weeklyData[weekNum] = (weeklyData[weekNum] || 0) + log.feedGiven;
        });

        return Object.entries(weeklyData)
            .sort(([a], [b]) => Number(a) - Number(b)); // Sort by week number ascending
    };

    const weeklySummary = getWeeklySummary();

    // Calculate Daily Summary
    const dailySummary: Record<string, { total: number; periods: Set<string>; count: number; types: Set<string> }> = {};
    pondLogs.forEach(log => {
        if (!dailySummary[log.date]) {
            dailySummary[log.date] = { total: 0, periods: new Set(), count: 0, types: new Set() };
        }
        dailySummary[log.date].total += log.feedGiven;
        dailySummary[log.date].periods.add(getPeriodFromTime(log.time));
        dailySummary[log.date].count += 1;
        dailySummary[log.date].types.add(log.feedType);
    });

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-medium text-zinc-100 tracking-tight">Pemberian Pakan</h1>
                    <p className="text-sm text-zinc-400 mt-1">Logbook pemberian pakan harian</p>
                </div>
                <Utensils className="w-8 h-8 text-aqua-400" />
            </div>



            {/* TKP Summary */}
            <div className="glass-panel rounded-xl p-6 mb-6 border-l-4 border-aqua-500">
                <div className="flex items-start justify-between">
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase font-medium mb-1">Total Konsumsi Pakan (TKP)</p>
                                <p className="text-3xl font-semibold text-zinc-100">
                                    {tkp.toFixed(2)} <span className="text-lg text-zinc-400">gram</span>
                                </p>
                                <p className="text-xs text-zinc-500 mt-1">{pondLogs.length} kali pemberian pakan</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-aqua-400 opacity-50" />
                        </div>

                        {/* Weekly Breakdown */}
                        {weeklySummary.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-zinc-800">
                                <p className="text-xs text-zinc-500 font-medium mb-2">Konsumsi Mingguan</p>
                                <div className="space-y-2">
                                    {weeklySummary.map(([week, total]) => (
                                        <div key={week} className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-400">Minggu ke-{week}</span>
                                            <span className="text-zinc-200 font-medium">{total.toFixed(1)} g</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Input Form */}
            <div className="glass-panel rounded-xl p-6 mb-6">
                <h2 className="text-lg font-medium text-zinc-200 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-aqua-400" />
                    Input Pemberian Pakan
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Tanggal</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            required
                        />
                    </div>
                    <div>
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
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Jenis Pakan</label>
                        <input
                            type="text"
                            value={formData.feedType}
                            onChange={(e) => setFormData({ ...formData, feedType: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            placeholder="Pelet, Artemia, dll"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 mb-1">Jumlah Pakan (gram)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={formData.feedGiven}
                            onChange={(e) => setFormData({ ...formData, feedGiven: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                            placeholder="500"
                            required
                        />
                    </div>
                    <div className="md:col-span-4">
                        <button
                            type="submit"
                            className="w-full bg-aqua-600 hover:bg-aqua-500 text-white font-medium py-2 rounded-lg transition-colors"
                        >
                            Simpan Data
                        </button>
                    </div>
                </form>
            </div>

            {/* Daily Summary */}
            {Object.keys(dailySummary).length > 0 && (
                <div className="glass-panel rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-medium text-zinc-200 mb-4">Ringkasan Harian</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(dailySummary)
                            .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
                            .slice(0, 6)
                            .map(([date, summary]) => (
                                <div key={date} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800/50">
                                    <p className="text-xs text-zinc-500 mb-2">
                                        {new Date(date).toLocaleDateString('id-ID', {
                                            weekday: 'short',
                                            day: '2-digit',
                                            month: 'short'
                                        })}
                                    </p>
                                    <p className="text-xl font-semibold text-zinc-100">
                                        {summary.total.toFixed(1)} <span className="text-sm text-zinc-400">g</span>
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {['Pagi', 'Siang', 'Sore', 'Malam'].map(period => (
                                            <span
                                                key={period}
                                                className={`text-[10px] px-2 py-0.5 rounded border ${summary.periods.has(period)
                                                    ? 'bg-aqua-500/20 text-aqua-400 border-aqua-500/30'
                                                    : 'bg-zinc-800 text-zinc-600 border-zinc-700'
                                                    }`}
                                            >
                                                {period}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-2">
                                        {summary.count}x pemberian • {Array.from(summary.types).join(', ')}
                                    </p>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="glass-panel rounded-xl p-6">
                <h2 className="text-lg font-medium text-zinc-200 mb-4">Riwayat Pemberian Pakan</h2>
                {pondLogs.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Belum ada data pemberian pakan untuk kolam ini.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Tanggal</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Waktu</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Jenis Pakan</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium">Jumlah (g)</th>
                                    <th className="text-center py-3 px-4 text-zinc-400 font-medium w-32">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pondLogs.map((log, idx) => (
                                    <tr key={log.id || idx} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                                        <td className="py-3 px-4 text-zinc-300 text-center">
                                            {new Date(log.date).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="py-3 px-4 text-zinc-300 text-center">
                                            {getPeriodFromTime(log.time)}
                                        </td>
                                        <td className="py-3 px-4 text-zinc-300 text-center">
                                            {log.feedType}
                                        </td>
                                        <td className="py-3 px-4 text-zinc-300 text-center font-medium">
                                            {editingId === log.id ? (
                                                <input
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-20 bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-center text-xs mx-auto block"
                                                />
                                            ) : (
                                                log.feedGiven.toFixed(1)
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {editingId === log.id ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleSaveEdit(log.id)}
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
                                                        onClick={() => handleEdit(log)}
                                                        className="p-1 text-zinc-500 hover:text-blue-400 transition-colors"
                                                        title="Edit Jumlah"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(log.id)}
                                                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-zinc-700">
                                    <td colSpan={3} className="py-3 px-4 text-zinc-200 font-semibold text-center whitespace-nowrap">
                                        Total Konsumsi Pakan (TKP)
                                    </td>
                                    <td className="py-3 px-4 text-aqua-400 text-center font-bold text-base">
                                        {tkp.toFixed(2)} g
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
