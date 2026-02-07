import { useState } from 'react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Phone, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TravelCompanions } from './TravelCompanions';

const formSchema = z.object({
  phone: z.string().max(20, 'Phone number too long').optional().or(z.literal('')),
  full_name: z.string().trim().max(100, 'Name too long').optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface PersonalInfoFormProps {
  email: string;
  phone: string | null;
  fullName: string | null;
}

export const PersonalInfoForm = ({ email, phone, fullName }: PersonalInfoFormProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: phone || '',
      full_name: fullName || '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          phone: data.phone || null,
          full_name: data.full_name || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Profile updated',
        description: 'Your information has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 24 }}
      className="space-y-6 pb-safe"
    >
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
          <Input
            id="full_name"
            placeholder="John Doe"
            className="h-12 rounded-xl text-base"
            {...form.register('full_name')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="pl-10 h-12 rounded-xl bg-muted text-base"
            />
          </div>
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              className="pl-10 h-12 rounded-xl text-base"
              {...form.register('phone')}
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl text-base font-medium" disabled={isSaving}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </form>

      {/* Travel Companions Section */}
      <div className="mt-8 pt-6 border-t border-border">
        <h3 className="text-lg font-semibold mb-4">Travel Companions</h3>
        <TravelCompanions />
      </div>
    </motion.div>
  );
};
