import React from 'react';

export interface ModalBodyProps {
    children: React.ReactNode;
    className?: string;
    scrollable?: boolean;
}

export function ModalBody({
    children,
    className = '',
    scrollable = true
}: ModalBodyProps) {
    return (
        <div className={`modal-body ${scrollable ? 'modal-body--scrollable' : ''} ${className}`}>
            {children}
        </div>
    );
}
