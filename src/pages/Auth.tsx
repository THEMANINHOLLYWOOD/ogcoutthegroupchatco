import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, User } from 'lucide-react';

const signInSchema = z.object({
  email: z.string().trim().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(1, 'Please enter your name').max(100),
});

type SignInFormData = z.infer<typeof signInSchema>;
type SignUpFormData = z.infer<typeof signUpSchema>;

const Auth = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const { toast } = useToast();

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', fullName: '' },
  });

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    const { error } = await signInWithEmail(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    const { error } = await signUpWithEmail(data.email, data.password, data.fullName);
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast({
          title: 'Account exists',
          description: 'This email is already registered. Please sign in instead.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Check your email',
        description: 'We sent you a confirmation link. Please verify your email to continue.',
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    
    if (error) {
      setIsGoogleLoading(false);
      toast({
        title: 'Google sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    // If successful, the page will redirect via OAuth flow
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-2xl font-bold">Out the Group Chat</h1>
          <p className="text-muted-foreground mt-2">
            {mode === 'signin' ? 'Welcome back!' : 'Create your account'}
          </p>
        </motion.div>

        {/* Google Button */}
        <motion.div variants={itemVariants}>
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 rounded-xl text-base font-medium"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div variants={itemVariants} className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or continue with email</span>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div variants={itemVariants}>
          {mode === 'signin' ? (
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 h-11 rounded-xl"
                    {...signInForm.register('email')}
                  />
                </div>
                {signInForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 rounded-xl"
                    {...signInForm.register('password')}
                  />
                </div>
                {signInForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 rounded-xl text-base"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10 h-11 rounded-xl"
                    {...signUpForm.register('fullName')}
                  />
                </div>
                {signUpForm.formState.errors.fullName && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 h-11 rounded-xl"
                    {...signUpForm.register('email')}
                  />
                </div>
                {signUpForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 rounded-xl"
                    {...signUpForm.register('password')}
                  />
                </div>
                {signUpForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signUpForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full h-12 rounded-xl text-base"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              </Button>
            </form>
          )}
        </motion.div>

        {/* Toggle Mode */}
        <motion.div variants={itemVariants} className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-primary font-medium hover:underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
