import { Modal, ModalHeader, ModalBody } from './modal';

export interface QuickTipsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QuickTipsModal({ isOpen, onClose }: QuickTipsModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalHeader title="Welcome to Glyph Potluck" onClose={onClose} />
            <ModalBody>
                <div className="welcome-content">
                    <p className="welcome-description">
                        Glyph Potluck turns your hand-drawn letters into beautiful custom fonts.
                        Upload images of characters, let our AI vectorize them automatically,
                        then generate and export professional fonts for use in design software.
                    </p>

                    <div className="tips-section">
                        <h4 className="tips-heading">Quick Tips</h4>
                        <ul className="tips-list">
                            <li>Upload clear, high-contrast images for best results</li>
                            <li>PNG format with transparent backgrounds works best</li>
                            <li>Characters are automatically vectorized after upload</li>
                            <li>Click any uploaded character to view and edit its vector</li>
                            <li>Include at least A, a, 0, and space for functional fonts</li>
                            <li>Configure font settings before generating your font</li>
                            <li>Export in TTF or OTF format for design software</li>
                        </ul>
                    </div>
                </div>
            </ModalBody>
        </Modal>
    );
}
