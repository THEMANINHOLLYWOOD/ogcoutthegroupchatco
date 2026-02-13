import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { HeadshotUpload } from './HeadshotUpload';

interface PassportIDPageProps {
  avatarUrl: string | null;
  fullName: string | null;
  email: string;
  phone: string | null;
  homeCity: string | null;
  homeCountry: string | null;
  createdAt: string;
}

export const PassportIDPage = ({
  avatarUrl,
  fullName,
  email,
  phone,
  homeCity,
  homeCountry,
  createdAt,
}: PassportIDPageProps) => {
  const memberSince = format(new Date(createdAt), 'dd MMM yyyy');

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground truncate">
        {value}
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="p-6"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] mb-4 text-muted-foreground/50">
        Identification
      </p>

      <div className="flex gap-5">
        <HeadshotUpload avatarUrl={avatarUrl} fullName={fullName} />

        <div className="flex-1 space-y-3 min-w-0">
          <InfoRow label="Full Name" value={fullName || 'Not set'} />
          <InfoRow label="Nationality" value={homeCountry || 'Not set'} />
          <InfoRow label="Home" value={homeCity ? `${homeCity}${homeCountry ? `, ${homeCountry}` : ''}` : 'Not set'} />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border space-y-3">
        <InfoRow label="Email" value={email} />
        <div className="grid grid-cols-2 gap-3">
          <InfoRow label="Phone" value={phone || 'Not set'} />
          <InfoRow label="Member Since" value={memberSince} />
        </div>
      </div>
    </motion.div>
  );
};
