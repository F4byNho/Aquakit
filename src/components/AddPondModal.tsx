import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Pond, CalculationModule } from '../types/models';
import { X } from 'lucide-react';

interface AddPondModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddPondModal({ isOpen, onClose }: AddPondModalProps) {
    const { state, addPond } = useApp();

    // Add Pond Form State
    const [pondCount, setPondCount] = useState(1);
    const [newPonds, setNewPonds] = useState<Partial<Pond>[]>([]);
    const [configStep, setConfigStep] = useState(1); // 1: Count, 2: Details

    const modules: CalculationModule[] = ['SR', 'FCR', 'SGR', 'RGR', 'EPP', 'TKP', 'AbsoluteWeight'];

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setNewPonds([]);
            setPondCount(1);
            setConfigStep(1);
        }
    }, [isOpen]);

    const handlePondCountSubmit = () => {
        const initialPonds = Array.from({ length: pondCount }, (_, i) => ({
            name: `Kolam ${state.ponds.length + i + 1}`,
            species: '',
            initialStock: 0,
            initialTotalWeight: 0,
            startDate: new Date().toISOString().split('T')[0],
            durationDays: 60,
            initialAverageLength: 0,
            selectedModules: [...modules],
        }));
        setNewPonds(initialPonds);
        setConfigStep(2);
    };

    const handlePondUpdate = (index: number, field: string, value: any) => {
        setNewPonds(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
    };

    const handleSavePonds = () => {
        // Validate all ponds
        const isValid = newPonds.every(p =>
            p.name &&
            p.species &&
            p.initialStock !== undefined && p.initialStock > 0 &&
            p.initialTotalWeight !== undefined && p.initialTotalWeight > 0 &&
            p.selectedModules && p.selectedModules.length > 0
        );

        if (!isValid) {
            alert('Mohon lengkapi semua data kolam (Nama, Spesies, Stok, Bobot) dan pilih minimal satu modul kalkulasi.');
            return;
        }

        newPonds.forEach((p, i) => {
            // Calculate Total Weight (Biomass) from Input Average Weight * Stock
            const avgWeight = p.initialTotalWeight || 0;
            const stock = p.initialStock || 0;
            const totalBiomass = avgWeight * stock;

            addPond({
                id: `pond-${Date.now()}-${i}`,
                name: p.name!,
                species: p.species as string,
                initialStock: stock,
                initialTotalWeight: totalBiomass, // Save as biomass
                initialAverageLength: p.initialAverageLength || 0,
                startDate: p.startDate!,
                durationDays: p.durationDays!,
                selectedModules: p.selectedModules!,
            });
        });

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-panel border-zinc-800 rounded-2xl max-w-4xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 text-zinc-500 hover:text-zinc-300"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-bold text-zinc-100 mb-6">Konfigurasi Kolam</h2>

                {configStep === 1 ? (
                    <div className="space-y-6">
                        <label className="block text-sm font-medium text-zinc-300">
                            Berapa banyak kolam yang ingin Anda tambahkan?
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={pondCount}
                            onChange={(e) => setPondCount(parseInt(e.target.value) || 1)}
                            className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-3 text-white text-lg focus:ring-2 focus:ring-aqua-500/50 focus:border-aqua-500 outline-none"
                        />
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handlePondCountSubmit}
                                className="bg-aqua-600 hover:bg-aqua-500 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                            >
                                Lanjut
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {newPonds.map((pond, index) => (
                                <div key={index} className="bg-zinc-900/40 rounded-xl p-6 border border-zinc-800/60">
                                    <h3 className="text-lg font-medium text-aqua-400 mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-aqua-500"></div>
                                        Kolam {index + 1}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-xs text-zinc-500 mb-1">Nama Kolam</label>
                                            <input
                                                type="text"
                                                value={pond.name}
                                                onChange={(e) => handlePondUpdate(index, 'name', e.target.value)}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:border-aqua-500/50 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 mb-1">Spesies (Contoh: Lele, Nila)</label>
                                            <input
                                                type="text"
                                                value={pond.species}
                                                onChange={(e) => handlePondUpdate(index, 'species', e.target.value)}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:border-aqua-500/50 outline-none placeholder-zinc-700"
                                                placeholder="Nila"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 mb-1">Stok Awal (Ekor)</label>
                                            <input
                                                type="number"
                                                value={pond.initialStock === 0 ? '' : pond.initialStock}
                                                onChange={(e) => handlePondUpdate(index, 'initialStock', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:border-aqua-500/50 outline-none placeholder-zinc-700"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 mb-1">Bobot Rata-Rata Awal (gram)</label>
                                            <input
                                                type="number"
                                                value={pond.initialTotalWeight === 0 ? '' : pond.initialTotalWeight}
                                                onChange={(e) => handlePondUpdate(index, 'initialTotalWeight', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:border-aqua-500/50 outline-none placeholder-zinc-700"
                                                placeholder="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 mb-1">Panjang Rata-Rata Awal (cm)</label>
                                            <input
                                                type="number"
                                                value={pond.initialAverageLength === 0 ? '' : pond.initialAverageLength}
                                                onChange={(e) => handlePondUpdate(index, 'initialAverageLength', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:border-aqua-500/50 outline-none placeholder-zinc-700"
                                                placeholder="0 (Opsional)"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 mb-1">Lama Pemeliharaan (Hari)</label>
                                            <input
                                                type="number"
                                                value={pond.durationDays === 0 ? '' : pond.durationDays}
                                                onChange={(e) => handlePondUpdate(index, 'durationDays', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm focus:border-aqua-500/50 outline-none placeholder-zinc-700"
                                                placeholder="60"
                                            />
                                        </div>
                                    </div>

                                    {/* Module selection removed as requested */}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setConfigStep(1)}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-2.5 rounded-lg transition-colors border border-zinc-700"
                            >
                                Kembali
                            </button>
                            <button
                                onClick={handleSavePonds}
                                className="flex-1 bg-aqua-600 hover:bg-aqua-500 text-white font-medium py-2.5 rounded-lg transition-colors"
                            >
                                Simpan & Mulai
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
