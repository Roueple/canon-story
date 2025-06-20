'use client'

import { useState } from 'react'
import { FileText, FileSpreadsheet } from 'lucide-react'
import { Modal } from '@/components/shared/ui' // Corrected path
import { SingleDocxImporter } from './SingleDocxImporter'
import { BulkExcelImporter } from './BulkExcelImporter'

interface Props {
  isOpen: boolean;
  onClose: () => void;
  novelId: string;
  onImportComplete: () => void; // Renamed for clarity
}

export function ImportModal({ isOpen, onClose, novelId, onImportComplete }: Props) {
  const [mode, setMode] = useState<'single' | 'bulk' | null>(null);

  const handleModalClose = () => {
    setMode(null); // Reset mode when modal closes
    onClose();
  };
  
  const handleActualImportCompletion = () => {
    setMode(null); // Reset mode
    onImportComplete(); // Call the prop to refresh chapter list etc.
    // Optionally close modal here, or let ImportComplete handle it
    // onClose(); 
  };

  const handleCancelSubComponent = () => {
    setMode(null); // Go back to selection screen
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={mode ? (mode === 'single' ? "Import Single DOCX" : "Bulk Import from Excel") : "Choose Import Method"}
      size={mode ? "lg" : "md"} // Larger modal for importer views
    >
      {!mode ? (
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('single')}
            className="p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left flex flex-col items-center md:items-start"
          >
            <FileText className="h-10 w-10 text-primary mb-3" />
            <h3 className="text-md font-semibold text-white mb-1">Single DOCX Import</h3>
            <p className="text-xs text-gray-400">Import one chapter from a DOCX file. Preview and edit details before saving.</p>
          </button>
          
          <button
            onClick={() => setMode('bulk')}
            className="p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-left flex flex-col items-center md:items-start"
          >
            <FileSpreadsheet className="h-10 w-10 text-primary mb-3" />
            <h3 className="text-md font-semibold text-white mb-1">Bulk Excel Import</h3>
            <p className="text-xs text-gray-400">Import up to 50 chapters at once using our Excel template.</p>
          </button>
        </div>
      ) : mode === 'single' ? (
        <SingleDocxImporter
          novelId={novelId}
          onCancel={handleCancelSubComponent}
          // onComplete is handled by redirecting to chapter create/edit page
        />
      ) : (
        <BulkExcelImporter
          novelId={novelId}
          onComplete={handleActualImportCompletion} // This will refresh the chapter list
          onCancel={handleCancelSubComponent}
        />
      )}
    </Modal>
  );
}