import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getFriends, sendFriendRequest, FriendWithProfile, FriendProfile } from '@/lib/friendService';
import { getCountryFlag } from '@/data/continents';
import { FriendPassportDrawer } from './FriendPassportDrawer';

export const FriendsPassportRow = () => {
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<FriendWithProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) loadFriends();
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    const data = await getFriends(user.id);
    setFriends(data);
    setIsLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email, home_city, home_country')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq('id', user?.id ?? '')
      .limit(5);
    setSearchResults((data as FriendProfile[]) || []);
    setIsSearching(false);
  };

  const handleAddFriend = async (targetId: string) => {
    const { error } = await sendFriendRequest(targetId);
    if (error) {
      toast({ title: error, variant: 'destructive' });
    } else {
      toast({ title: 'Friend request sent!' });
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const openFriendPassport = (friend: FriendWithProfile) => {
    setSelectedFriend(friend);
    setDrawerOpen(true);
  };

  const getInitials = (name: string | null) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="p-6"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] mb-4 text-muted-foreground/50">
        Friends · {friends.length}
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
        <Input
          placeholder="Search people..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9 h-9 text-sm rounded-lg bg-secondary text-foreground border-none"
        />
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="mb-4 space-y-2">
          {searchResults.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={p.avatar_url || undefined} />
                  <AvatarFallback className="text-xs bg-muted">{getInitials(p.full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-xs truncate text-foreground">{p.full_name || p.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleAddFriend(p.id)} className="h-7 px-2">
                <UserPlus className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Friends Row */}
      {friends.length === 0 && !isLoading ? (
        <p className="text-sm text-center py-4 text-muted-foreground/40">
          No friends yet
        </p>
      ) : (
        <ScrollArea className="w-full -mx-6 px-6">
          <div className="flex gap-3 pb-2">
            {friends.map((f, i) => (
              <motion.button
                key={f.friendship.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => openFriendPassport(f)}
                className="flex flex-col items-center gap-1.5 w-[70px] flex-shrink-0 group"
              >
                <div className="w-12 h-16 rounded-md overflow-hidden border border-border bg-muted">
                  {f.profile.avatar_url ? (
                    <img src={f.profile.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      {getInitials(f.profile.full_name)}
                    </div>
                  )}
                </div>
                <span className="text-[10px] truncate w-full text-center text-muted-foreground">
                  {f.profile.full_name?.split(' ')[0] || 'Friend'}
                </span>
                {f.profile.home_country && (
                  <span className="text-xs leading-none -mt-1">{getCountryFlag(f.profile.home_country)}</span>
                )}
              </motion.button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      )}

      <FriendPassportDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        friend={selectedFriend}
      />
    </motion.div>
  );
};
