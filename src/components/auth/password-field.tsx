"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({
  label,
  name,
  autoComplete,
  placeholder,
  minLength = 8,
  value,
  onChange,
  disabled
}: {
  label: string;
  name: string;
  autoComplete?: string;
  placeholder?: string;
  minLength?: number;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block space-y-2">
      <span className="label">{label}</span>
      <div className="relative">
        <input
          className="field pr-12"
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={minLength}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          disabled={disabled}
          required
        />
        <motion.button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
          onClick={() => setVisible((current) => !current)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          whileHover={disabled ? undefined : { scale: 1.1 }}
          whileTap={disabled ? undefined : { scale: 0.9 }}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </motion.button>
      </div>
    </label>
  );
}
