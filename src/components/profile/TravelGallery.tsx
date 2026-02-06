import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MapPin, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MediaUploader } from './MediaUploader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface TravelMedia {
  id: string;
  url: string;
  media_type: 'photo' | 'video';
  caption: string | null;
  location: string | null;
}

export const TravelGallery = () => {
  const [media, setMedia] = useState<TravelMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchMedia();
  }, [user]);

  const fetchMedia = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('travel_media')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMedia(data as TravelMedia[]);
    }
    setIsLoading(false);
  };

  const handleUploadComplete = async (url: string, mediaType: 'photo' | 'video') => {
    if (!user) return;

    const { data, error } = await supabase
      .from('travel_media')
      .insert({
        user_id: user.id,
        url,
        media_type: mediaType,
        location: newLocation || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Failed to save',
        description: error.message,
        variant: 'destructive',
      });
    } else if (data) {
      setMedia((prev) => [data as TravelMedia, ...prev]);
      setShowUploader(false);
      setNewLocation('');
      toast({ title: 'Travel memory added!' });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('travel_media').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Failed to delete',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setMedia((prev) => prev.filter((m) => m.id !== id));
      toast({ title: 'Deleted' });
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Location (optional)"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="pl-10 h-11 rounded-xl"
              />
            </div>
            <MediaUploader
              bucket="travel-media"
              userId={user?.id || ''}
              accept="image/*,video/*"
              maxSize={100 * 1024 * 1024}
              onUploadComplete={handleUploadComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {media.length === 0 && !showUploader ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground mb-4">No travel memories yet</p>
          <Button onClick={() => setShowUploader(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Travel Memory
          </Button>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <AnimatePresence>
              {media.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, transition: { delay: index * 0.05 } }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative aspect-square group cursor-pointer"
                >
                  {item.media_type === 'video' ? (
                    <div className="w-full h-full bg-muted rounded-xl flex items-center justify-center">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.caption || 'Travel'}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  )}

                  {item.location && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-black/50 rounded-lg text-white text-xs">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{item.location}</span>
                      </div>
                    </div>
                  )}

                  <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {!showUploader && (
            <Button variant="outline" className="w-full" onClick={() => setShowUploader(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add More
            </Button>
          )}
        </>
      )}
    </motion.div>
  );
};
