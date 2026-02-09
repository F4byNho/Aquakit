import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Pond, Sampling, FeedLog, Mortality, WaterQuality } from '../types/models';

interface AppContextType {
    state: AppState;
    addPond: (pond: Pond) => void;
    updatePond: (id: string, updates: Partial<Pond>) => void;
    addSampling: (sampling: Sampling) => void;
    addFeedLog: (log: FeedLog) => void;
    updateFeedLog: (id: string, updates: Partial<FeedLog>) => void;
    deleteFeedLog: (id: string) => void;
    updateSampling: (id: string, updates: Partial<Sampling>) => void;
    deleteSampling: (id: string) => void;
    addMortality: (mortality: Mortality) => void;
    addWaterQuality: (wq: WaterQuality) => void;
    updateWaterQuality: (id: string, updates: Partial<WaterQuality>) => void;
    deleteWaterQuality: (id: string) => void;
    // completeOnboarding removed
    resetApp: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialState: AppState = {
    ponds: [],
    samplings: [],
    feedLogs: [],
    mortalities: [],
    waterQuality: [],
    // onboardingComplete removed
};

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AppState>(() => {
        const saved = localStorage.getItem('aquametric-state');
        let parsedState = saved ? JSON.parse(saved) : initialState;

        // Migration: Ensure IDs exist for legacy data
        let changed = false;
        const newSamplings = parsedState.samplings.map((s: any) => {
            if (!s.id) {
                changed = true;
                return { ...s, id: `sampling-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
            }
            return s;
        });

        const newFeedLogs = parsedState.feedLogs.map((l: any) => {
            if (!l.id) {
                changed = true;
                return { ...l, id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
            }
            return l;
        });

        if (changed) {
            parsedState = {
                ...parsedState,
                samplings: newSamplings,
                feedLogs: newFeedLogs
            };
        }

        // Migration: Ensure IDs exist for WaterQuality data (if any legacy)
        let wqChanged = false;
        const newWaterQuality = (parsedState.waterQuality || []).map((w: any) => {
            if (!w.id) {
                wqChanged = true;
                return { ...w, id: `wq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
            }
            return w;
        });

        if (wqChanged) {
            parsedState = { ...parsedState, waterQuality: newWaterQuality };
        }

        return parsedState;
    });

    useEffect(() => {
        localStorage.setItem('aquametric-state', JSON.stringify(state));
    }, [state]);

    const addPond = (pond: Pond) => {
        setState(prev => ({ ...prev, ponds: [...prev.ponds, pond] }));
    };

    const updatePond = (id: string, updates: Partial<Pond>) => {
        setState(prev => ({
            ...prev,
            ponds: prev.ponds.map(p => p.id === id ? { ...p, ...updates } : p)
        }));
    };

    const addSampling = (sampling: Sampling) => {
        setState(prev => ({ ...prev, samplings: [...prev.samplings, sampling] }));
    };

    const addFeedLog = (log: FeedLog) => {
        setState(prev => ({ ...prev, feedLogs: [...prev.feedLogs, log] }));
    };

    const updateFeedLog = (id: string, updates: Partial<FeedLog>) => {
        setState(prev => ({
            ...prev,
            feedLogs: prev.feedLogs.map(log => log.id === id ? { ...log, ...updates } : log)
        }));
    };

    const deleteFeedLog = (id: string) => {
        setState(prev => ({
            ...prev,
            feedLogs: prev.feedLogs.filter(log => log.id !== id)
        }));
    };

    const updateSampling = (id: string, updates: Partial<Sampling>) => {
        setState(prev => ({
            ...prev,
            samplings: prev.samplings.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
    };

    const deleteSampling = (id: string) => {
        setState(prev => ({
            ...prev,
            samplings: prev.samplings.filter(s => s.id !== id)
        }));
    };

    const addMortality = (mortality: Mortality) => {
        setState(prev => ({ ...prev, mortalities: [...prev.mortalities, mortality] }));
    };

    const addWaterQuality = (wq: WaterQuality) => {
        setState(prev => ({ ...prev, waterQuality: [...prev.waterQuality, wq] }));
    };

    const updateWaterQuality = (id: string, updates: Partial<WaterQuality>) => {
        setState(prev => ({
            ...prev,
            waterQuality: prev.waterQuality.map(w => w.id === id ? { ...w, ...updates } : w)
        }));
    };

    const deleteWaterQuality = (id: string) => {
        setState(prev => ({
            ...prev,
            waterQuality: prev.waterQuality.filter(w => w.id !== id)
        }));
    };

    // completeOnboarding removed


    const resetApp = () => {
        localStorage.removeItem('aquametric-state');
        setState(initialState);
    };

    return (
        <AppContext.Provider value={{
            state,
            addPond,
            updatePond,
            addSampling,
            addFeedLog,
            updateFeedLog,
            deleteFeedLog,
            updateSampling,
            deleteSampling,
            addMortality,
            addWaterQuality,
            updateWaterQuality,
            deleteWaterQuality,
            // completeOnboarding removed
            resetApp,
        }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}
