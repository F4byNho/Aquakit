
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calculator, Info, Plus, Trash2 } from 'lucide-react';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface Variable {
    key: string;
    label: string;
    unit: string;
    placeholder?: string;
    helperText?: string;
}

interface CalculationResult {
    value: number;
    unit: string;
    substitutionLatex: string;
    resultLatex: string;
}

interface Formula {
    id: string;
    title: string;
    symbol: string;
    description: string;
    latex: string;
    variables: Variable[];
    explanation: string;
    isDynamic?: boolean; // Flag for dynamic input formulas like TKP
    calculate: (inputs: Record<string, number>, dynamicValues?: number[]) => CalculationResult;
}

const ScientificCalculator: React.FC = () => {
    const navigate = useNavigate();
    const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);
    const [inputs, setInputs] = useState<Record<string, string>>({});

    // State for dynamic inputs (TKP)
    const [dynamicInputs, setDynamicInputs] = useState<string[]>(['']);

    const [result, setResult] = useState<CalculationResult | null>(null);

    // Helper to format numbers with commas for Indonesian context
    const fmt = (num: number) => num.toLocaleString('id-ID', { maximumFractionDigits: 3 });

    const formulas: Formula[] = [
        {
            id: 'TKP',
            title: 'Total Konsumsi Pakan',
            symbol: 'TKP',
            description: 'Jumlah total pakan yang diberikan (Penjumlahan F1...Fn).',
            latex: 'TKP = F_1 + F_2 + ... + F_n',
            variables: [], // Handled dynamically
            isDynamic: true,
            explanation: 'Total pakan adalah akumulasi seluruh pakan yang diberikan selama periode pemeliharaan.',
            calculate: (_, dynamicValues) => {
                const vals = dynamicValues || [];
                const total = vals.reduce((a, b) => a + b, 0);

                // Generate LaTeX for substitution: "10 + 20 + 30"
                const substitutionStr = vals.map(v => fmt(v)).join(' + ');

                return {
                    value: total,
                    unit: 'gram',
                    substitutionLatex: `TKP = ${substitutionStr}`,
                    resultLatex: `TKP = ${fmt(total)} \\text{ g}`
                };
            }
        },
        {
            id: 'SR',
            title: 'Survival Rate',
            symbol: 'SR',
            description: 'Persentase kelangsungan hidup ikan pada akhir pemeliharaan.',
            latex: 'SR = \\frac{N_t}{N_0} \\times 100\\%',
            variables: [
                { key: 'Nt', label: 'Jumlah Ikan Akhir (Nt)', unit: 'ekor', helperText: 'Jumlah ikan yang hidup' },
                { key: 'N0', label: 'Jumlah Ikan Awal (N0)', unit: 'ekor', helperText: 'Jumlah ikan yang ditebar' }
            ],
            explanation: 'SR menggambarkan keberhasilan pemeliharaan dari segi populasi.',
            calculate: (vals) => {
                const sr = (vals.Nt / vals.N0) * 100;
                return {
                    value: sr,
                    unit: '%',
                    substitutionLatex: `SR = \\frac{${fmt(vals.Nt)}}{${fmt(vals.N0)}} \\times 100\\%`,
                    resultLatex: `SR = ${fmt(sr)} \\%`
                };
            }
        },
        {
            id: 'Wm',
            title: 'Bobot Mutlak',
            symbol: 'Wm',
            description: 'Pertambahan bobot rata-rata individu ikan.',
            latex: 'Wm = W_t - W_0',
            variables: [
                { key: 'Wt', label: 'Bobot Akhir (Wt)', unit: 'gram', helperText: 'Rata-rata bobot ikan akhir' },
                { key: 'W0', label: 'Bobot Awal (W0)', unit: 'gram', helperText: 'Rata-rata bobot ikan awal' }
            ],
            explanation: 'Selisih bobot akhir dan bobot awal.',
            calculate: (vals) => {
                const wm = vals.Wt - vals.W0;
                return {
                    value: wm,
                    unit: 'gram',
                    substitutionLatex: `Wm = ${fmt(vals.Wt)}\\text{ g} - ${fmt(vals.W0)}\\text{ g}`,
                    resultLatex: `Wm = ${fmt(wm)} \\text{ g}`
                };
            }
        },
        {
            id: 'EPP',
            title: 'Efisiensi Pakan',
            symbol: 'EPP',
            description: 'Efisiensi penggunaan pakan terhadap pertambahan biomassa.',
            latex: 'EPP = \\frac{(W_t + D) - W_0}{F} \\times 100\\%',
            variables: [
                { key: 'Wt_total', label: 'Biomassa Akhir (Wt)', unit: 'gram', helperText: 'Total berat akhir' },
                { key: 'D', label: 'Biomassa Mati (D)', unit: 'gram', helperText: 'Total berat ikan mati' },
                { key: 'W0_total', label: 'Biomassa Awal (W0)', unit: 'gram', helperText: 'Total berat awal' },
                { key: 'F', label: 'Total Pakan (F)', unit: 'gram', helperText: 'Total pakan diberikan' }
            ],
            explanation: 'Semakin tinggi nilai EPP, semakin efisien pakan yang digunakan.',
            calculate: (vals) => {
                const numerator = (vals.Wt_total + vals.D) - vals.W0_total;
                const epp = (numerator / vals.F) * 100;
                return {
                    value: epp,
                    unit: '%',
                    substitutionLatex: `EPP = \\frac{(${fmt(vals.Wt_total)} + ${fmt(vals.D)}) - ${fmt(vals.W0_total)}}{${fmt(vals.F)}} \\times 100\\%`,
                    resultLatex: `EPP = ${fmt(epp)} \\%`
                };
            }
        },
        {
            id: 'RGR',
            title: 'Relative Growth Rate',
            symbol: 'RGR',
            description: 'Laju pertumbuhan relatif harian.',
            latex: 'RGR = \\frac{W_t - W_0}{W_0 \\times t} \\times 100\\%',
            variables: [
                { key: 'Wt', label: 'Bobot Akhir (Wt)', unit: 'gram', helperText: 'Bobot rata-rata akhir' },
                { key: 'W0', label: 'Bobot Awal (W0)', unit: 'gram', helperText: 'Bobot rata-rata awal' },
                { key: 't', label: 'Waktu (t)', unit: 'hari', helperText: 'Lama pemeliharaan' }
            ],
            explanation: 'Persentase pertumbuhan harian relatif.',
            calculate: (vals) => {
                const rgr = ((vals.Wt - vals.W0) / (vals.W0 * vals.t)) * 100;
                return {
                    value: rgr,
                    unit: '%/hari',
                    substitutionLatex: `RGR = \\frac{${fmt(vals.Wt)} - ${fmt(vals.W0)}}{${fmt(vals.W0)} \\times ${fmt(vals.t)}} \\times 100\\%`,
                    resultLatex: `RGR = ${fmt(rgr)} \\% / \\text{hari}`
                };
            }
        },
        {
            id: 'SGR',
            title: 'Specific Growth Rate',
            symbol: 'SGR',
            description: 'Laju pertumbuhan spesifik harian (logaritmik).',
            latex: 'SGR = \\frac{\\ln W_t - \\ln W_0}{t} \\times 100\\%',
            variables: [
                { key: 'Wt', label: 'Bobot Akhir (Wt)', unit: 'gram', helperText: 'Bobot rata-rata akhir' },
                { key: 'W0', label: 'Bobot Awal (W0)', unit: 'gram', helperText: 'Bobot rata-rata awal' },
                { key: 't', label: 'Waktu (t)', unit: 'hari', helperText: 'Lama pemeliharaan' }
            ],
            explanation: 'Pertumbuhan eksponensial harian.',
            calculate: (vals) => {
                const lnWt = Math.log(vals.Wt);
                const lnW0 = Math.log(vals.W0);
                const sgr = ((lnWt - lnW0) / vals.t) * 100;
                return {
                    value: sgr,
                    unit: '%/hari',
                    substitutionLatex: `SGR = \\frac{\\ln(${fmt(vals.Wt)}) - \\ln(${fmt(vals.W0)})}{${fmt(vals.t)}} \\times 100\\%`,
                    resultLatex: `SGR = ${fmt(sgr)} \\% / \\text{hari}`
                };
            }
        },
        {
            id: 'FCR',
            title: 'Feed Conversion Ratio',
            symbol: 'FCR',
            description: 'Rasio konversi pakan menjadi daging ikan.',
            latex: 'FCR = \\frac{F}{((W_t + D) - W_0)}',
            variables: [
                { key: 'F', label: 'Jumlah Pakan (F)', unit: 'gram', helperText: 'Jumlah pakan dikonsumsi' },
                { key: 'Wt', label: 'Bobot Akhir (Wt)', unit: 'gram', helperText: 'Bobot ikan akhir' },
                { key: 'D', label: 'Bobot Ikan Mati (D)', unit: 'gram', helperText: 'Bobot ikan mati' },
                { key: 'W0', label: 'Bobot Awal (W0)', unit: 'gram', helperText: 'Bobot ikan awal' }
            ],
            explanation: 'Semakin KECIL nilai FCR, semakin baik.',
            calculate: (vals) => {
                const denom = (vals.Wt + vals.D) - vals.W0;
                if (denom <= 0) return {
                    value: 0, unit: '',
                    substitutionLatex: 'Invalid', resultLatex: 'Invalid'
                };
                const fcr = vals.F / denom;
                return {
                    value: fcr,
                    unit: 'rasio',
                    substitutionLatex: `FCR = \\frac{${fmt(vals.F)}}{(${fmt(vals.Wt)} + ${fmt(vals.D)}) - ${fmt(vals.W0)}}`,
                    resultLatex: `FCR = ${fmt(fcr)}`
                };
            }
        },
        {
            id: 'Fekunditas',
            title: 'Fekunditas',
            symbol: 'F',
            description: 'Estimasi jumlah total telur dalam ovarium ikan.',
            latex: 'F = \\frac{Bg}{Bs} \\times Fs',
            variables: [
                { key: 'Bg', label: 'Bobot Seluruh Gonad (Bg)', unit: 'gram', helperText: 'Berat total gonad' },
                { key: 'Bs', label: 'Bobot Sebagian Gonad (Bs)', unit: 'gram', helperText: 'Berat sampel gonad' },
                { key: 'Fs', label: 'Jumlah Telur Sampel (Fs)', unit: 'butir', helperText: 'Telur dalam sampel' }
            ],
            explanation: 'Metode gravimetri.',
            calculate: (vals) => {
                const result = (vals.Bg / vals.Bs) * vals.Fs;
                return {
                    value: result,
                    unit: 'butir',
                    substitutionLatex: `F = \\frac{${fmt(vals.Bg)} \\text{ g}}{${fmt(vals.Bs)} \\text{ g}} \\times ${fmt(vals.Fs)} \\text{ butir}`,
                    resultLatex: `F = ${fmt(result)} \\text{ butir}`
                };
            }
        },
        {
            id: 'GSI',
            title: 'Gonadosomatic Index',
            symbol: 'GSI',
            description: 'Persentase bobot gonad terhadap bobot tubuh total.',
            latex: 'GSI = \\frac{Bg}{Bt} \\times 100\\%',
            variables: [
                { key: 'Bg', label: 'Bobot Gonad (Bg)', unit: 'gram', helperText: 'Berat gonad' },
                { key: 'Bt', label: 'Bobot Tubuh (Bt)', unit: 'gram', helperText: 'Berat tubuh' }
            ],
            explanation: 'Indikator kematangan gonad.',
            calculate: (vals) => {
                const result = (vals.Bg / vals.Bt) * 100;
                return {
                    value: result,
                    unit: '%',
                    substitutionLatex: `GSI = \\frac{${fmt(vals.Bg)}}{${fmt(vals.Bt)}} \\times 100\\%`,
                    resultLatex: `GSI = ${fmt(result)} \\%`
                };
            }
        },
        {
            id: 'FR',
            title: 'Fertilization Rate',
            symbol: 'FR',
            description: 'Persentase telur yang berhasil dibuahi.',
            latex: 'FR = \\frac{\\text{Jumlah telur terbuahi}}{\\text{Jumlah total telur}} \\times 100\\%',
            variables: [
                { key: 'N_terbuahi', label: 'Jumlah telur terbuahi', unit: 'butir', helperText: 'Telur terbuahi' },
                { key: 'N_total', label: 'Jumlah total telur', unit: 'butir', helperText: 'Total telur' }
            ],
            explanation: 'Keberhasilan pembuahan.',
            calculate: (vals) => {
                const result = (vals.N_terbuahi / vals.N_total) * 100;
                return {
                    value: result,
                    unit: '%',
                    substitutionLatex: `FR = \\frac{${fmt(vals.N_terbuahi)}}{${fmt(vals.N_total)}} \\times 100\\%`,
                    resultLatex: `FR = ${fmt(result)} \\%`
                };
            }
        },
        {
            id: 'HR',
            title: 'Hatching Rate',
            symbol: 'HR',
            description: 'Persentase telur yang berhasil menetas.',
            latex: 'HR = \\frac{\\text{Jumlah telur menetas}}{\\text{Jumlah telur terbuahi}} \\times 100\\%',
            variables: [
                { key: 'N_menetas', label: 'Jumlah telur menetas', unit: 'ekor', helperText: 'Larva menetas' },
                { key: 'N_terbuahi_hr', label: 'Jumlah telur terbuahi', unit: 'butir', helperText: 'Telur terbuahi' }
            ],
            explanation: 'Keberhasilan penetasan.',
            calculate: (vals) => {
                const result = (vals.N_menetas / vals.N_terbuahi_hr) * 100;
                return {
                    value: result,
                    unit: '%',
                    substitutionLatex: `HR = \\frac{${fmt(vals.N_menetas)}}{${fmt(vals.N_terbuahi_hr)}} \\times 100\\%`,
                    resultLatex: `HR = ${fmt(result)} \\%`
                };
            }
        },
        {
            id: 'IHS',
            title: 'Indeks Hepatosomatik',
            symbol: 'IHS',
            description: 'Persentase bobot hati terhadap bobot tubuh.',
            latex: 'IHS = \\frac{\\text{Bobot hati}}{\\text{Bobot tubuh}} \\times 100\\%',
            variables: [
                { key: 'Bh', label: 'Bobot Hati Ikan', unit: 'gram', helperText: 'Berat hati ikan' },
                { key: 'Bt', label: 'Bobot Tubuh Ikan', unit: 'gram', helperText: 'Berat tubuh ikan' }
            ],
            explanation: 'Indikator status nutrisi dan energi cadangan.',
            calculate: (vals) => {
                const result = (vals.Bh / vals.Bt) * 100;
                return {
                    value: result,
                    unit: '%',
                    substitutionLatex: `IHS = \\frac{${fmt(vals.Bh)}}{${fmt(vals.Bt)}} \\times 100\\%`,
                    resultLatex: `IHS = ${fmt(result)} \\%`
                };
            }
        }
    ];

    const handleSelectFormula = (id: string) => {
        setSelectedFormulaId(id);
        setInputs({});
        setDynamicInputs(['']);
        setResult(null);
    };

    const handleInputChange = (key: string, value: string) => {
        setInputs(prev => ({ ...prev, [key]: value }));
    };

    // Handler for Dynamic Inputs (TKP)
    const handleDynamicInputChange = (index: number, value: string) => {
        const newInputs = [...dynamicInputs];
        newInputs[index] = value;
        setDynamicInputs(newInputs);
    };

    const addDynamicInput = () => {
        setDynamicInputs([...dynamicInputs, '']);
    };

    const removeDynamicInput = (index: number) => {
        if (dynamicInputs.length > 1) {
            const newInputs = dynamicInputs.filter((_, i) => i !== index);
            setDynamicInputs(newInputs);
        }
    };

    const handleCalculate = () => {
        const formula = formulas.find(f => f.id === selectedFormulaId);
        if (!formula) return;

        let numInputs: Record<string, number> = {};
        let dynamicValues: number[] = [];

        if (formula.isDynamic) {
            // Validate Dynamic Inputs
            for (let i = 0; i < dynamicInputs.length; i++) {
                if (!dynamicInputs[i]) {
                    alert(`Mohon isi nilai untuk F${i + 1}`);
                    return;
                }
                dynamicValues.push(parseFloat(dynamicInputs[i]));
            }
        } else {
            // Validate Standard Inputs
            for (const v of formula.variables) {
                const raw = inputs[v.key];
                if (!raw) {
                    alert(`Mohon isi nilai untuk ${v.label}`);
                    return;
                }
                numInputs[v.key] = parseFloat(raw);
            }
        }

        const res = formula.calculate(numInputs, dynamicValues);
        setResult(res);
    };

    const selectedFormula = formulas.find(f => f.id === selectedFormulaId);

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
            <div className="w-full px-4 sm:px-8 lg:px-12 py-8">

                {selectedFormula && (
                    <button
                        onClick={() => handleSelectFormula('')}
                        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors mb-6 text-sm font-medium"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Kembali ke Menu
                    </button>
                )}

                {!selectedFormula ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Calculator className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    Kalkulator Budidaya
                                </h1>
                                <p className="text-zinc-400 mt-2 ml-1">Perhitungan manual berdasarkan rumus ilmiah akuakultur.</p>
                            </div>
                            <button
                                onClick={() => navigate('/')}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Kembali
                            </button>
                        </div>

                        {/* List Grid */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-6">
                                <h2 className="text-emerald-500 font-medium text-sm uppercase tracking-wider">Biologi & Pertumbuhan</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {formulas.map((formula) => (
                                    <button
                                        key={formula.id}
                                        onClick={() => handleSelectFormula(formula.id)}
                                        className="group relative flex flex-col text-left p-6 
                                            bg-zinc-900/30 backdrop-blur-sm
                                            border border-zinc-800/60 
                                            rounded-2xl 
                                            hover:bg-zinc-900/80 hover:border-emerald-500/30 
                                            transition-all duration-500 ease-out
                                            hover:shadow-2xl hover:shadow-emerald-900/20 hover:-translate-y-1"
                                    >
                                        {/* Subtle Inner Highlight */}
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        <div className="relative z-10 w-full">
                                            <div className="flex items-baseline gap-2 mb-3">
                                                <span className="text-xl font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors tracking-tight font-mono">
                                                    {formula.symbol}
                                                </span>
                                                <span className="text-sm font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                                    ({formula.title})
                                                </span>
                                            </div>

                                            <p className="text-xs text-zinc-500 font-light leading-relaxed group-hover:text-zinc-400 transition-colors line-clamp-2">
                                                {formula.description}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500 ease-out max-w-5xl mx-auto">
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 sm:p-8">

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                                {/* LEFT COLUMN: Input */}
                                <div className="flex flex-col h-full max-w-md">
                                    <div className="border-b border-zinc-800 pb-4 mb-6">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                            INPUT VARIABEL
                                        </h3>
                                    </div>

                                    <div className="space-y-6 flex-1">
                                        {/* Dynamic Logic for TKP / Formula.isDynamic */}
                                        {selectedFormula.isDynamic ? (
                                            <div className="space-y-4">
                                                <div className="space-y-3">
                                                    {dynamicInputs.map((val, index) => (
                                                        <div key={index} className="flex items-center gap-2 group">
                                                            <div className="flex-1">
                                                                <label className="text-xs font-bold text-zinc-400 block mb-1">
                                                                    Input {index + 1} (F{index + 1})
                                                                </label>
                                                                <div className="relative">
                                                                    <input
                                                                        type="number"
                                                                        value={val}
                                                                        onChange={(e) => handleDynamicInputChange(index, e.target.value)}
                                                                        placeholder="0"
                                                                        className="w-full bg-zinc-950 border border-zinc-700/50 focus:border-emerald-500 rounded-lg pl-3 pr-10 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                                                                        gram
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {dynamicInputs.length > 1 && (
                                                                <button
                                                                    onClick={() => removeDynamicInput(index)}
                                                                    className="mt-5 p-2.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-900/80 rounded-lg transition-colors"
                                                                    title="Hapus baris"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={addDynamicInput}
                                                    className="w-full py-2 border border-dashed border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Tambah Input Pakan
                                                </button>


                                            </div>
                                        ) : (
                                            /* Standard Logic for other formulas */
                                            selectedFormula.variables.map((v) => (
                                                <div key={v.key} className="group space-y-2">
                                                    <label className="text-sm font-bold text-zinc-200 block">
                                                        {v.label}
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            value={inputs[v.key] || ''}
                                                            onChange={(e) => handleInputChange(v.key, e.target.value)}
                                                            placeholder={v.placeholder || "0"}
                                                            className="w-full bg-zinc-950 border border-zinc-700/50 focus:border-emerald-500 rounded-lg pl-3 pr-12 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                                                            {v.unit}
                                                        </span>
                                                    </div>
                                                    {v.helperText && (
                                                        <div className="flex items-start gap-2 text-zinc-500 mt-1.5">
                                                            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                                            <span className="text-[11px] leading-tight">{v.helperText}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="mt-8">
                                        <button
                                            onClick={handleCalculate}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
                                        >
                                            <Calculator className="w-4 h-4" />
                                            Hitung
                                        </button>
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Result (Single Card Stack) */}
                                <div className="flex flex-col h-full max-w-md">
                                    <div className="border-b border-zinc-800 pb-4 mb-6">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                            HASIL PERHITUNGAN
                                        </h3>
                                    </div>

                                    <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center relative min-h-[300px]">
                                        {!result ? (
                                            <>
                                                <div className="text-emerald-400 mb-6 scale-125">
                                                    <BlockMath math={selectedFormula.latex} />
                                                </div>
                                                <p className="text-zinc-600 text-sm text-center">
                                                    Masukkan nilai untuk melihat hasil perhitungan.
                                                </p>
                                            </>
                                        ) : (
                                            <div className="animate-in fade-in zoom-in-95 duration-300 w-full flex flex-col items-center">
                                                {/* 1. Formula */}
                                                <div className="text-emerald-400 mb-4 text-lg">
                                                    <BlockMath math={selectedFormula.latex} />
                                                </div>

                                                {/* 2. Substitution */}
                                                <div className="text-zinc-200 mb-6 text-lg text-center break-words w-full">
                                                    <BlockMath math={result.substitutionLatex} />
                                                </div>

                                                {/* Divider */}
                                                <div className="w-3/4 h-px bg-zinc-800 mb-6"></div>

                                                {/* 3. Result */}
                                                <div className="text-white text-2xl font-bold tracking-tight">
                                                    <BlockMath math={result.resultLatex} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export { ScientificCalculator };
