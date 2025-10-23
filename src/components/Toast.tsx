import React, { useEffect } from 'https://aistudiocdn.com/react@^19.2.0';

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Disappears after 3 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            {message}
            <button onClick={onClose} className="toast-close-btn">&times;</button>
        </div>
    );
};

export default Toast;