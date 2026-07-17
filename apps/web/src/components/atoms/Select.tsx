'use client';

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAnimationsEnabled, useTheme } from '@/lib/theme/theme-provider';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  hasError?: boolean;
  onChange?: (event: { target: { value: string; name?: string } }) => void;
}

interface ListboxCoords {
  top: number;
  left: number;
  width: number;
}

const CLOSE_MS = 180;

function parseOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<{
      value?: string;
      disabled?: boolean;
      children?: ReactNode;
    }>;
    if (el.type !== 'option') return;

    options.push({
      value: el.props.value ?? '',
      label: String(el.props.children ?? ''),
      disabled: el.props.disabled,
    });
  });

  return options;
}

export function Select({
  className,
  hasError,
  children,
  value,
  defaultValue,
  onChange,
  name,
  id,
  disabled,
  'aria-label': ariaLabel,
}: SelectProps) {
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const { themeId } = useTheme();
  const animationsEnabled = useAnimationsEnabled();
  const isGlass = themeId === 'glassmorphism';
  const closeMs = animationsEnabled ? CLOSE_MS : 0;

  const options = parseOptions(children);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? options[0]?.value ?? '',
  );
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [coords, setCoords] = useState<ListboxCoords | null>(null);
  const [mounted, setMounted] = useState(false);

  const selectedValue = isControlled ? value : internalValue;
  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? options[0];
  const isVisible = open || closing;

  const updateCoords = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const close = useCallback(() => {
    if (!animationsEnabled) {
      setOpen(false);
      setClosing(false);
      return;
    }
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, closeMs);
  }, [animationsEnabled, closeMs]);

  const selectValue = useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onChange?.({ target: { value: nextValue, name } });
      close();
    },
    [close, isControlled, name, onChange],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isVisible) return;
    updateCoords();
  }, [isVisible, updateCoords]);

  useEffect(() => {
    if (!isVisible) return;

    function handleReposition() {
      updateCoords();
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (listboxRef.current?.contains(target)) return;
      close();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, close, updateCoords]);

  const listbox =
    mounted &&
    isVisible &&
    coords &&
    createPortal(
      <ul
        ref={listboxRef}
        id={listboxId}
        role="listbox"
        aria-label={ariaLabel}
        className={cn(
          'z-[9999] max-h-60 overflow-y-auto rounded-theme border border-border p-1 shadow-theme',
          'bg-background text-foreground',
          animationsEnabled &&
            (closing ? 'animate-menu-panel-out' : 'animate-menu-panel-in'),
        )}
        style={{
          position: 'fixed',
          top: coords.top,
          left: coords.left,
          width: coords.width,
          transformOrigin: 'top center',
          // Fondo opaco explícito (evita surface translúcido del tema glass)
          backgroundColor: 'var(--token-background)',
        }}
      >
        {options.map((option) => {
          const isSelected = option.value === selectedValue;

          return (
            <li
              key={option.value || '__empty__'}
              role="option"
              aria-selected={isSelected}
              aria-disabled={option.disabled}
            >
              <button
                type="button"
                disabled={option.disabled}
                onClick={() => selectValue(option.value)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-theme px-3 py-2 text-left text-sm transition-theme',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  isSelected
                    ? isGlass
                      ? 'bg-primary-fill font-medium text-on-primary shadow-theme'
                      : 'bg-primary/10 font-medium text-primary'
                    : 'text-foreground hover:bg-surface-secondary',
                )}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={14} className="shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>,
      document.body,
    );

  return (
    <div className={cn('relative', className)}>
      {name && (
        <input type="hidden" name={name} value={selectedValue ?? ''} />
      )}

      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        data-select-trigger
        onClick={() => (open ? close() : setOpen(true))}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-theme border bg-background px-3 py-2 text-left text-sm text-foreground',
          'transition-theme',
          'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          hasError ? 'border-danger' : 'border-border',
          open && 'border-primary ring-2 ring-primary/40',
        )}
      >
        <span className="truncate">
          {selectedOption?.label ?? 'Seleccionar...'}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'shrink-0 text-muted transition-theme',
            open && 'rotate-180',
          )}
        />
      </button>

      {listbox}
    </div>
  );
}
