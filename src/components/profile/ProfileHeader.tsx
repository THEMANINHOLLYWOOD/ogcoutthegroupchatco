import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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

interface ProfileHeaderProps {
  avatarUrl: string | null;
  fullName: string | null;
  email: string;
}

export const ProfileHeader = ({ avatarUrl, fullName, email }: ProfileHeaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setIsOpen(false);
      setPreviewUrl(null);
      setSelectedFile(null);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
      className="flex flex-col items-center py-8"
    >
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative group cursor-pointer"
          >
            <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
              <AvatarImage src={avatarUrl || undefined} alt={fullName || 'User'} />
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </motion.button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <AnimatePresence mode="wait">
              {previewUrl ? (
                <motion.img
                  key="preview"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  src={previewUrl}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-3xl bg-muted">{initials}</AvatarFallback>
                  </Avatar>
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

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Choose Photo
              </Button>
              {selectedFile && (
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Upload
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
        className="mt-4 text-2xl font-bold"
      >
        {fullName || 'User'}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground"
      >
        {email}
      </motion.p>
    </motion.div>
  );
};
