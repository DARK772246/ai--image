import React, { useState, useCallback, useEffect, useRef } from 'react';
import { EditMode, AspectRatio } from './types';
import { ASPECT_RATIOS } from './constants';
import { generateImageFromPrompt, editImageWithPrompt, upscaleImage, replaceFace } from './services/geminiService';
import { useImageHistory } from './hooks/useImageHistory';
import LoadingSpinner from './components/LoadingSpinner';
import { GenerateIcon, EditIcon, UploadIcon, DownloadIcon, UndoIcon, RedoIcon, UpscaleIcon, FaceSwapIcon, CloseIcon } from './components/Icons';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};


const App: React.FC = () => {
    const [mode, setMode] = useState<EditMode>(EditMode.Generate);
    const [prompt, setPrompt] = useState<string>('');
    const [editPrompt, setEditPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [promptHistory, setPromptHistory] = useState<string[]>([]);
    const [sourceFaceImage, setSourceFaceImage] = useState<string | null>(null);
    const [faceSwapResultImage, setFaceSwapResultImage] = useState<string | null>(null);
    const [isSplitViewActive, setIsSplitViewActive] = useState<boolean>(false);
    
    const { currentImage, addImage, undo, redo, canUndo, canRedo } = useImageHistory();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const faceInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        try {
            const storedHistory = localStorage.getItem('promptHistory');
            if (storedHistory) {
                setPromptHistory(JSON.parse(storedHistory));
            }
        } catch (e) {
            console.error("Failed to parse prompt history from localStorage", e);
        }
    }, []);

    const updatePromptHistory = (newPrompt: string) => {
        if (!newPrompt.trim()) return;
        setPromptHistory(prev => {
            const newHistory = [newPrompt, ...prev.filter(p => p !== newPrompt)].slice(0, 10);
            localStorage.setItem('promptHistory', JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const handleGenerate = async () => {
        if (!prompt) {
            setError("Please enter a prompt.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            updatePromptHistory(prompt);
            const imageUrl = await generateImageFromPrompt(prompt, aspectRatio);
            addImage(imageUrl);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleEdit = async () => {
        if (!editPrompt || !currentImage) {
            setError("Please upload an image and enter an edit prompt.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            updatePromptHistory(editPrompt);
            const imageUrl = await editImageWithPrompt(currentImage, editPrompt);
            addImage(imageUrl);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpscale = async () => {
        if (!currentImage) {
            setError("Please generate or upload an image first.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const imageUrl = await upscaleImage(currentImage);
            addImage(imageUrl);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred during upscaling.");
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFaceReplace = async () => {
        if (!currentImage || !sourceFaceImage) {
            setError("Please provide a target image and a source face image.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setIsSplitViewActive(true);
        setFaceSwapResultImage(null);
        try {
            const imageUrl = await replaceFace(currentImage, sourceFaceImage);
            setFaceSwapResultImage(imageUrl);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred during face replacement.");
            console.error(e);
            setIsSplitViewActive(false);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAcceptFaceSwap = () => {
        if (faceSwapResultImage) {
            addImage(faceSwapResultImage);
        }
        setFaceSwapResultImage(null);
        setIsSplitViewActive(false);
    };

    const handleDiscardFaceSwap = () => {
        setFaceSwapResultImage(null);
        setIsSplitViewActive(false);
    };


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsLoading(true);
            setError(null);
            try {
                const base64Image = await fileToBase64(file);
                addImage(base64Image);
                setMode(EditMode.Edit);
            } catch (e) {
                setError("Failed to load image.");
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const handleFaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsLoading(true);
            setError(null);
            try {
                const base64Image = await fileToBase64(file);
                setSourceFaceImage(base64Image);
            } catch (e) {
                setError("Failed to load face image.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleDownload = () => {
        if (currentImage) {
            const link = document.createElement('a');
            link.href = currentImage;
            link.download = `imaginify-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    
    const ControlButton = ({ icon, label, onClick, disabled = false, className = "" }: { icon?: React.ReactNode, label: string, onClick: () => void, disabled?: boolean, className?: string }) => (
        <button
            onClick={onClick}
            disabled={disabled || isLoading || isSplitViewActive}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold transition-all duration-300 ease-in-out transform hover:scale-105 btn-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none ${className}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    const HistoryButton = ({ icon, onClick, disabled }: { icon: React.ReactNode, onClick: () => void, disabled: boolean }) => (
        <button onClick={onClick} disabled={disabled || isLoading || isSplitViewActive} className="p-2 glass-card rounded-md text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
            {icon}
        </button>
    );

    const ControlPanel = () => (
        <div className="w-full lg:w-1/3 xl:w-1/4 h-full glass-card rounded-2xl p-6 flex flex-col space-y-6 overflow-y-auto">
            {/* Header */}
            <header className="text-center">
                <h1 className="text-3xl font-orbitron font-bold neon-text text-cyan-300">IMAGINIFY AI</h1>
                <p className="text-sm text-gray-400 mt-1">Your Imagination, Your Face, Your Art.</p>
            </header>
            
            {/* Mode Toggle */}
            <div className="flex bg-black/20 rounded-lg p-1">
                <button onClick={() => setMode(EditMode.Generate)} disabled={isSplitViewActive} className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${mode === EditMode.Generate ? 'bg-blue-500/50 text-white' : 'text-gray-400 hover:bg-white/5'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    Generate
                </button>
                <button onClick={() => setMode(EditMode.Edit)} disabled={isSplitViewActive} className={`flex-1 py-2 rounded-md text-sm font-bold transition-colors ${mode === EditMode.Edit ? 'bg-purple-500/50 text-white' : 'text-gray-400 hover:bg-white/5'} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    Edit & Reface
                </button>
            </div>
            
            {/* Main Controls */}
            {mode === EditMode.Generate ? (
                <div className="flex flex-col space-y-4">
                    <div className="relative floating-label-group">
                        <textarea 
                            id="generate-prompt"
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)} 
                            placeholder=" "
                            rows={4} 
                            disabled={isSplitViewActive}
                            className="w-full p-3 bg-black/30 rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all floating-input disabled:opacity-50" />
                        <label htmlFor="generate-prompt" className="floating-label">A futuristic city at night...</label>
                    </div>
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} disabled={isSplitViewActive} className="w-full p-3 bg-black/30 rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none disabled:opacity-50">
                        {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ControlButton icon={<GenerateIcon className="w-5 h-5"/>} label="Generate" onClick={handleGenerate} />
                </div>
            ) : (
                <div className="flex flex-col space-y-4">
                    <button onClick={() => fileInputRef.current?.click()} disabled={isSplitViewActive} className="w-full flex items-center justify-center space-x-2 p-3 bg-black/30 rounded-lg border-2 border-dashed border-white/20 hover:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <UploadIcon className="w-5 h-5"/>
                        <span>{currentImage ? "Change Target Image" : "Upload Target Image"}</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden"/>
                    <div className="relative floating-label-group">
                        <textarea 
                            id="edit-prompt"
                            value={editPrompt} 
                            onChange={(e) => setEditPrompt(e.target.value)} 
                            placeholder=" "
                            rows={3} 
                            disabled={isSplitViewActive}
                            className="w-full p-3 bg-black/30 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all floating-input floating-input-edit disabled:opacity-50" />
                        <label htmlFor="edit-prompt" className="floating-label">Add a mountain in the background...</label>
                    </div>
                    <ControlButton icon={<EditIcon className="w-5 h-5"/>} label="Apply Edit" onClick={handleEdit} disabled={!currentImage}/>

                    {/* Face Replace Section */}
                    <div className="pt-4 border-t border-white/10 space-y-3">
                        <h3 className="text-sm font-bold text-gray-400 tracking-wider text-center">FACE REPLACEMENT</h3>
                        <div className="flex items-center space-x-4">
                            <div className="relative flex-shrink-0">
                                <button onClick={() => faceInputRef.current?.click()} disabled={isSplitViewActive} className="w-20 h-20 bg-black/30 rounded-lg border-2 border-dashed border-white/20 hover:border-fuchsia-500 transition-colors flex items-center justify-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed">
                                    {sourceFaceImage ? <img src={sourceFaceImage} alt="Source Face" className="w-full h-full object-cover" /> : <FaceSwapIcon className="w-8 h-8 text-gray-500"/>}
                                </button>
                                {sourceFaceImage && (
                                    <button 
                                        onClick={() => setSourceFaceImage(null)} 
                                        disabled={isSplitViewActive}
                                        className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Remove source face"
                                    >
                                        <CloseIcon className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <input type="file" ref={faceInputRef} onChange={handleFaceUpload} accept="image/*" className="hidden"/>
                            <div className="flex-grow">
                                <p className="text-xs text-gray-400 mb-1">Upload a clear portrait photo to use as the source face.</p>
                                <p className="text-xs text-gray-500">Your images are processed securely and are not stored.</p>
                            </div>
                        </div>
                         <ControlButton icon={<FaceSwapIcon className="w-5 h-5"/>} label="Replace Face" onClick={handleFaceReplace} disabled={!currentImage || !sourceFaceImage}/>
                    </div>

                </div>
            )}
            
            {/* History & Download */}
            <div className="flex items-center space-x-2 pt-4 border-t border-white/10">
                <div className="flex-1 flex space-x-2">
                    <HistoryButton icon={<UndoIcon className="w-5 h-5"/>} onClick={undo} disabled={!canUndo} />
                    <HistoryButton icon={<RedoIcon className="w-5 h-5"/>} onClick={redo} disabled={!canRedo} />
                </div>
                <ControlButton icon={<UpscaleIcon className="w-5 h-5"/>} label="Upscale" onClick={handleUpscale} disabled={!currentImage}/>
                <ControlButton icon={<DownloadIcon className="w-5 h-5"/>} label="Download" onClick={handleDownload} disabled={!currentImage}/>
            </div>
            
            {/* Prompt History */}
            <div className="flex-grow flex flex-col space-y-2 overflow-hidden">
                <h3 className="text-sm font-bold text-gray-400 tracking-wider">PROMPT HISTORY</h3>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                    {promptHistory.length > 0 ? promptHistory.map((p, i) => (
                        <button key={i} onClick={() => { mode === EditMode.Generate ? setPrompt(p) : setEditPrompt(p) }} disabled={isSplitViewActive} className="w-full text-left text-xs p-2 bg-black/20 rounded-md truncate hover:bg-white/10 transition-colors disabled:opacity-50">
                            {p}
                        </button>
                    )) : <p className="text-xs text-gray-500 italic">No prompts yet.</p>}
                </div>
            </div>

            {error && <div className="text-sm text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-500/50">{error}</div>}
        </div>
    );
    
    const ImageCanvas = () => (
        <div className="w-full lg:w-2/3 xl:w-3/4 h-full flex items-center justify-center p-6">
            <div className="w-full h-full glass-card rounded-2xl flex items-center justify-center relative overflow-hidden">
                {isSplitViewActive ? (
                    <>
                        <div className="flex w-full h-full">
                            <div className="w-1/2 h-full flex flex-col items-center justify-center p-4 border-r border-white/10">
                                <img src={currentImage} alt="Original" className="max-w-full max-h-full object-contain" />
                                <p className="font-orbitron text-lg mt-2 text-gray-400">BEFORE</p>
                            </div>
                            <div className="w-1/2 h-full flex flex-col items-center justify-center p-4 relative">
                                {isLoading ? (
                                    <LoadingSpinner />
                                ) : faceSwapResultImage ? (
                                    <img src={faceSwapResultImage} alt="Face Swap Result" className="max-w-full max-h-full object-contain" />
                                ) : null}
                                <p className="font-orbitron text-lg mt-2 text-cyan-300">AFTER</p>
                            </div>
                        </div>
                        {!isLoading && faceSwapResultImage && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-4">
                                <ControlButton onClick={handleAcceptFaceSwap} label="Accept" className="from-green-500 to-emerald-600"/>
                                <ControlButton onClick={handleDiscardFaceSwap} label="Discard" className="from-red-500 to-rose-600"/>
                            </div>
                        )}
                    </>
                ) : isLoading ? (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <LoadingSpinner />
                    </div>
                ) : currentImage ? (
                    <img src={currentImage} alt="Generated or edited art" className="max-w-full max-h-full object-contain" />
                ) : (
                    <div className="text-center text-gray-500">
                        <div className="w-24 h-24 border-4 border-dashed border-white/20 rounded-full mx-auto animate-pulse flex items-center justify-center">
                            <GenerateIcon className="w-10 h-10 text-white/20" />
                        </div>
                        <p className="mt-4 font-orbitron text-xl">Your Imagination Awaits</p>
                        <p className="text-sm">Generate an image or upload one to begin.</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="w-screen h-screen bg-black/50 p-4 lg:p-6 flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
            <div 
                className="absolute inset-0 bg-grid-pattern opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(77, 145, 255, 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(77, 145, 255, 0.5) 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}
            />
            <ControlPanel />
            <ImageCanvas />
        </div>
    );
};

export default App;