import React, { useRef } from 'react';
import { EditMode, AspectRatio } from '../types';
import { ART_STYLES } from '../constants';
import LoadingSpinner from './LoadingSpinner';
import { GenerateIcon, EditIcon, UploadIcon, DownloadIcon, UndoIcon, RedoIcon, UpscaleIcon, FaceSwapIcon, CloseIcon, StyleIcon, BackIcon } from './Icons';

interface ResultPageProps {
    mode: EditMode;
    setMode: (mode: EditMode) => void;
    editPrompt: string;
    setEditPrompt: (prompt: string) => void;
    isLoading: boolean;
    error: string | null;
    promptHistory: string[];
    sourceFaceImage: string | null;
    setSourceFaceImage: (image: string | null) => void;
    faceSwapResultImage: string | null;
    isSplitViewActive: boolean;
    selectedStyle: string;
    setSelectedStyle: (style: string) => void;
    currentImage: string | null;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    handleEdit: () => void;
    handleUpscale: () => void;
    handleStyleTransfer: () => void;
    handleFaceReplace: () => void;
    handleAcceptFaceSwap: () => void;
    handleDiscardFaceSwap: () => void;
    handleFileUpload: (file: File) => void;
    handleFaceUpload: (file: File) => void;
    handleGoToPrompt: () => void;
}

const ResultPage: React.FC<ResultPageProps> = (props) => {
    const {
        mode, setMode, editPrompt, setEditPrompt, isLoading, error, promptHistory,
        sourceFaceImage, setSourceFaceImage, faceSwapResultImage, isSplitViewActive,
        selectedStyle, setSelectedStyle, currentImage, canUndo, canRedo, undo, redo,
        handleEdit, handleUpscale, handleStyleTransfer, handleFaceReplace,
        handleAcceptFaceSwap, handleDiscardFaceSwap, handleFileUpload, handleFaceUpload,
        handleGoToPrompt
    } = props;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const faceInputRef = useRef<HTMLInputElement>(null);

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
    
    const ImageCanvas = () => (
        <div className="w-full h-full flex items-center justify-center p-6">
            <div className="w-full h-full glass-card rounded-2xl flex items-center justify-center relative overflow-hidden">
                {isSplitViewActive ? (
                    <>
                        <div className="flex w-full h-full">
                            <div className="w-1/2 h-full flex flex-col items-center justify-center p-4 border-r border-white/10">
                                <img src={currentImage!} alt="Original" className="max-w-full max-h-full object-contain" />
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
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <LoadingSpinner />
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="w-full h-full p-4 lg:p-6 flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="w-full lg:w-[450px] h-full glass-card rounded-2xl p-6 flex flex-col space-y-6 overflow-y-auto">
                <header className="flex items-center justify-between">
                    <button onClick={handleGoToPrompt} className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                        <BackIcon className="w-6 h-6" />
                        <span className="font-bold">Create New</span>
                    </button>
                    <h1 className="text-xl font-orbitron font-bold neon-text text-cyan-300">EDIT & REFINE</h1>
                </header>
                
                <div className="flex flex-col space-y-4">
                    <button onClick={() => fileInputRef.current?.click()} disabled={isSplitViewActive || isLoading} className="w-full flex items-center justify-center space-x-2 p-3 bg-black/30 rounded-lg border-2 border-dashed border-white/20 hover:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        <UploadIcon className="w-5 h-5"/>
                        <span>{currentImage ? "Change Target Image" : "Upload Target Image"}</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])} accept="image/*" className="hidden"/>
                    
                    <div className="relative floating-label-group">
                        <textarea 
                            id="edit-prompt"
                            value={editPrompt} 
                            onChange={(e) => setEditPrompt(e.target.value)} 
                            placeholder=" "
                            rows={3} 
                            disabled={isSplitViewActive || isLoading}
                            className="w-full p-3 bg-black/30 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all floating-input floating-input-edit disabled:opacity-50" />
                        <label htmlFor="edit-prompt" className="floating-label">Add a mountain in the background...</label>
                    </div>
                    <ControlButton icon={<EditIcon className="w-5 h-5"/>} label="Apply Edit" onClick={handleEdit} disabled={!currentImage}/>
                    
                    <div className="pt-4 border-t border-white/10 space-y-3">
                        <h3 className="text-sm font-bold text-gray-400 tracking-wider text-center">STYLE TRANSFER</h3>
                        <select 
                            value={selectedStyle} 
                            onChange={(e) => setSelectedStyle(e.target.value)} 
                            disabled={isSplitViewActive || isLoading} 
                            className="w-full p-3 bg-black/30 rounded-lg border border-white/20 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all appearance-none disabled:opacity-50"
                        >
                            {ART_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                        </select>
                        <ControlButton icon={<StyleIcon className="w-5 h-5"/>} label="Apply Style" onClick={handleStyleTransfer} disabled={!currentImage}/>
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-3">
                        <h3 className="text-sm font-bold text-gray-400 tracking-wider text-center">FACE REPLACEMENT</h3>
                        <div className="flex items-center space-x-4">
                            <div className="relative flex-shrink-0">
                                <button onClick={() => faceInputRef.current?.click()} disabled={isSplitViewActive || isLoading} className="w-20 h-20 bg-black/30 rounded-lg border-2 border-dashed border-white/20 hover:border-fuchsia-500 transition-colors flex items-center justify-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed">
                                    {sourceFaceImage ? <img src={sourceFaceImage} alt="Source Face" className="w-full h-full object-cover" /> : <FaceSwapIcon className="w-8 h-8 text-gray-500"/>}
                                </button>
                                {sourceFaceImage && (
                                    <button 
                                        onClick={() => setSourceFaceImage(null)} 
                                        disabled={isSplitViewActive || isLoading}
                                        className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Remove source face"
                                    >
                                        <CloseIcon className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                            <input type="file" ref={faceInputRef} onChange={(e) => e.target.files && handleFaceUpload(e.target.files[0])} accept="image/*" className="hidden"/>
                            <div className="flex-grow">
                                <p className="text-xs text-gray-400 mb-1">Upload a clear portrait photo to use as the source face.</p>
                            </div>
                        </div>
                         <ControlButton icon={<FaceSwapIcon className="w-5 h-5"/>} label="Replace Face" onClick={handleFaceReplace} disabled={!currentImage || !sourceFaceImage}/>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-4 border-t border-white/10">
                    <div className="flex-1 flex space-x-2">
                        <HistoryButton icon={<UndoIcon className="w-5 h-5"/>} onClick={undo} disabled={!canUndo} />
                        <HistoryButton icon={<RedoIcon className="w-5 h-5"/>} onClick={redo} disabled={!canRedo} />
                    </div>
                    <ControlButton icon={<UpscaleIcon className="w-5 h-5"/>} label="Upscale" onClick={handleUpscale} disabled={!currentImage}/>
                    <ControlButton icon={<DownloadIcon className="w-5 h-5"/>} label="Download" onClick={handleDownload} disabled={!currentImage}/>
                </div>
                
                {error && <div className="text-sm text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-500/50">{error}</div>}
            </div>
            
            <div className="w-full h-full flex-grow">
                <ImageCanvas />
            </div>
        </div>
    );
};

export default ResultPage;
