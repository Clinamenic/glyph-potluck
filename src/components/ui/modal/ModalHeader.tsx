import React from 'react';

export interface ModalHeaderProps {
    title?: string;
    onClose?: () => void;
    showCloseButton?: boolean;
    children?: React.ReactNode;
    className?: string;
}

export function ModalHeader({
    title,
    onClose,
    showCloseButton = true,
    children,
    className = ''
}: ModalHeaderProps) {
    return (
        <div className={`modal-header ${className}`}>
            {title && <h2 className="modal-title">{title}</h2>}
            {children}
            {showCloseButton && onClose && (
                <button
                    onClick={onClose}
                    className="modal-close-button"
                    aria-label="Close modal"
                >
                    ×
                </button>
            )}
        </div>
    );
}
