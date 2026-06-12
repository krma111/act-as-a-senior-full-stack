"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type MotionProps<T extends keyof HTMLElementTagNameMap> = HTMLMotionProps<T> & {
  delay?: number;
};

const ease = [0.22, 1, 0.36, 1] as const;

export function MotionMain({ children, className, delay = 0, ...props }: MotionProps<"main">) {
  return (
    <motion.main
      className={className}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease, delay }}
      {...props}
    >
      {children}
    </motion.main>
  );
}

export function MotionSection({ children, className, delay = 0, ...props }: MotionProps<"section">) {
  return (
    <motion.section
      className={className}
      initial={false}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease, delay }}
      {...props}
    >
      {children}
    </motion.section>
  );
}

export function MotionDiv({ children, className, delay = 0, ...props }: MotionProps<"div">) {
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionButton({ children, className, disabled, ...props }: HTMLMotionProps<"button">) {
  return (
    <motion.button
      className={className}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2, scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.18, ease }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
