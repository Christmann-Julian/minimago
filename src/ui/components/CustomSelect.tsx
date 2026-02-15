import { useState, useRef, useEffect } from 'react';

type Option<T extends string> = { value: T; label: string };

interface Props<T extends string> {
  options: Array<Option<T>>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
}

export default function CustomSelect<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel = 'custom-select',
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value),
    ),
  );
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    const idx = options.findIndex((o) => o.value === value);
    if (idx >= 0) setHighlight(idx);
  }, [value, options]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') return setOpen(false);
    if (e.key === 'Enter') {
      if (open) {
        onChange(options[highlight].value);
        setOpen(false);
      } else {
        setOpen(true);
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(options.length - 1, h + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.max(0, h - 1));
    }
  }

  return (
    <div
      className={`custom-select ${className ?? ''}`}
      ref={ref}
      role="listbox"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="custom-select-button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        onKeyDown={onKey}
      >
        {options.find((f) => f.value === value)?.label}
        <span className={`caret ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <ul className="custom-select-list" role="presentation">
          {options.map((opt, i) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={value === opt.value}
              className={`custom-select-item ${value === opt.value ? 'selected' : ''} ${i === highlight ? 'highlight' : ''}`}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
