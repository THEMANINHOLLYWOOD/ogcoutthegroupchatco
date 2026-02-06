import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchTripByCode } from "@/lib/tripService";

const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export default function JoinTrip() {
  const navigate = useNavigate();
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Auto-validate when all 6 digits entered
  useEffect(() => {
    const fullCode = code.join("");
    if (fullCode.length === 6 && code.every((c) => c !== "")) {
      handleValidate(fullCode);
    }
  }, [code]);

  const handleValidate = async (fullCode: string) => {
    setIsLoading(true);
    setError(null);

    const result = await fetchTripByCode(fullCode);

    if (result.success && result.tripId) {
      setSuccess(true);
      setTimeout(() => {
        navigate(`/trip/${result.tripId}`);
      }, 800);
    } else {
      setError(result.error || "Trip not found");
      setIsLoading(false);
      // Shake animation handled via error state
      setTimeout(() => {
        setCode(Array(6).fill(""));
        setActiveIndex(0);
        inputRefs.current[0]?.focus();
      }, 600);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Only accept valid characters
    const char = value.toUpperCase().slice(-1);
    if (char && !CHARS.includes(char)) return;

    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);
    setError(null);

    // Auto-advance to next input
    if (char && index < 5) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (code[index] === "" && index > 0) {
        // Move to previous input
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").toUpperCase().slice(0, 6);
    const validChars = pastedText.split("").filter((c) => CHARS.includes(c));
    
    if (validChars.length > 0) {
      const newCode = [...code];
      validChars.forEach((char, i) => {
        if (i < 6) newCode[i] = char;
      });
      setCode(newCode);
      
      const nextIndex = Math.min(validChars.length, 5);
      setActiveIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Check className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Found it!</h2>
                <p className="text-muted-foreground mt-2">Loading your trip...</p>
              </motion.div>
            ) : (
              <motion.div key="input" exit={{ opacity: 0 }}>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
                  Join a Trip
                </h1>
                <p className="text-muted-foreground text-lg mb-10">
                  Enter the 6-digit code from your friend
                </p>

                {/* OTP Input */}
                <motion.div
                  animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="flex justify-center gap-2 sm:gap-3 mb-6"
                  onPaste={handlePaste}
                >
                  {code.map((char, index) => (
                    <motion.div
                      key={index}
                      animate={{
                        scale: activeIndex === index && !isLoading ? 1.05 : 1,
                        borderColor:
                          error
                            ? "hsl(var(--destructive))"
                            : activeIndex === index
                            ? "hsl(var(--primary))"
                            : "hsl(var(--border))",
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="relative"
                    >
                      <input
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="text"
                        autoCapitalize="characters"
                        maxLength={1}
                        value={char}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onFocus={() => handleFocus(index)}
                        disabled={isLoading}
                        className={`
                          w-12 h-14 sm:w-14 sm:h-16 
                          text-center text-2xl font-bold 
                          bg-card border-2 rounded-xl
                          focus:outline-none focus:ring-2 focus:ring-primary/20
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-colors
                          ${error ? "border-destructive bg-destructive/5" : "border-border"}
                        `}
                      />
                      <AnimatePresence>
                        {char && (
                          <motion.span
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 600, damping: 25 }}
                            className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-foreground pointer-events-none"
                          >
                            {char}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Loading State */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 text-muted-foreground"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Finding your trip...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-destructive text-sm"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Help Text */}
                <p className="text-xs text-muted-foreground mt-8">
                  The code is case-insensitive and uses letters A-Z and numbers 2-9
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
