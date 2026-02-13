import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PassportLayoutProps {
  children: ReactNode;
  userName: string | null;
}

export const PassportLayout = ({ children, userName }: PassportLayoutProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      className="mx-4 mb-8 rounded-3xl overflow-hidden border border-border bg-card shadow-sm"
    >
      {/* Passport Cover Header */}
      <div className="px-6 pt-8 pb-6 text-center border-b border-border">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xs tracking-[0.3em] uppercase font-medium mb-1 text-muted-foreground"
        >
          OTGC Passport
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-12 h-px mx-auto my-3 bg-border"
        />
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg font-semibold tracking-wide text-foreground"
        >
          {userName || 'Traveler'}
        </motion.h2>
      </div>

      {/* Passport Pages */}
      <div className="divide-y divide-border">
        {children}
      </div>
    </motion.div>
  );
};
