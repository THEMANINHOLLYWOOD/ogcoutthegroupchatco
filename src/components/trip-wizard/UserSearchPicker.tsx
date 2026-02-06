import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, MapPin, Loader2, UserPlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { searchUsers, PlatformUser } from "@/lib/userService";
import { cn } from "@/lib/utils";

interface UserSearchPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: PlatformUser) => void;
  onManualEntry: () => void;
  excludeUserIds?: string[];
}

export function UserSearchPicker({
  open,
  onOpenChange,
  onSelectUser,
  onManualEntry,
  excludeUserIds = [],
}: UserSearchPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlatformUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const users = await searchUsers(query);
      // Filter out already added users
      const filtered = users.filter(u => !excludeUserIds.includes(u.id));
      setResults(filtered);
      setIsSearching(false);
      setHasSearched(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, excludeUserIds]);

  const handleSelectUser = useCallback((user: PlatformUser) => {
    onSelectUser(user);
    setQuery("");
    setResults([]);
    setHasSearched(false);
    onOpenChange(false);
  }, [onSelectUser, onOpenChange]);

  const handleManualEntry = useCallback(() => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    onManualEntry();
    onOpenChange(false);
  }, [onManualEntry, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">Add Traveler</SheetTitle>
        </SheetHeader>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-10 h-12 rounded-xl bg-muted/50 border-0"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isSearching && hasSearched && results.length === 0 && (
            <div className="text-center py-8">
              <User className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No users found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Try a different name or add manually
              </p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {results.map((user, index) => (
              <motion.button
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectUser(user)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl",
                  "bg-background hover:bg-muted/50 transition-colors",
                  "border border-transparent hover:border-border",
                  "text-left"
                )}
              >
                <Avatar className="w-12 h-12">
                  {user.avatar_url ? (
                    <AvatarImage src={user.avatar_url} alt={user.full_name || "User"} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {user.full_name || "Unknown User"}
                  </p>
                  {user.home_city && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {user.home_city}
                        {user.home_country ? `, ${user.home_country}` : ""}
                      </span>
                    </div>
                  )}
                </div>
                <UserPlus className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Manual Entry Option */}
        <div className="pt-4 border-t border-border mt-4">
          <Button
            variant="outline"
            onClick={handleManualEntry}
            className="w-full h-12 rounded-xl"
          >
            <User className="w-4 h-4 mr-2" />
            Enter name manually
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
