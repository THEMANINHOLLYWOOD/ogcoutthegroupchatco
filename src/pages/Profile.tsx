import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
import { PhotoGallery } from '@/components/profile/PhotoGallery';
import { TravelGallery } from '@/components/profile/TravelGallery';
import { PlacesVisited } from '@/components/profile/PlacesVisited';

const Profile = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

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
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <span className="font-semibold">Profile</span>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </motion.header>

      {/* Profile Header */}
      <ProfileHeader
        avatarUrl={profile.avatar_url}
        fullName={profile.full_name}
        email={profile.email}
      />

      {/* Tabs */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1 mb-6">
            <TabsTrigger value="about" className="text-xs sm:text-sm py-2">
              About
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs sm:text-sm py-2">
              Photos
            </TabsTrigger>
            <TabsTrigger value="travel" className="text-xs sm:text-sm py-2">
              Travel
            </TabsTrigger>
            <TabsTrigger value="places" className="text-xs sm:text-sm py-2">
              Places
            </TabsTrigger>
          </TabsList>

          <TabsContent value="about">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
            >
              <PersonalInfoForm
                email={profile.email}
                phone={profile.phone}
                fullName={profile.full_name}
              />
            </motion.div>
          </TabsContent>

          <TabsContent value="photos">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
            >
              <PhotoGallery />
            </motion.div>
          </TabsContent>

          <TabsContent value="travel">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
            >
              <TravelGallery />
            </motion.div>
          </TabsContent>

          <TabsContent value="places">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
            >
              <PlacesVisited />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
