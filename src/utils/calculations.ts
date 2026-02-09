// Calculation Formulas

// Survival Rate: SR = (Nt / N0) × 100%
export function calculateSR(N0: number, Nt: number): number {
    if (N0 === 0) return 0;
    return (Nt / N0) * 100;
}

// FCR: F / ((Wt + D) - W0)
export function calculateFCR(totalFeed: number, W0: number, Wt: number, D: number): number {
    const denominator = (Wt + D) - W0;
    if (denominator === 0) return 0;
    return totalFeed / denominator;
}

// SGR: ((ln Wt - ln W0) / t) × 100%
export function calculateSGR(W0: number, Wt: number, days: number): number {
    if (W0 === 0 || days === 0) return 0;
    return ((Math.log(Wt) - Math.log(W0)) / days) * 100;
}

// EPP: ((Wt + D) - W0) / F × 100%
export function calculateEPP(W0: number, Wt: number, D: number, F: number): number {
    if (F === 0) return 0;
    return (((Wt + D) - W0) / F) * 100;
}

// RGR: ((Wt - W0) / (W0 × t)) × 100%
export function calculateRGR(W0: number, Wt: number, days: number): number {
    if (W0 === 0 || days === 0) return 0;
    return ((Wt - W0) / (W0 * days)) * 100;
}

// TKP: Sum of all feed
export function calculateTKP(feedAmounts: number[]): number {
    return feedAmounts.reduce((sum, feed) => sum + feed, 0);
}

// Absolute Weight Gain: Wt - W0
export function calculateAbsoluteWeight(W0: number, Wt: number): number {
    return Wt - W0;
}

// Absolute Length Gain: Lt - L0
export function calculateAbsoluteLength(L0: number, Lt: number): number {
    return Lt - L0;
}

// Helper: Get interpretation for SR
export function interpretSR(sr: number): { status: string; color: string } {
    if (sr >= 90) return { status: 'Sangat Baik', color: 'text-green-500' };
    if (sr >= 80) return { status: 'Baik', color: 'text-blue-500' };
    if (sr >= 70) return { status: 'Cukup', color: 'text-yellow-500' };
    return { status: 'Kurang', color: 'text-red-500' };
}

// Helper: Get interpretation for FCR
export function interpretFCR(fcr: number): { status: string; color: string } {
    if (fcr < 1.3) return { status: 'Sangat Baik', color: 'text-green-400' };
    if (fcr <= 1.5) return { status: 'Standar', color: 'text-yellow-400' };
    return { status: 'Tinggi (Cek Pakan)', color: 'text-orange-400' };
}

// Helper: Format formula with values
export interface FormulaDisplay {
    name: string;

    // Legacy single line (for linear formulas or fallback)
    formula: string;
    calculation: string;

    // Fraction Support
    isFraction: boolean;
    numeratorFormula?: string;
    denominatorFormula?: string;
    numeratorCalc?: string;
    denominatorCalc?: string;
    suffix?: string; // e.g. "× 100%"

    result: string;
    unit: string;
}

