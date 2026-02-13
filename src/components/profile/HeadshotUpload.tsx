import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getCroppedImg, CropArea } from '@/lib/cropImage';

interface HeadshotUploadProps {
  avatarUrl: string | null;
  fullName: string | null;
}

export const HeadshotUpload = ({ avatarUrl, fullName }: HeadshotUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Please select an image under 10MB', variant: 'destructive' });
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onCropComplete = useCallback((_: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUpload = async () => {
    if (!previewUrl || !croppedAreaPixels || !user) return;
    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
      const fileName = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const avatarUrlWithCacheBust = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrlWithCacheBust })
        .eq('id', user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      handleClose();
      toast({ title: 'Headshot updated' });
    } catch (error) {
      toast({ title: 'Upload failed', description: error instanceof Error ? error.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreviewUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="relative group w-[90px] h-[120px] rounded-lg overflow-hidden flex-shrink-0"
        style={{ background: 'hsl(var(--passport-navy-light))' }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={fullName || 'Headshot'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl font-semibold" style={{ color: 'hsl(var(--passport-gold-muted))' }}>
            {initials}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity">
          <Camera className="w-5 h-5 text-white" />
        </div>
      </motion.button>

      <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Headshot</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <AnimatePresence mode="wait">
              {previewUrl ? (
                <motion.div key="cropper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                  <div className="relative w-full h-64 bg-muted rounded-xl overflow-hidden">
                    <Cropper image={previewUrl} crop={crop} zoom={zoom} aspect={3 / 4} cropShape="rect" showGrid={false} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
                  </div>
                  <div className="flex items-center gap-3 mt-4 px-2">
                    <ZoomOut className="w-4 h-4 text-muted-foreground" />
                    <Slider value={[zoom]} onValueChange={(v) => setZoom(v[0])} min={1} max={3} step={0.1} className="flex-1" />
                    <ZoomIn className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                  <div className="w-24 h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                    {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <span className="text-2xl font-semibold text-muted-foreground">{initials}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">Choose a photo for your passport headshot</p>
                </motion.div>
              )}
            </AnimatePresence>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
            <div className="flex gap-3 w-full">
              {previewUrl ? (
                <>
                  <Button variant="outline" onClick={() => { setPreviewUrl(null); setCrop({ x: 0, y: 0 }); setZoom(1); }} className="flex-1 h-11 rounded-xl">Cancel</Button>
                  <Button onClick={handleUpload} disabled={isUploading} className="flex-1 h-11 rounded-xl">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Save
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full h-11 rounded-xl">Choose Photo</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
