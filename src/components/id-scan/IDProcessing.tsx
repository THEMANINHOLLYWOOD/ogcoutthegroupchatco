import { motion } from "framer-motion";
import { FileText, Scan, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

interface IDProcessingProps {
  status?: "scanning" | "extracting" | "complete";
}

const statusMessages = {
  scanning: "Scanning your document...",
  extracting: "Extracting information...",
  complete: "Almost done!",
};

export function IDProcessing({ status = "scanning" }: IDProcessingProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center py-12 px-6"
    >
      {/* Animated icon */}
      <div className="relative mb-8">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          style={{ width: 120, height: 120, margin: -20 }}
        />
        <motion.div
          animate={{ rotate: status === "complete" ? 0 : 360 }}
          transition={{
            duration: 3,
            repeat: status === "complete" ? 0 : Infinity,
            ease: "linear",
          }}
          className="relative w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center shadow-soft"
        >
          {status === "complete" ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </motion.div>
          ) : (
            <FileText className="w-10 h-10 text-primary" />
          )}
        </motion.div>

        {/* Scanning line animation */}
        {status !== "complete" && (
          <motion.div
            animate={{ y: [0, 60, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute left-0 right-0 top-2 h-0.5 bg-primary/50 rounded-full"
            style={{ width: "100%" }}
          />
        )}
      </div>

      {/* Status text */}
      <motion.p
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-lg font-medium text-foreground text-center"
      >
        {statusMessages[status]}
        {status !== "complete" && <span className="inline-block w-6">{dots}</span>}
      </motion.p>

      <p className="text-sm text-muted-foreground mt-2 text-center max-w-xs">
        {status === "complete"
          ? "Your information has been extracted"
          : "This usually takes just a few seconds"}
      </p>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mt-8">
        {["scanning", "extracting", "complete"].map((step, index) => {
          const stepOrder = ["scanning", "extracting", "complete"];
          const currentIndex = stepOrder.indexOf(status);
          const stepIndex = stepOrder.indexOf(step);
          const isActive = stepIndex <= currentIndex;

          return (
            <motion.div
              key={step}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{
                scale: isActive ? 1 : 0.8,
                opacity: isActive ? 1 : 0.5,
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                isActive ? "bg-primary" : "bg-muted"
              }`}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
