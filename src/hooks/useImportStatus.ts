// src/hooks/useImportStatus.ts
import { useState, useEffect } from 'react';

interface ImportStatus {
  id: string;
  status: string;
  progress: number;
  errorMessage?: string;
  chaptersCreated?: number;
  imagesExtracted?: number;
}

export function useImportStatus(importId: string | null) {
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!importId) return;

    const checkStatus = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/import/status/${importId}`);
        const result = await response.json();
        
        if (result.success) {
          setStatus(result.data);
          
          // Continue polling if still processing
          if (result.data.status === 'processing') {
            setTimeout(checkStatus, 2000);
          }
        }
      } catch (error) {
        console.error('Error checking import status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [importId]);

  return { status, loading };
}