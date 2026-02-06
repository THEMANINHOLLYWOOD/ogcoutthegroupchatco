import { motion } from "framer-motion";
import { HeroAnimation } from "../components/HeroAnimation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, Plane, Hotel, Users, CreditCard, ChevronDown, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    icon: Plane,
    title: "Book Flights",
    description: "Search and book real flights with live pricing",
  },
  {
    icon: Hotel,
    title: "Find Stays",
    description: "Browse hotels and accommodations worldwide",
  },
  {
    icon: Users,
    title: "Split Costs",
    description: "Automatic per-person cost calculation",
  },
  {
    icon: CreditCard,
    title: "One-Click Pay",
    description: "Friends pay their share with a single link",
  },
];

const Index = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 glass"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-semibold text-lg">Out the Group Chat</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
            <Button size="sm" className="rounded-full" asChild>
              <Link to="/create-trip">Getaway</Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-24 lg:pt-32 pb-12 lg:pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-center">
            {/* Phone Animation - First on mobile, second on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative order-1 lg:order-2"
            >
              <HeroAnimation />
            </motion.div>

            {/* Hero Text - Second on mobile, first on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              {/* Badge - hidden on mobile */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="hidden lg:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="leading-tight">Don't just book flights, accommodations, and activities; book experiences.</span>
              </motion.div>

              <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold tracking-tight mb-4 lg:mb-6">
                Let trips make it<br />
                <span className="text-primary">out the group chat.</span>
              </h1>

              {/* Scroll indicator - mobile only */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex lg:hidden flex-col items-center gap-2 mb-6"
              >
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
              </motion.div>

              {/* Description - hidden on mobile, shown on scroll via features section */}
              <p className="hidden sm:block text-base lg:text-lg text-muted-foreground mb-6 lg:mb-8 max-w-lg mx-auto lg:mx-0">
                Pick a trip off the shelf. Build complete getaways and share a single payment link with friends.
              </p>

              <div className="hidden sm:flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="rounded-full text-base px-6 sm:px-8 h-11 sm:h-12 shadow-soft">
                  <Link to="/create-trip">
                    Create a Trip
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full text-base px-6 sm:px-8 h-11 sm:h-12">
                  Join a Trip
                </Button>
              </div>

              {/* Social proof - hidden on mobile for cleaner look */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 lg:mt-10 hidden sm:flex items-center gap-4 justify-center lg:justify-start"
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-accent/80 border-2 border-background"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">2,400+</span> trips planned
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mobile CTA - shown only on mobile, right after hero */}
      <section className="sm:hidden px-4 pb-8">
        <div className="container mx-auto">
          <p className="text-base text-muted-foreground mb-6 text-center">
            Pick a trip off the shelf. Build complete getaways and share a single payment link with friends.
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="rounded-full text-base px-6 h-11 shadow-soft w-full">
              <Link to="/create-trip">
                Create a Trip
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full text-base px-6 h-11 w-full">
              Join a Trip
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to book together
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From flights to payments, we've got your group trip covered
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-2xl p-6 shadow-soft border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Plan, share, and book in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Build your trip",
                description: "Search flights, hotels, and add activities to create the perfect itinerary",
              },
              {
                step: "2",
                title: "Share the link",
                description: "Send a beautiful trip preview to your group chat—everyone sees costs upfront",
              },
              {
                step: "3",
                title: "Friends pay, you're booked",
                description: "Once everyone pays their share, the trip is automatically confirmed",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="container mx-auto"
        >
          <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 sm:p-12 text-center overflow-hidden">
            {/* Decorative bubbles */}
            <div className="absolute top-4 left-8 w-16 h-16 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-8 right-12 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground mb-4 relative">
              Ready to get out the group chat?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-lg mx-auto relative">
              Stop endless back-and-forth. Start your first trip today.
            </p>
            <Button 
              asChild
              size="lg" 
              variant="secondary" 
              className="rounded-full text-base px-8 h-12 shadow-soft relative"
            >
              <Link to="/create-trip">
                Create Your First Trip
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Out the Group Chat</span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="https://theburningstudio.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </a>
            <p className="text-sm text-muted-foreground">
              © 2026 Out the Group Chat. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
