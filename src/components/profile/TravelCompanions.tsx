import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Plus, Plane, AlertTriangle, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { SavedCompanion, getCompanions, deleteCompanion } from "@/lib/travelerService";
import { AddCompanionModal } from "./AddCompanionModal";
import { toast } from "sonner";
import { differenceInMonths, parseISO } from "date-fns";

export function TravelCompanions() {
  const { user } = useAuth();
  const [companions, setCompanions] = useState<SavedCompanion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SavedCompanion | null>(null);

  useEffect(() => {
    if (user) {
      loadCompanions();
    }
  }, [user]);

  const loadCompanions = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getCompanions(user.id);
    setCompanions(data);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteCompanion(deleteTarget.id);
    if (result.success) {
      toast.success("Companion removed");
      setCompanions((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } else {
      toast.error("Failed to remove companion");
    }
    setDeleteTarget(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isExpiringSoon = (expirationDate?: string) => {
    if (!expirationDate) return false;
    try {
      const date = parseISO(expirationDate);
      return differenceInMonths(date, new Date()) < 6;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {companions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Add your first travel companion
            </h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
              Scan their ID to auto-fill trip details on future bookings
            </p>
            <Button onClick={() => setShowAddModal(true)} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Companion
            </Button>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">
                {companions.length} {companions.length === 1 ? "Companion" : "Companions"}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="rounded-xl"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {companions.map((companion, index) => (
                  <motion.div
                    key={companion.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-card border border-border rounded-2xl p-4 relative group"
                  >
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setDeleteTarget(companion)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {getInitials(companion.nickname)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {companion.nickname}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {companion.full_legal_name}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {companion.home_airport_iata && (
                            <span className="inline-flex items-center gap-1 text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full">
                              <Plane className="w-3 h-3" />
                              {companion.home_airport_iata}
                            </span>
                          )}
                          {isExpiringSoon(companion.expiration_date) && (
                            <span className="inline-flex items-center gap-1 text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" />
                              Expiring soon
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      <AddCompanionModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => {
          loadCompanions();
          setShowAddModal(false);
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove companion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deleteTarget?.nickname} from your saved travelers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
