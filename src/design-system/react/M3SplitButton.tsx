import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { JM3_SPRING_BUMP } from "../tokens/motion";

export type SplitMenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
};

type M3SplitButtonProps = {
  label: string;
  icon?: ReactNode;
  onPrimaryClick: () => void;
  menuItems?: SplitMenuItem[];
  className?: string;
  disabled?: boolean;
};

export const M3SplitButton = ({
  label,
  icon,
  onPrimaryClick,
  menuItems = [],
  className,
  disabled = false,
}: M3SplitButtonProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const hasMenu = menuItems.length > 0;

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <div className="jm3-split-btn">
        <button
          type="button"
          className="jm3-split-btn__main"
          disabled={disabled}
          onClick={onPrimaryClick}
        >
          {icon}
          <span>{label}</span>
        </button>
        {hasMenu ? (
          <motion.button
            type="button"
            className="jm3-split-btn__chevron"
            aria-expanded={open}
            aria-haspopup="menu"
            disabled={disabled}
            animate={{ scale: open ? 0.94 : 1 }}
            transition={JM3_SPRING_BUMP}
            onClick={() => setOpen((v) => !v)}
          >
            <ChevronDown size={14} />
          </motion.button>
        ) : null}
      </div>

      {open && hasMenu ? (
        <motion.div
          className="jm3-split-btn__menu"
          role="menu"
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={JM3_SPRING_BUMP}
        >
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="jm3-split-btn__menu-item"
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </motion.div>
      ) : null}
    </div>
  );
};
