import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Loader2, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface MediaUploaderProps {
  bucket: string;
  userId: string;
  accept?: string;
  maxSize?: number;
  onUploadComplete: (url: string, mediaType: 'photo' | 'video') => void;
  onUploadStart?: () => void;
}

export const MediaUploader = ({
  accept = 'image/*,video/*',
  maxSize = 50 * 1024 * 1024,
  onUploadComplete,
  onUploadStart,
}: MediaUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setError(null);
    setIsUploading(true);
    onUploadStart?.();

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Create a data URL for preview (in real app, upload to Supabase storage)
      const reader = new FileReader();
      reader.onload = () => {
        const mediaType = file.type.startsWith('video/') ? 'video' : 'photo';
        clearInterval(interval);
        setUploadProgress(100);
        
        setTimeout(() => {
          onUploadComplete(reader.result as string, mediaType);
          setIsUploading(false);
          setUploadProgress(0);
        }, 300);
      };
      reader.readAsDataURL(file);
    } catch {
      clearInterval(interval);
      setError('Upload failed. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={{
          scale: isDragging ? 1.02 : 1,
          borderColor: isDragging ? 'hsl(var(--primary))' : 'hsl(var(--border))',
        }}
        className="relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-primary/50"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <Progress value={uploadProgress} className="w-full max-w-xs" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex items-center gap-2 text-primary">
                <ImageIcon className="w-6 h-6" />
                <Video className="w-6 h-6" />
              </div>
              <Upload className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Drop files here or click to upload</p>
                <p className="text-sm text-muted-foreground">
                  Photos and videos up to {Math.round(maxSize / 1024 / 1024)}MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between p-3 bg-destructive/10 text-destructive rounded-lg"
          >
            <p className="text-sm">{error}</p>
            <Button variant="ghost" size="icon" onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
