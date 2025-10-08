import { useState, useCallback, useEffect } from 'react';
import { Modal } from './modal/Modal';
import { ModalHeader } from './modal/ModalHeader';
import { ModalBody } from './modal/ModalBody';
import { ModalFooter } from './modal/ModalFooter';
import { InteractiveSVGEditor } from './InteractiveSVGEditor';
import type { FontMetrics } from '../../services/font-generation/FontMetricsCalculator';

export interface PathEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    glyphId: string;
    initialPath: string;
    fontMetrics: FontMetrics;
    onPathChanged: (newPath: string) => void;
    character?: string;
    unicode?: string;
}

export function PathEditorModal({
    isOpen,
    onClose,
    glyphId,
    initialPath,
    fontMetrics,
    onPathChanged,
    character,
    unicode
}: PathEditorModalProps) {
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Reset state when modal opens with new glyph
    useEffect(() => {
        if (isOpen) {
            setCurrentPath(initialPath);
            setHasUnsavedChanges(false);
        }
    }, [isOpen, initialPath]);

    // Handle path changes from the editor
    const handlePathChange = useCallback((newPath: string) => {
        setCurrentPath(newPath);
        setHasUnsavedChanges(true);
    }, []);

    // Handle save changes
    const handleSaveChanges = useCallback(() => {
        if (hasUnsavedChanges) {
            onPathChanged(currentPath);
            setHasUnsavedChanges(false);
        }
        onClose();
    }, [hasUnsavedChanges, currentPath, onPathChanged, onClose]);

    // Handle discard changes
    const handleDiscardChanges = useCallback(() => {
        if (hasUnsavedChanges) {
            const confirmed = window.confirm(
                'You have unsaved changes. Are you sure you want to discard them?'
            );
            if (!confirmed) return;
        }
        setCurrentPath(initialPath);
        setHasUnsavedChanges(false);
        onClose();
    }, [hasUnsavedChanges, initialPath, onClose]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!isOpen) return;

            // Ctrl/Cmd + S to save
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault();
                handleSaveChanges();
            }

            // Escape to close (with confirmation if unsaved changes)
            if (event.key === 'Escape') {
                event.preventDefault();
                handleDiscardChanges();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleSaveChanges, handleDiscardChanges]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleDiscardChanges}
            size="xl"
            className="path-editor-modal"
            closeOnOverlayClick={false}
        >
            <ModalHeader className="path-editor-modal-header">
                <div className="path-editor-modal-header-content">
                    <div className="path-editor-character-info">
                        <h2 className="path-editor-character-title">
                            Edit Path: {character || 'Unknown Character'}
                        </h2>
                        <div className="path-editor-character-details">
                            <span className="path-editor-unicode">Unicode: {unicode || glyphId}</span>
                            {hasUnsavedChanges && (
                                <span className="path-editor-unsaved-indicator">• Unsaved changes</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="path-editor-modal-actions">
                    <button
                        onClick={handleDiscardChanges}
                        className="btn btn-secondary btn-sm"
                        title="Discard changes and close (Esc)"
                    >
                        {hasUnsavedChanges ? 'Cancel' : 'Close'}
                    </button>
                    <button
                        onClick={handleSaveChanges}
                        className="btn btn-primary btn-sm"
                        disabled={!hasUnsavedChanges}
                        title="Save changes and close (Ctrl+S)"
                    >
                        Save Changes
                    </button>
                </div>
            </ModalHeader>

            <ModalBody className="path-editor-modal-body">
                <div className="path-editor-layout">
                    {/* Sidebar with controls - placeholder for now */}
                    <div className="path-editor-sidebar">
                        <div className="path-editor-sidebar-section">
                            <h3 className="path-editor-sidebar-title">Font Metrics</h3>
                            <div className="path-editor-metrics-display">
                                <div className="path-editor-metric-item">
                                    <span className="path-editor-metric-label">Baseline:</span>
                                    <span className="path-editor-metric-value">Y = 0</span>
                                </div>
                                <div className="path-editor-metric-item">
                                    <span className="path-editor-metric-label">X-Height:</span>
                                    <span className="path-editor-metric-value">Y = {fontMetrics.xHeight}</span>
                                </div>
                                <div className="path-editor-metric-item">
                                    <span className="path-editor-metric-label">Cap Height:</span>
                                    <span className="path-editor-metric-value">Y = {fontMetrics.capHeight}</span>
                                </div>
                                <div className="path-editor-metric-item">
                                    <span className="path-editor-metric-label">Ascender:</span>
                                    <span className="path-editor-metric-value">Y = {fontMetrics.ascender}</span>
                                </div>
                                <div className="path-editor-metric-item">
                                    <span className="path-editor-metric-label">Descender:</span>
                                    <span className="path-editor-metric-value">Y = {fontMetrics.descender}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main canvas area */}
                    <div className="path-editor-canvas-container">
                        <InteractiveSVGEditor
                            glyphId={glyphId}
                            initialPath={currentPath}
                            onPathChanged={handlePathChange}
                            viewBox={{ width: 200, height: 200 }} // Match vectorization coordinate system
                            readOnly={false}
                            fontMetrics={fontMetrics}
                            className="path-editor-canvas"
                        />
                    </div>
                </div>
            </ModalBody>

            <ModalFooter className="path-editor-modal-footer">
                <div className="path-editor-footer-content">
                    <div className="path-editor-keyboard-hints">
                        <span className="path-editor-hint">Ctrl+S: Save • Esc: Close</span>
                    </div>
                    <div className="path-editor-footer-actions">
                        <button
                            onClick={handleDiscardChanges}
                            className="btn btn-secondary"
                        >
                            {hasUnsavedChanges ? 'Discard Changes' : 'Close'}
                        </button>
                        <button
                            onClick={handleSaveChanges}
                            className="btn btn-primary"
                            disabled={!hasUnsavedChanges}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </ModalFooter>
        </Modal>
    );
}
