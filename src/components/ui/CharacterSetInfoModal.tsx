import { Modal, ModalHeader, ModalBody } from './modal';
import { CharacterSet } from '../../data/character-sets';

export interface CharacterSetInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    characterSet: CharacterSet;
    uploadedCount: number;
    totalCount: number;
}

export function CharacterSetInfoModal({
    isOpen,
    onClose,
    characterSet,
    uploadedCount,
    totalCount
}: CharacterSetInfoModalProps) {
    const getProgressPercentage = () => {
        return totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <ModalHeader title="Character Set Information" onClose={onClose} />
            <ModalBody>
                <div className="export-info-list">
                    <div className="export-info-item">
                        <span className="export-info-label">Character Set:</span>
                        <span className="export-info-value">
                            {characterSet.name}
                        </span>
                    </div>
                    <div className="export-info-item">
                        <span className="export-info-label">Total Characters:</span>
                        <span className="export-info-value">
                            {totalCount} characters in this set
                        </span>
                    </div>
                    <div className="export-info-item">
                        <span className="export-info-label">Uploaded:</span>
                        <span className="export-info-value">
                            {uploadedCount} of {totalCount} characters uploaded ({getProgressPercentage()}%)
                        </span>
                    </div>
                    <div className="export-info-item">
                        <span className="export-info-label">Description:</span>
                        <span className="export-info-value">
                            {characterSet.description || 'Standard character set for font creation'}
                        </span>
                    </div>
                    <div className="export-info-item">
                        <span className="export-info-label">Categories:</span>
                        <span className="export-info-value">
                            Includes uppercase, lowercase, digits, punctuation, and symbols
                        </span>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
}
