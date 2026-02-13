import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/notifications/NotificationPanel';
import { PassportLayout } from '@/components/profile/PassportLayout';
import { PassportIDPage } from '@/components/profile/PassportIDPage';
import { TravelStamps } from '@/components/profile/TravelStamps';
import { FriendsPassportRow } from '@/components/profile/FriendsPassportRow';
import { TripSuggestionCard } from '@/components/profile/TripSuggestionCard';
import { PlacesVisited } from '@/components/profile/PlacesVisited';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Profile = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [addStampOpen, setAddStampOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 glass border-b border-border"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" asChild className="h-10 w-10">
            <Link to="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <span className="font-semibold text-lg">Passport</span>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-10 w-10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Passport */}
      <div className="pt-6">
        <PassportLayout userName={profile.full_name}>
          <PassportIDPage
            avatarUrl={profile.avatar_url}
            fullName={profile.full_name}
            email={profile.email}
            phone={profile.phone}
            homeCity={profile.home_city}
            homeCountry={profile.home_country}
            createdAt={profile.created_at}
          />
          <TravelStamps onAddStamp={() => setAddStampOpen(true)} />
          <FriendsPassportRow />
          <TripSuggestionCard />
        </PassportLayout>
      </div>

      {/* Add Stamp Dialog - reuses PlacesVisited add logic */}
      <Dialog open={addStampOpen} onOpenChange={setAddStampOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Travel Stamps</DialogTitle>
          </DialogHeader>
          <PlacesVisited />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
