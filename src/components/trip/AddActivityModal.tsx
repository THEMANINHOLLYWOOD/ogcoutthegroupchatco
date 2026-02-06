import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity } from "@/lib/tripTypes";

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (activity: Activity) => Promise<void>;
  dayNumber: number;
}

const activityTypes = [
  { value: 'attraction', label: '🏛 Attraction' },
  { value: 'restaurant', label: '🍽 Restaurant' },
  { value: 'event', label: '🎫 Event' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'free_time', label: '☕ Free Time' },
];

export function AddActivityModal({ isOpen, onClose, onAdd, dayNumber }: AddActivityModalProps) {
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Activity['type']>("attraction");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [isLiveEvent, setIsLiveEvent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!time || !title) return;

    setIsSubmitting(true);
    try {
      await onAdd({
        time,
        title,
        description,
        type,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : 0,
        is_live_event: isLiveEvent,
      });
      
      // Reset form
      setTime("");
      setTitle("");
      setDescription("");
      setType("attraction");
      setEstimatedCost("");
      setIsLiveEvent(false);
      onClose();
    } catch (error) {
      console.error("Error adding activity:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Modal - Bottom Sheet on Mobile */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[90vh] overflow-auto"
          >
            <div className="p-6 space-y-6">
              {/* Handle */}
              <div className="flex justify-center">
                <div className="w-10 h-1 bg-muted rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  Add Activity – Day {dayNumber}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Time */}
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    placeholder="e.g., 10:00 AM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Activity Name</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Visit the Louvre"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as Activity['type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the activity..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Estimated Cost */}
                <div className="space-y-2">
                  <Label htmlFor="cost">Estimated Cost (per person)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="cost"
                      type="number"
                      placeholder="0"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(e.target.value)}
                      className="pl-7"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Live Event Toggle */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLiveEvent}
                    onChange={(e) => setIsLiveEvent(e.target.checked)}
                    className="w-5 h-5 rounded border-border"
                  />
                  <span className="text-sm text-foreground">
                    This is a ticketed event (concert, show, etc.)
                  </span>
                </label>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting || !time || !title}
                  className="w-full h-12 rounded-xl"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Activity
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
