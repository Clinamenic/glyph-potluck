
export interface InfoButtonProps {
    onClick: () => void;
    tooltip?: string;
    className?: string;
}

export function InfoButton({ onClick, tooltip = 'Quick Tips', className = '' }: InfoButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`info-button ${className}`}
            aria-label={tooltip}
            title={tooltip}
        >
            <span className="info-button-text">?</span>
        </button>
    );
}
