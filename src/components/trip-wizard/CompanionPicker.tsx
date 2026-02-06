import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Search, ScanLine, Edit3, ChevronRight, X, Plane } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SavedCompanion, getCompanions } from "@/lib/travelerService";
import { useAuth } from "@/hooks/useAuth";

interface CompanionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCompanion: (companion: SavedCompanion) => void;
  onScanNew: () => void;
  onManualEntry: () => void;
}

export function CompanionPicker({
  open,
  onOpenChange,
  onSelectCompanion,
  onScanNew,
  onManualEntry,
}: CompanionPickerProps) {
  const { user } = useAuth();
  const [companions, setCompanions] = useState<SavedCompanion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open && user) {
      loadCompanions();
    }
  }, [open, user]);

  const loadCompanions = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getCompanions(user.id);
    setCompanions(data);
    setLoading(false);
  };

  const filteredCompanions = companions.filter(
    (c) =>
      c.nickname.toLowerCase().includes(search.toLowerCase()) ||
      c.full_legal_name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0">
        <SheetHeader className="px-6 pb-4">
          <SheetTitle className="text-xl font-semibold">Add Traveler</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full overflow-hidden">
          {/* Search */}
          <div className="px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved travelers..."
                className="pl-10 h-11 rounded-xl bg-muted/30 border-0"
              />
            </div>
          </div>

          {/* Companions List */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-muted/30 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredCompanions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
                  Saved Travelers
                </p>
                <AnimatePresence mode="popLayout">
                  {filteredCompanions.map((companion, index) => (
                    <motion.button
                      key={companion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                      onClick={() => {
                        onSelectCompanion(companion);
                        onOpenChange(false);
                      }}
                      className="w-full bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:bg-muted/30 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {getInitials(companion.nickname)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground block truncate">
                            {companion.nickname}
                          </span>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {companion.home_airport_iata ? (
                              <>
                                <Plane className="w-3 h-3" />
                                <span>{companion.home_airport_iata}</span>
                              </>
                            ) : (
                              <span className="text-xs">No home airport</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            ) : search ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No travelers found</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-1">No saved travelers yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Scan an ID to save for future trips
                </p>
              </div>
            )}
          </div>

          {/* Add New Options */}
          <div className="border-t border-border px-6 py-4 bg-background">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">
              Add New
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  onScanNew();
                  onOpenChange(false);
                }}
                className="h-auto py-4 flex flex-col gap-2 rounded-xl"
              >
                <ScanLine className="w-5 h-5" />
                <span className="text-sm">Scan ID</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onManualEntry();
                  onOpenChange(false);
                }}
                className="h-auto py-4 flex flex-col gap-2 rounded-xl"
              >
                <Edit3 className="w-5 h-5" />
                <span className="text-sm">Enter Manually</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
