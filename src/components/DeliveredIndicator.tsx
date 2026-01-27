import { motion } from "framer-motion";
import { Check, CheckCheck } from "lucide-react";

interface DeliveredIndicatorProps {
  status: "sent" | "delivered" | "read";
  delay?: number;
}

export const DeliveredIndicator = ({ status, delay = 0 }: DeliveredIndicatorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3, type: "spring" }}
      className="flex justify-end mt-1 mr-1"
    >
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {status === "sent" && (
          <>
            <Check className="w-3 h-3" />
            <span>Sent</span>
          </>
        )}
        {status === "delivered" && (
          <>
            <CheckCheck className="w-3 h-3" />
            <span>Delivered</span>
          </>
        )}
        {status === "read" && (
          <>
            <CheckCheck className="w-3 h-3 text-primary" />
            <span className="text-primary">Read</span>
          </>
        )}
      </span>
    </motion.div>
  );
};
