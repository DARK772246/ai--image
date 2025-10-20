
import React from 'react';

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 relative animate-[spin_8s_linear_infinite]" style={{ perspective: '1000px' }}>
                <div className="w-full h-full absolute transform-style-3d">
                    <div className="absolute w-full h-full border-2 border-cyan-400 bg-cyan-400/20 opacity-70 transform rotate-y-90 translate-z-12"></div>
                    <div className="absolute w-full h-full border-2 border-cyan-400 bg-cyan-400/20 opacity-70 transform -rotate-y-90 -translate-z-12"></div>
                    <div className="absolute w-full h-full border-2 border-fuchsia-500 bg-fuchsia-500/20 opacity-70 transform rotate-x-90 translate-z-12"></div>
                    <div className="absolute w-full h-full border-2 border-fuchsia-500 bg-fuchsia-500/20 opacity-70 transform -rotate-x-90 -translate-z-12"></div>
                    <div className="absolute w-full h-full border-2 border-blue-500 bg-blue-500/20 opacity-70 transform translate-z-12"></div>
                    <div className="absolute w-full h-full border-2 border-blue-500 bg-blue-500/20 opacity-70 transform -translate-z-12"></div>
                </div>
            </div>
            <p className="font-orbitron text-lg neon-text text-cyan-300 tracking-widest">IMAGINING...</p>
        </div>
    );
};

export default LoadingSpinner;
