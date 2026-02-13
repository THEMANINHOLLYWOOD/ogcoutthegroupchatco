import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserMinus, UserPlus, Search, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  getFriends,
  removeFriend,
  sendFriendRequest,
  type FriendWithProfile,
} from '@/lib/friendService';
import { searchUsers, type PlatformUser } from '@/lib/userService';

export const FriendsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlatformUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const fetchFriends = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getFriends(user.id);
    setFriends(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      const results = await searchUsers(searchQuery);
      // Filter out self and existing friends
      const friendIds = new Set(friends.map((f) => f.profile.id));
      setSearchResults(results.filter((r) => r.id !== user?.id && !friendIds.has(r.id)));
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, friends, user]);

  const handleRemoveFriend = async (friendshipId: string) => {
    const { error } = await removeFriend(friendshipId);
    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Friend removed' });
      fetchFriends();
    }
  };

  const handleSendRequest = async (userId: string) => {
    setSendingTo(userId);
    const { error } = await sendFriendRequest(userId);
    setSendingTo(null);
    if (error) {
      toast({ title: 'Could not send request', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Friend request sent' });
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Search to add friends */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 rounded-2xl bg-secondary/50 border-0 text-sm"
        />
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border border-border overflow-hidden"
          >
            <div className="px-4 py-3 bg-secondary/30 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                People
              </p>
            </div>
            {searchResults.map((result, i) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={result.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(result.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.full_name || 'Unknown'}</p>
                  {result.home_city && (
                    <p className="text-xs text-muted-foreground">{result.home_city}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  className="h-8 rounded-xl text-xs px-3"
                  disabled={sendingTo === result.id}
                  onClick={() => handleSendRequest(result.id)}
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {searching && searchQuery.length >= 2 && (
        <div className="flex justify-center py-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
          />
        </div>
      )}

      {/* Friends List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
          />
        </div>
      ) : friends.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 text-muted-foreground"
        >
          <Users className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No friends yet</p>
          <p className="text-xs mt-1">Search above to find and add friends</p>
        </motion.div>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 mb-3">
            {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
          </p>
          {friends.map((friend, i) => (
            <motion.div
              key={friend.friendship.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/50 transition-colors group"
            >
              <Avatar className="w-11 h-11">
                <AvatarImage src={friend.profile.avatar_url || undefined} />
                <AvatarFallback className="text-sm bg-primary/10 text-primary">
                  {getInitials(friend.profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {friend.profile.full_name || 'Unknown'}
                </p>
                {(friend.profile.home_city || friend.profile.home_country) && (
                  <p className="text-xs text-muted-foreground truncate">
                    {[friend.profile.home_city, friend.profile.home_country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveFriend(friend.friendship.id)}
              >
                <UserMinus className="w-4 h-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
