import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm';
import { PhotoGallery } from '@/components/profile/PhotoGallery';
import { TravelGallery } from '@/components/profile/TravelGallery';
import { PlacesVisited } from '@/components/profile/PlacesVisited';
import { TravelCompanions } from '@/components/profile/TravelCompanions';

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
      {/* Header - optimized for mobile */}
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
          <span className="font-semibold text-lg">Profile</span>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-10 w-10">
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

      {/* Tabs - horizontally scrollable on mobile */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs defaultValue="about" className="w-full">
          {/* Scrollable tab list for mobile */}
          <ScrollArea className="w-full -mx-4 px-4">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-5 h-12 p-1 mb-6 gap-1">
              <TabsTrigger 
                value="about" 
                className="px-4 sm:px-2 text-sm whitespace-nowrap rounded-lg data-[state=active]:shadow-sm"
              >
                About
              </TabsTrigger>
              <TabsTrigger 
                value="companions" 
                className="px-4 sm:px-2 text-sm whitespace-nowrap rounded-lg data-[state=active]:shadow-sm"
              >
                Companions
              </TabsTrigger>
              <TabsTrigger 
                value="photos" 
                className="px-4 sm:px-2 text-sm whitespace-nowrap rounded-lg data-[state=active]:shadow-sm"
              >
                Photos
              </TabsTrigger>
              <TabsTrigger 
                value="travel" 
                className="px-4 sm:px-2 text-sm whitespace-nowrap rounded-lg data-[state=active]:shadow-sm"
              >
                Travel
              </TabsTrigger>
              <TabsTrigger 
                value="places" 
                className="px-4 sm:px-2 text-sm whitespace-nowrap rounded-lg data-[state=active]:shadow-sm"
              >
                Places
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>

          <TabsContent value="about" className="mt-0">
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

          <TabsContent value="companions" className="mt-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
            >
              <TravelCompanions />
            </motion.div>
          </TabsContent>

          <TabsContent value="photos" className="mt-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
            >
              <PhotoGallery />
            </motion.div>
          </TabsContent>

          <TabsContent value="travel" className="mt-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
            >
              <TravelGallery />
            </motion.div>
          </TabsContent>

          <TabsContent value="places" className="mt-0">
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
