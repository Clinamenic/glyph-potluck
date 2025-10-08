import { Modal, ModalHeader, ModalBody } from './modal';
import { CompiledFont } from '../../types';
import { FontExportService } from '../../services/font-generation';

export interface ExportInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    compiledFont: CompiledFont | null;
    exportFormat: 'ttf' | 'otf';
    includeMetadata: boolean;
}

export function ExportInfoModal({
    isOpen,
    onClose,
    compiledFont,
    exportFormat,
    includeMetadata
}: ExportInfoModalProps) {
    const getFileSize = () => {
        if (!compiledFont) return '0 KB';
        return FontExportService.formatFileSize(compiledFont.size);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <ModalHeader title="Export Information" onClose={onClose} />
            <ModalBody>
                {!compiledFont ? (
                    <div className="export-info-list">
                        <div className="export-info-item">
                            <span className="export-info-label">Status:</span>
                            <span className="export-info-value">
                                No font has been generated yet. Please generate a font first to see export information.
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="export-info-list">
                        <div className="export-info-item">
                            <span className="export-info-label">Format:</span>
                            <span className="export-info-value">
                                Font will be downloaded in {exportFormat.toUpperCase()} format
                            </span>
                        </div>
                        <div className="export-info-item">
                            <span className="export-info-label">File Size:</span>
                            <span className="export-info-value">
                                Approximately {getFileSize()}
                            </span>
                        </div>
                        <div className="export-info-item">
                            <span className="export-info-label">Glyphs:</span>
                            <span className="export-info-value">
                                Contains {compiledFont.glyphCount} glyphs
                            </span>
                        </div>
                        <div className="export-info-item">
                            <span className="export-info-label">Generated:</span>
                            <span className="export-info-value">
                                {compiledFont.generatedAt.toLocaleString()}
                            </span>
                        </div>
                        <div className="export-info-item">
                            <span className="export-info-label">Metadata:</span>
                            <span className="export-info-value">
                                {includeMetadata ? 'Will be included in download' : 'Not included in download'}
                            </span>
                        </div>
                    </div>
                )}
            </ModalBody>
        </Modal>
    );
}
