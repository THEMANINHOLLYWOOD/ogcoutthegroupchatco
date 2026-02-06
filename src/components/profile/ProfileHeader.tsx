import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getCroppedImg, CropArea } from '@/lib/cropImage';

interface ProfileHeaderProps {
  avatarUrl: string | null;
  fullName: string | null;
  email: string;
}

export const ProfileHeader = ({ avatarUrl, fullName, email }: ProfileHeaderProps) => {
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
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : email.slice(0, 2).toUpperCase();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 10MB',
        variant: 'destructive',
      });
      return;
    }

    // Reset crop state for new image
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
      // Crop the image
      const croppedBlob = await getCroppedImg(previewUrl, croppedAreaPixels);
      
      const fileName = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      // Add cache-busting query param
      const avatarUrlWithCacheBust = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrlWithCacheBust })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      handleClose();

      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
      className="flex flex-col items-center py-6 sm:py-8 px-4"
    >
      <Dialog open={isOpen} onOpenChange={(open) => open ? setIsOpen(true) : handleClose()}>
        <DialogTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative group cursor-pointer"
          >
            <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-background shadow-lg">
              <AvatarImage 
                src={avatarUrl || undefined} 
                alt={fullName || 'User'} 
                className="object-cover"
              />
              <AvatarFallback className="text-xl sm:text-2xl font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </motion.button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <AnimatePresence mode="wait">
              {previewUrl ? (
                <motion.div
                  key="cropper"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full"
                >
                  {/* Cropper container */}
                  <div className="relative w-full h-56 sm:h-64 bg-muted rounded-xl overflow-hidden">
                    <Cropper
                      image={previewUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                  </div>
                  
                  {/* Zoom slider */}
                  <div className="flex items-center gap-3 mt-4 px-2">
                    <ZoomOut className="w-4 h-4 text-muted-foreground" />
                    <Slider
                      value={[zoom]}
                      onValueChange={(value) => setZoom(value[0])}
                      min={1}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <ZoomIn className="w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <Avatar className="w-28 h-28 sm:w-32 sm:h-32">
                    <AvatarImage src={avatarUrl || undefined} className="object-cover" />
                    <AvatarFallback className="text-2xl sm:text-3xl bg-muted">{initials}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground text-center px-4">
                    Choose a photo to crop and upload
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-3 w-full">
              {previewUrl ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setPreviewUrl(null);
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                    className="flex-1 h-11 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} disabled={isUploading} className="flex-1 h-11 rounded-xl">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-11 rounded-xl"
                >
                  Choose Photo
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-center"
      >
        {fullName || 'User'}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground text-sm sm:text-base text-center truncate max-w-full"
      >
        {email}
      </motion.p>
    </motion.div>
  );
};
