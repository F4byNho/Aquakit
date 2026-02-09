import { Calculator, Fish, ArrowRight, Waves } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-hidden font-sans selection:bg-aqua-500/30">

            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none z-0">
                <div className="absolute top-20 left-20 w-96 h-96 bg-aqua-900/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-900/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-zinc-900/10 rounded-full border border-zinc-800/20"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-900/10 rounded-full border border-zinc-800/20"></div>
            </div>

            {/* Navbar / Header (Simple) */}
            <header className="w-full py-6 px-8 flex items-center justify-between z-10 relative max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aqua-500 to-blue-600 flex items-center justify-center shadow-lg shadow-aqua-500/20">
                        <Waves className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        AquaMetric
                    </span>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 text-center max-w-4xl mx-auto pb-20">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-sm mb-8 animate-fade-in-up">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aqua-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-aqua-500"></span>
                    </span>
                    <span className="text-xs font-medium text-zinc-400">Sistem Manajemen Akuakultur Cerdas</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <span className="block text-zinc-100 mb-2">Analisis Budidaya</span>
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-aqua-400 to-blue-500">
                        Berbasis Sains
                    </span>
                </h1>

                {/* Subtitle / Description */}
                <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
                    Gunakan kalkulator ilmiah untuk menghitung performa budidaya secara instan atau kelola data kolam anda secara terintegrasi dalam satu platform modern.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>

                    {/* Primary CTA: Calculator */}
                    <button
                        onClick={() => navigate('/calculator')}
                        className="group relative w-full sm:w-auto px-8 py-4 bg-zinc-100 hover:bg-white text-zinc-950 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3"
                    >
                        <Calculator className="w-5 h-5" />
                        <span>Hitung Rumus</span>
                        <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Secondary CTA: Dashboard */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group w-full sm:w-auto px-8 py-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 hover:border-aqua-500/30 text-zinc-100 rounded-full font-medium transition-all backdrop-blur-sm flex items-center justify-center gap-3"
                    >
                        <Fish className="w-5 h-5 text-aqua-400" />
                        <span>Analisis Budidaya</span>
                    </button>
                </div>


            </main>

            {/* Footer Simple */}
            <footer className="w-full py-6 text-center z-10 relative">
                <p className="text-sm text-zinc-600">© 2026 AquaMetric.</p>
            </footer>

            {/* CSS for custom animations if not in global css */}
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0; /* logic handled by animation */
                }
                .animate-pulse-slow {
                    animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            `}</style>
        </div>
    );
}
