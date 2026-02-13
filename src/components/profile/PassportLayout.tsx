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
      className="mx-4 mb-8 rounded-3xl border border-border bg-card shadow-sm overflow-visible"
    >
      {/* Passport Pages */}
      <div className="divide-y divide-border">
        {children}
      </div>
    </motion.div>
  );
};