export function getFormulaDisplay(
    type: 'TKP' | 'SR' | 'FCR' | 'SGR' | 'RGR' | 'EPP' | 'AbsoluteWeight' | 'AbsoluteLength',
    values: { [key: string]: any }
): FormulaDisplay {
    const isTotal = values.mode === 'total';

    // Formatter for Total Biomass mode (Use thousands separators, max 2 decimals)
    // e.g. 33750 -> "33.750" (ID locale)
    const fmtTotal = (n: number) => n ? n.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '0';

    // Formatter for Individual mode (Fixed decimals)
    // e.g. 30 -> "30.00"
    const fmtInd = (n: number) => n ? n.toFixed(2) : '0.00';

    const fmt = isTotal ? fmtTotal : fmtInd;

    switch (type) {
        case 'TKP':
            return {
                name: 'Total Konsumsi Pakan (TKP)',
                formula: 'TKP = Σ Pakan yang diberikan',
                calculation: `TKP = ${fmtTotal(values.F)}`, // Always total
                isFraction: false,
                result: values.F.toFixed(2),
                unit: 'gram'
            };
        case 'SR':
            return {
                name: 'Survival Rate (SR)',
                formula: 'SR = (Nt / N0) × 100%',
                calculation: `SR = (${values.Nt} / ${values.N0}) × 100%`,
                isFraction: true,
                numeratorFormula: 'Nt',
                denominatorFormula: 'N0',
                numeratorCalc: `${values.Nt}`,
                denominatorCalc: `${values.N0}`,
                suffix: '× 100%',
                result: calculateSR(values.N0, values.Nt).toFixed(2),
                unit: '%'
            };
        case 'FCR':
            // Logic: uses raw Total Biomass values if mode='total'
            return {
                name: 'Feed Conversion Ratio (FCR)',
                formula: 'FCR = F / ((Wt + D) - W0)',
                calculation: `FCR = ${fmt(values.F)} / ((${fmt(values.Wt)} + ${fmt(values.D)}) - ${fmt(values.W0)})`,
                isFraction: true,
                numeratorFormula: 'F',
                denominatorFormula: '(Wt + D) - W0',
                numeratorCalc: `${fmt(values.F)}`,
                denominatorCalc: `(${fmt(values.Wt)} + ${fmt(values.D)}) - ${fmt(values.W0)}`,
                suffix: '',
                result: calculateFCR(values.F, values.W0, values.Wt, values.D).toFixed(3),
                unit: ''
            };
        case 'SGR':
            return {
                name: 'Specific Growth Rate (SGR)',
                formula: 'SGR = ((ln Wt - ln W0) / t) × 100%',
                calculation: `SGR = ((ln ${fmtInd(values.Wt)} - ln ${fmtInd(values.W0)}) / ${values.t}) × 100%`, // Always individual
                isFraction: true,
                numeratorFormula: 'ln Wt - ln W0',
                denominatorFormula: 't',
                numeratorCalc: `ln(${fmtInd(values.Wt)}) - ln(${fmtInd(values.W0)})`,
                denominatorCalc: `${values.t}`,
                suffix: '× 100%',
                result: calculateSGR(values.W0, values.Wt, values.t).toFixed(3),
                unit: '%/hari'
            };
        case 'RGR':
            return {
                name: 'Relative Growth Rate (RGR)',
                formula: 'RGR = ((Wt - W0) / (W0 × t)) × 100%',
                calculation: `RGR = ((${fmtInd(values.Wt)} - ${fmtInd(values.W0)}) / (${fmtInd(values.W0)} × ${values.t})) × 100%`, // Always individual
                isFraction: true,
                numeratorFormula: 'Wt - W0',
                denominatorFormula: 'W0 × t',
                numeratorCalc: `${fmtInd(values.Wt)} - ${fmtInd(values.W0)}`,
                denominatorCalc: `${fmtInd(values.W0)} × ${values.t}`,
                suffix: '× 100%',
                result: calculateRGR(values.W0, values.Wt, values.t).toFixed(3),
                unit: '%/hari'
            };
        case 'EPP':
            return {
                name: 'Efisiensi Pemanfaatan Pakan (EPP)',
                formula: 'EPP = (((Wt + D) - W0) / F) × 100%',
                calculation: `EPP = (((${fmt(values.Wt)} + ${fmt(values.D)}) - ${fmt(values.W0)}) / ${fmt(values.F)}) × 100%`,
                isFraction: true,
                numeratorFormula: '(Wt + D) - W0',
                denominatorFormula: 'F',
                numeratorCalc: `(${fmt(values.Wt)} + ${fmt(values.D)}) - ${fmt(values.W0)}`,
                denominatorCalc: `${fmt(values.F)}`,
                suffix: '× 100%',
                result: calculateEPP(values.W0, values.Wt, values.D, values.F).toFixed(2),
                unit: '%'
            };
        case 'AbsoluteWeight':
            return {
                name: 'Bobot Mutlak',
                formula: 'Bobot Mutlak = Wt - W0',
                calculation: `Bobot Mutlak = ${fmtInd(values.Wt)} - ${fmtInd(values.W0)}`, // Always individual
                isFraction: false,
                result: calculateAbsoluteWeight(values.W0, values.Wt).toFixed(2),
                unit: 'gram'
            };
        case 'AbsoluteLength':
            return {
                name: 'Panjang Mutlak',
                formula: 'Panjang Mutlak = Lt - L0',
                calculation: `Panjang Mutlak = ${values.Lt} - ${values.L0}`,
                isFraction: false,
                result: calculateAbsoluteLength(values.L0, values.Lt).toFixed(2),
                unit: 'cm'
            };
    }
}

export function getModuleLabel(module: string): string {
    const labels: Record<string, string> = {
        'AbsoluteWeight': 'Bobot Mutlak',
        'AbsoluteLength': 'Panjang Mutlak',
        'SR': 'Survival Rate',
        'FCR': 'Feed Conversion Ratio',
        'SGR': 'Specific Growth Rate',
        'RGR': 'Relative Growth Rate',
        'EPP': 'Efisiensi Pakan',
        'TKP': 'Total Konsumsi Pakan',
        'Catfish': 'Lele',
        'Tilapia': 'Nila',
        'Shrimp': 'Udang',
        'Other': 'Lainnya'
    };
    return labels[module] || module;
}
