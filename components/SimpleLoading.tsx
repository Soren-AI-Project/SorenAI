'use client';

interface SimpleLoadingProps {
  message?: string;
}

export default function SimpleLoading({ message = 'Cargando...' }: SimpleLoadingProps) {
  return (
    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="text-gray-300">{message}</p>
      </div>
    </div>
  );
} 