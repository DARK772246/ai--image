import React from 'react';
import { useTypingAnimation } from '../hooks/useTypingAnimation';

const loadingPhrases = [
    "Initializing AI consciousness...",
    "Weaving digital threads...",
    "Consulting the cosmic muse...",
    "Painting with pure light...",
    "Translating dreams to reality...",
    "Assembling photonic structures...",
    "Reticulating splines...",
];

const LoadingSpinner: React.FC = () => {
    const animatedText = useTypingAnimation(loadingPhrases, 80, 40, 2200);

    return (
        <div className="flex flex-col items-center justify-center space-y-6">
            <div className="w-24 h-24 relative cyber-loader">
                {/* Outer ring */}
                <div className="w-full h-full border-4 border-solid border-transparent border-t-cyan-400" style={{ animationDelay: '-0.45s' }}></div>
                {/* Middle ring */}
                <div className="w-[80%] h-[80%] top-[10%] left-[10%] border-4 border-solid border-transparent border-t-fuchsia-500" style={{ animationDelay: '-0.3s' }}></div>
                {/* Inner ring */}
                <div className="w-[60%] h-[60%] top-[20%] left-[20%] border-4 border-solid border-transparent border-t-blue-500" style={{ animationDelay: '-0.15s' }}></div>
                 {/* Dashed ring */}
                 <div className="w-[40%] h-[40%] top-[30%] left-[30%] border-4 border-dashed border-cyan-400" style={{ animationDelay: '0s' }}></div>
            </div>
            <div className="h-6 text-center">
                 <p className="font-orbitron text-lg neon-text text-cyan-300 tracking-widest">
                    {animatedText}
                    <span className="blinking-cursor">|</span>
                </p>
            </div>
        </div>
    );
};

export default LoadingSpinner;