import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeRemaining(expiresAt: string): TimeRemaining {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  const total = Math.max(0, expires - now);

  return {
    total,
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

function formatNumber(n: number): string {
  return n.toString().padStart(2, "0");
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [time, setTime] = useState(() => calculateTimeRemaining(expiresAt));
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt);
      setTime(remaining);

      if (remaining.total <= 0 && !hasExpired) {
        setHasExpired(true);
        onExpire?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, hasExpired, onExpire]);

  if (hasExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-2 p-5 sm:p-6 rounded-2xl bg-destructive/10 border border-destructive/20"
      >
        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
        <span className="text-base sm:text-lg font-semibold text-destructive">Time Expired</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2 sm:gap-3 p-5 sm:p-6 rounded-2xl bg-muted/50 border border-border"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="text-xs sm:text-sm font-medium">Time remaining to lock in</span>
      </div>

      <div className="flex items-center gap-1 font-mono text-3xl sm:text-4xl font-bold text-foreground">
        <TimeUnit value={time.hours} label="h" />
        <span className="text-muted-foreground">:</span>
        <TimeUnit value={time.minutes} label="m" />
        <span className="text-muted-foreground">:</span>
        <TimeUnit value={time.seconds} label="s" />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Collect payments before time runs out
      </p>
    </motion.div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.5, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="tabular-nums"
    >
      {formatNumber(value)}
    </motion.span>
  );
}
