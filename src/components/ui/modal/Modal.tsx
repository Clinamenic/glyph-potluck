import React, { useEffect, useRef } from 'react';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closeOnOverlayClick?: boolean;
    className?: string;
}

export function Modal({
    isOpen,
    onClose,
    children,
    size = 'md',
    closeOnOverlayClick = true,
    className = ''
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Focus management
    useEffect(() => {
        if (isOpen && modalRef.current) {
            modalRef.current.focus();
        }
    }, [isOpen]);

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={`modal-overlay ${className}`}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
        >
            <div
                ref={modalRef}
                className={`modal-container modal-container--${size}`}
                tabIndex={-1}
            >
                {children}
            </div>
        </div>
    );
}
