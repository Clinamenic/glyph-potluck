import React from 'react';

export interface ModalFooterProps {
    children: React.ReactNode;
    className?: string;
    align?: 'left' | 'center' | 'right';
}

export function ModalFooter({
    children,
    className = '',
    align = 'right'
}: ModalFooterProps) {
    return (
        <div className={`modal-footer modal-footer--${align} ${className}`}>
            {children}
        </div>
    );
}
