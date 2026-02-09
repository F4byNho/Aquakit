// Data Models
export type CalculationModule = 'SR' | 'FCR' | 'SGR' | 'RGR' | 'EPP' | 'TKP' | 'AbsoluteWeight';

export interface Pond {
    id: string;
    name: string;
    species: string;
    initialStock: number; // N0
    initialTotalWeight: number; // W0 in grams
    initialAverageLength?: number; // L0 in cm
    startDate: string;
    durationDays: number;
    selectedModules: CalculationModule[];
}

export interface Sampling {
    id: string; // Unique ID
    pondId: string;
    day: number;
    date: string;
    sampledCount: number;
    sampleWeights: number[]; // grams
    sampleLengths?: number[]; // cm
    notes?: string;
}

export interface FeedLog {
    id: string; // Unique ID
    pondId: string;
    date: string;
    time: string; // HH:mm format
    feedType: string; // jenis pakan
    feedGiven: number; // grams
    feedLeftover?: number;
}

export interface Mortality {
    pondId: string;
    date: string;
    deadCount: number;
    deadWeight: number; // grams
}

export interface WaterQuality {
    id: string; // Unique ID
    pondId: string;
    timestamp: string;
    pH: number;
    temperature: number; // Celsius
    dissolvedOxygen: number; // mg/L
    salinity?: number; // ppt
    notes?: string;
}

export interface AppState {
    ponds: Pond[];
    samplings: Sampling[];
    feedLogs: FeedLog[];
    mortalities: Mortality[];
    waterQuality: WaterQuality[];
    // onboardingComplete?: boolean; // removed
}
