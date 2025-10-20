import React, { useState, useCallback, useEffect, useRef } from 'react';
import { EditMode, AspectRatio } from './types';
import { ASPECT_RATIOS, ART_STYLES } from './constants';
import { generateImageFromPrompt, editImageWithPrompt, upscaleImage, replaceFace, applyStyleTransfer } from './services/geminiService';
import { useImageHistory } from './hooks/useImageHistory';
import PromptPage from './components/PromptPage';
import ResultPage from './components/ResultPage';

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
    const [page, setPage] = useState<'prompt' | 'result'>('prompt');
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
    const [selectedStyle, setSelectedStyle] = useState<string>(ART_STYLES[0]);
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg'>('png');
    
    const { currentImage, addImage, undo, redo, canUndo, canRedo } = useImageHistory();

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
    
    const handleGoToPrompt = () => {
        setPage('prompt');
        // Reset state for new creation
        setPrompt('');
        setEditPrompt('');
        setSourceFaceImage(null);
        setError(null);
    }

    const handleGenerate = async () => {
        if (!prompt) {
            setError("Please enter a prompt.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setPage('result');
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

    const handleStyleTransfer = async () => {
        if (!currentImage || !selectedStyle) {
            setError("Please select an image and a style.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const imageUrl = await applyStyleTransfer(currentImage, selectedStyle);
            addImage(imageUrl);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred during style transfer.");
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

    const handleFileUpload = async (file: File) => {
        if (file) {
            setIsLoading(true);
            setError(null);
            setPage('result');
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
    
    const handleFaceUpload = async (file: File) => {
        if (file) {
            setIsLoading(true); // Maybe use a different loading state for this small upload
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

    return (
        <div className="w-screen h-screen bg-black/50 relative">
            <div 
                className="absolute inset-0 bg-grid-pattern opacity-10"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(77, 145, 255, 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(77, 145, 255, 0.5) 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}
            />
            <main className="w-full h-full">
              {page === 'prompt' ? (
                  <PromptPage
                      prompt={prompt}
                      setPrompt={setPrompt}
                      aspectRatio={aspectRatio}
                      setAspectRatio={setAspectRatio}
                      isLoading={isLoading}
                      handleGenerate={handleGenerate}
                      handleFileUpload={handleFileUpload}
                  />
              ) : (
                  <ResultPage
                      mode={mode}
                      setMode={setMode}
                      editPrompt={editPrompt}
                      setEditPrompt={setEditPrompt}
                      isLoading={isLoading}
                      error={error}
                      promptHistory={promptHistory}
                      sourceFaceImage={sourceFaceImage}
                      setSourceFaceImage={setSourceFaceImage}
                      faceSwapResultImage={faceSwapResultImage}
                      isSplitViewActive={isSplitViewActive}
                      selectedStyle={selectedStyle}
                      setSelectedStyle={setSelectedStyle}
                      downloadFormat={downloadFormat}
                      setDownloadFormat={setDownloadFormat}
                      currentImage={currentImage}
                      canUndo={canUndo}
                      canRedo={canRedo}
                      undo={undo}
                      redo={redo}
                      handleEdit={handleEdit}
                      handleUpscale={handleUpscale}
                      handleStyleTransfer={handleStyleTransfer}
                      handleFaceReplace={handleFaceReplace}
                      handleAcceptFaceSwap={handleAcceptFaceSwap}
                      handleDiscardFaceSwap={handleDiscardFaceSwap}
                      handleFileUpload={handleFileUpload}
                      handleFaceUpload={handleFaceUpload}
                      handleGoToPrompt={handleGoToPrompt}
                  />
              )}
            </main>
        </div>
    );
};

export default App;