import { useState, useRef } from 'react';
import { attachmentsApi } from '../api/attachments';
import { useToastStore } from '../store/toast';
import type { Attachment } from '../types';

interface AttachmentUploadProps {
  ticketId: number;
  onUploadSuccess?: (attachment: Attachment) => void;
  onDeleteSuccess?: (attachmentId: number) => void;
  existingAttachments?: Attachment[];
  showExisting?: boolean;
}

export const AttachmentUpload = ({
  ticketId,
  onUploadSuccess,
  onDeleteSuccess,
  existingAttachments = [],
  showExisting = true,
}: AttachmentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>(existingAttachments);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToastStore();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      await uploadFile(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      const attachment = await attachmentsApi.uploadAttachment(ticketId, file);
      setAttachments((prev) => [...prev, attachment]);
      showToast('File uploaded successfully', 'success');
      onUploadSuccess?.(attachment);
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to upload file';
      showToast(errorMessage, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      setDeleting(attachmentId);
      await attachmentsApi.deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      showToast('Attachment deleted successfully', 'success');
      onDeleteSuccess?.(attachmentId);
    } catch (error: any) {
      console.error('Failed to delete attachment:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete attachment';
      showToast(errorMessage, 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const blob = await attachmentsApi.downloadAttachment(attachment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Failed to download attachment:', error);
      showToast('Failed to download file', 'error');
    }
  };

  const handleView = async (attachment: Attachment) => {
    try {
      // For images, download as blob and show in modal
      if (attachment.content_type?.startsWith('image/')) {
        try {
          const blob = await attachmentsApi.downloadAttachment(attachment.id);
          const blobUrl = window.URL.createObjectURL(blob);
          setViewingAttachment(attachment);
          setViewUrl(blobUrl);
        } catch (error) {
          console.error('Failed to load image:', error);
          showToast('Failed to load image', 'error');
        }
      } 
      // For PDFs, videos, and other files, open in new tab
      else {
        try {
          const blob = await attachmentsApi.downloadAttachment(attachment.id);
          const blobUrl = window.URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          // Clean up after a delay to allow the browser to load the blob
          setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        } catch (error) {
          console.error('Failed to view file:', error);
          showToast('Failed to view file', 'error');
        }
      }
    } catch (error: any) {
      console.error('Failed to view attachment:', error);
      showToast('Failed to view file', 'error');
    }
  };

  const closeViewModal = () => {
    if (viewUrl && viewUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(viewUrl);
    }
    setViewingAttachment(null);
    setViewUrl(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (contentType.startsWith('video/')) {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (contentType === 'application/pdf') {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Attachments
        </label>
        <label className="cursor-pointer inline-flex items-center px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {uploading ? 'Uploading...' : 'Add Files'}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {showExisting && attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {getFileIcon(attachment.content_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {attachment.original_filename}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleView(attachment)}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200"
                  title="View"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDownload(attachment)}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200"
                  title="Download"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(attachment.id)}
                  disabled={deleting === attachment.id}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors duration-200 disabled:opacity-50"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showExisting && attachments.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No attachments yet
        </p>
      )}

      {/* Image View Modal */}
      {viewingAttachment && viewUrl && viewingAttachment.content_type.startsWith('image/') && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={closeViewModal}
        >
          <div 
            className="relative max-w-7xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {viewingAttachment.original_filename}
              </h3>
              <button
                onClick={closeViewModal}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <img
                src={viewUrl}
                alt={viewingAttachment.original_filename}
                className="max-w-full max-h-[calc(90vh-120px)] mx-auto rounded-lg"
                onError={() => {
                  showToast('Failed to load image', 'error');
                  closeViewModal();
                }}
              />
            </div>
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(viewingAttachment.file_size)}
              </span>
              <button
                onClick={() => handleDownload(viewingAttachment)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

