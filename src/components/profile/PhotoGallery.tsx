import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaUploader } from './MediaUploader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

export const PhotoGallery = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchPhotos();
  }, [user]);

  const fetchPhotos = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_photos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPhotos(data);
    }
    setIsLoading(false);
  };

  const handleUploadComplete = async (url: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_photos')
      .insert({ user_id: user.id, url })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Failed to save photo',
        description: error.message,
        variant: 'destructive',
      });
    } else if (data) {
      setPhotos((prev) => [data, ...prev]);
      setShowUploader(false);
      toast({ title: 'Photo added!' });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('user_photos').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      toast({ title: 'Photo deleted' });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <MediaUploader
              bucket="user-photos"
              userId={user?.id || ''}
              accept="image/*"
              onUploadComplete={(url) => handleUploadComplete(url)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {photos.length === 0 && !showUploader ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground mb-4">No photos yet</p>
          <Button onClick={() => setShowUploader(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <AnimatePresence>
              {photos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, transition: { delay: index * 0.05 } }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative aspect-square group cursor-pointer"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Photo'}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(photo.id)}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {!showUploader && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowUploader(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add More Photos
            </Button>
          )}
        </>
      )}
    </motion.div>
  );
};
