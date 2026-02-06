import { motion } from "framer-motion";
import { Camera, Upload, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IDUploadCardProps {
  icon: "camera" | "upload";
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}

const icons: Record<string, LucideIcon> = {
  camera: Camera,
  upload: Upload,
};

export function IDUploadCard({ icon, title, subtitle, onClick, disabled }: IDUploadCardProps) {
  const Icon = icons[icon];

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full p-6 rounded-2xl border border-border bg-card",
        "flex items-center gap-4 text-left transition-all",
        "hover:border-primary/30 hover:shadow-soft",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      </div>
    </motion.button>
  );
}
