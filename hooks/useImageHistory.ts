
import { useState, useCallback } from 'react';
import { ImageHistoryState } from '../types';

export const useImageHistory = (initialState: string[] = []) => {
    const [history, setHistory] = useState<ImageHistoryState>({
        history: initialState,
        currentIndex: initialState.length > 0 ? initialState.length - 1 : -1,
    });

    const addImage = useCallback((image: string) => {
        setHistory(prev => {
            const newHistory = prev.history.slice(0, prev.currentIndex + 1);
            newHistory.push(image);
            return {
                history: newHistory,
                currentIndex: newHistory.length - 1,
            };
        });
    }, []);

    const undo = useCallback(() => {
        setHistory(prev => ({
            ...prev,
            currentIndex: Math.max(0, prev.currentIndex - 1),
        }));
    }, []);

    const redo = useCallback(() => {
        setHistory(prev => ({
            ...prev,
            currentIndex: Math.min(prev.history.length - 1, prev.currentIndex + 1),
        }));
    }, []);

    const currentImage = history.history[history.currentIndex] ?? null;
    const canUndo = history.currentIndex > 0;
    const canRedo = history.currentIndex < history.history.length - 1;

    return { currentImage, addImage, undo, redo, canUndo, canRedo };
};
