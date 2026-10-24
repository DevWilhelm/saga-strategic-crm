import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useUploadPhoto } from '../hooks/useUsers';

interface ProfilePhotoDialogProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onSuccess: (photoUrl: string) => void;
}

export const ProfilePhotoDialog: React.FC<ProfilePhotoDialogProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onSuccess,
}) => {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const uploadMutation = useUploadPhoto();

  // Load the image into an HTMLImageElement for live preview canvas rendering
  useEffect(() => {
    if (!imageSrc) {
      loadedImageRef.current = null;
      return;
    }

    const img = new Image();
    img.onload = () => {
      loadedImageRef.current = img;
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Live square preview update on crop completion
  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);

    if (loadedImageRef.current && previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(
          loadedImageRef.current,
          pixels.x,
          pixels.y,
          pixels.width,
          pixels.height,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }
    }
  }, []);

  const handleClose = useCallback(() => {
    if (uploadMutation.isPending) return;
    setErrorMessage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  }, [uploadMutation.isPending, onClose]);

  // Keyboard navigation: Escape key closes the dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !uploadMutation.isPending) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, uploadMutation.isPending, handleClose]);

  const handleSavePhoto = async () => {
    if (!imageSrc || !croppedAreaPixels || !loadedImageRef.current) return;
    setErrorMessage(null);

    try {
      // Render 512x512 JPEG with quality 0.85 onto an export canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 512;
      exportCanvas.height = 512;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D rendering context not available');
      }

      ctx.drawImage(
        loadedImageRef.current,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        512,
        512
      );

      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, 'image/jpeg', 0.85);
      });

      if (!blob) {
        throw new Error('Failed to generate image file from crop area');
      }

      const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
      const response = await uploadMutation.mutateAsync(file);

      // Clean up and close
      handleClose();
      onSuccess(response.photoUrl);
    } catch (err: unknown) {
      const errorObj = err as {
        response?: {
          data?: {
            message?: string;
            errors?: Array<{ field: string; message: string }>;
          };
        };
        message?: string;
      };

      const responseData = errorObj.response?.data;
      const msg =
        responseData?.errors?.[0]?.message ||
        responseData?.message ||
        errorObj.message ||
        'Failed to upload profile photo. Please try again.';

      setErrorMessage(msg);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="fixed inset-0" onClick={handleClose} aria-hidden="true" />

      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
        className="relative z-10 w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <h3 id="crop-dialog-title" className="text-lg font-bold text-[var(--text)]">
              Crop profile photo
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Drag to position and use the zoom slider to adjust the 1:1 square crop.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={uploadMutation.isPending}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner with Retry */}
        {errorMessage && (
          <div
            style={{
              backgroundColor: 'var(--status-overdue-bg)',
              color: 'var(--status-overdue-text)',
              borderColor: 'var(--border)',
            }}
            className="flex items-center justify-between rounded-lg border p-3 text-xs font-semibold gap-3"
            role="alert"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={handleSavePhoto}
              disabled={uploadMutation.isPending}
              style={{
                backgroundColor: 'var(--status-overdue-text)',
                color: '#ffffff',
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Crop Area Container */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden rounded-xl bg-slate-900 shadow-inner">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={true}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* Controls: Zoom slider and Live Square Preview */}
        <div className="flex items-center gap-4 pt-1">
          {/* Zoom Slider */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-semibold">
              <span className="flex items-center gap-1">
                <ZoomOut className="w-3.5 h-3.5" />
                Zoom
              </span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <ZoomOut className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                disabled={uploadMutation.isPending}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[var(--btn-primary)] cursor-pointer"
                aria-label="Image zoom slider"
              />
              <ZoomIn className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
            </div>
          </div>

          {/* Live Square Preview */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">
              Preview
            </span>
            <div
              style={{ borderColor: 'var(--border)' }}
              className="w-14 h-14 rounded-xl border overflow-hidden shadow-xs bg-slate-100 flex items-center justify-center"
            >
              <canvas
                ref={previewCanvasRef}
                width={56}
                height={56}
                className="w-full h-full object-cover"
                role="img"
                aria-label="Live square crop preview"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploadMutation.isPending}
            style={{
              backgroundColor: 'var(--btn-secondary-bg)',
              borderColor: 'var(--btn-secondary-border)',
              color: 'var(--btn-secondary-text)',
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold border hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSavePhoto}
            disabled={uploadMutation.isPending || !croppedAreaPixels}
            style={{
              backgroundColor: 'var(--btn-primary)',
              color: 'var(--btn-primary-text)',
            }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving photo...</span>
              </>
            ) : (
              <span>Save photo</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
