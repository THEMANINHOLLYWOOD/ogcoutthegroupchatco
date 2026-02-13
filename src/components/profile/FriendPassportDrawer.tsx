import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { FriendWithProfile } from '@/lib/friendService';
import { TravelStamps } from './TravelStamps';
import { getCountryFlag } from '@/data/continents';

interface FriendPassportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friend: FriendWithProfile | null;
}

export const FriendPassportDrawer = ({ open, onOpenChange, friend }: FriendPassportDrawerProps) => {
  if (!friend) return null;

  const { profile } = friend;
  const initials = profile.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]" style={{ background: 'hsl(var(--passport-navy))' }}>
        <DrawerHeader className="pb-0">
          <DrawerTitle className="text-center text-xs uppercase tracking-[0.3em]" style={{ color: 'hsl(var(--passport-gold-muted))' }}>
            Passport
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-6 pb-8">
          {/* ID Section */}
          <div className="flex gap-4 py-6">
            <div className="w-[72px] h-[96px] rounded-md overflow-hidden flex-shrink-0" style={{ background: 'hsl(var(--passport-navy-light))' }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-semibold" style={{ color: 'hsl(var(--passport-gold-muted))' }}>
                  {initials}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'hsl(var(--passport-gold-muted) / 0.5)' }}>Name</p>
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--passport-gold))' }}>{profile.full_name || 'Unknown'}</p>
              </div>
              {profile.home_country && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: 'hsl(var(--passport-gold-muted) / 0.5)' }}>Home</p>
                  <p className="text-sm" style={{ color: 'hsl(var(--passport-gold))' }}>
                    {getCountryFlag(profile.home_country)} {profile.home_city ? `${profile.home_city}, ` : ''}{profile.home_country}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stamps */}
          <div style={{ borderTop: '1px solid hsl(var(--passport-gold) / 0.1)' }}>
            <TravelStamps userId={profile.id} readOnly />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
