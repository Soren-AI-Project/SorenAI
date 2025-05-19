'use client';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-24 h-24 mb-4 flex items-center justify-center relative mx-auto">
          <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
            <svg className="w-20 h-20 text-green-400 opacity-60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" strokeDasharray="62.8 62.8" />
            </svg>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-14 h-14">
              <path d="M30 60 L30 80 L70 80 L70 60 Z" fill="#1e3a3a" />
              <rect x="28" y="80" width="44" height="5" rx="2" fill="#1a2e2e" />
              <ellipse cx="50" cy="85" rx="22" ry="3" fill="rgba(0,0,0,0.1)" />
              <path d="M50 60 L50 45" stroke="#2e9e6b" strokeWidth="2" fill="none" />
              <path d="M50 45 Q60 40 65 30 Q50 32 50 45" fill="#26ae7b" />
              <path d="M50 45 Q40 35 30 33 Q45 45 50 45" fill="#26ae7b" />
              <path d="M50 45 Q40 40 35 30 Q50 32 50 45" fill="#26ae7b" />
              <path d="M50 50 Q60 48 70 55 Q55 45 50 50" fill="#26ae7b" />
              <path d="M58 36 Q55 38 55 35" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
              <path d="M42 38 Q45 40 45 37" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
            </svg>
          </div>
        </div>
        <div className="text-xl font-bold text-green-400">Cargando dashboard...</div>
      </div>
    </div>
  );
} 