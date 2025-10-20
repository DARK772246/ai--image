import React, { useState, useRef, useEffect } from 'react';
import { AspectRatio } from '../types';
import { ASPECT_RATIOS } from '../constants';
import { useTypingAnimation } from '../hooks/useTypingAnimation';
import { GenerateIcon, UploadIcon } from './Icons';

interface PromptPageProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (ratio: AspectRatio) => void;
    isLoading: boolean;
    handleGenerate: () => void;
    handleFileUpload: (file: File) => void;
}

const placeholderPrompts = [
    "A futuristic city at night, neon lights reflecting on wet streets...",
    "A majestic lion with a crown made of starlight, on a cosmic throne...",
    "An enchanted forest library where books fly like birds...",
    "A steampunk robot painting a masterpiece in a victorian studio...",
    "The lost city of Atlantis, reimagined as a bio-luminescent metropolis...",
];

const PromptPage: React.FC<PromptPageProps> = ({
    prompt,
    setPrompt,
    aspectRatio,
    setAspectRatio,
    isLoading,
    handleGenerate,
    handleFileUpload,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const animatedPlaceholder = useTypingAnimation(placeholderPrompts);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileUpload(file);
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl text-center">
                <h1 className="text-5xl md:text-6xl font-orbitron font-bold neon-text text-cyan-300 mb-4">
                    IMAGINIFY AI
                </h1>
                <p className="text-lg text-gray-400 mb-12">
                    Turn your words into extraordinary images. Describe your vision and let our AI bring it to life.
                </p>

                <div className="relative w-full mb-6">
                    <textarea
                        id="generate-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder=""
                        rows={3}
                        disabled={isLoading}
                        className="w-full p-4 bg-black/30 rounded-lg border-2 border-white/20 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all text-lg resize-none disabled:opacity-50"
                    />
                    {!prompt && !isFocused && (
                        <div className="absolute top-4 left-4 text-lg text-gray-500 pointer-events-none">
                            {animatedPlaceholder}
                            <span className="blinking-cursor">|</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="glass-card p-4 rounded-lg">
                        <label htmlFor="aspect-ratio" className="block text-sm font-bold text-gray-300 mb-2">ASPECT RATIO</label>
                        <select
                            id="aspect-ratio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            disabled={isLoading}
                            className="w-full p-3 bg-black/30 rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none disabled:opacity-50"
                        >
                            {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>

                    <div className="glass-card p-4 rounded-lg flex flex-col justify-center">
                        <label className="block text-sm font-bold text-gray-300 mb-2">OR UPLOAD AN IMAGE</label>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center space-x-2 p-3 bg-black/30 rounded-lg border-2 border-dashed border-white/20 hover:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <UploadIcon className="w-5 h-5" />
                            <span>Upload to Edit & Reface</span>
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                </div>


                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt}
                    className="w-full flex items-center justify-center space-x-3 px-8 py-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-xl transition-all duration-300 ease-in-out transform hover:scale-105 btn-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                    <GenerateIcon className="w-7 h-7" />
                    <span>{isLoading ? 'IMAGINING...' : 'GENERATE'}</span>
                </button>
            </div>
        </div>
    );
};

export default PromptPage;
