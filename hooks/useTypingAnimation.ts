import { useState, useEffect, useRef } from 'react';

export const useTypingAnimation = (phrases: string[], typingSpeed = 100, deletingSpeed = 50, delay = 2000) => {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const handleTyping = () => {
            const i = loopNum % phrases.length;
            const fullText = phrases[i];

            if (isDeleting) {
                setText(prev => prev.substring(0, prev.length - 1));
            } else {
                setText(prev => fullText.substring(0, prev.length + 1));
            }

            if (!isDeleting && text === fullText) {
                timeoutRef.current = window.setTimeout(() => setIsDeleting(true), delay);
            } else if (isDeleting && text === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
            }
        };

        const speed = isDeleting ? deletingSpeed : typingSpeed;
        timeoutRef.current = window.setTimeout(handleTyping, speed);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [text, isDeleting, loopNum, phrases, typingSpeed, deletingSpeed, delay]);

    return text;
};
