import * as React from 'react';

/* Material Glass for React. Thin, typed wrappers: every component renders the same markup and classes
   as the plain-HTML library, so the CSS (and material-glass.js, if loaded) does all the work. */

type Div = React.HTMLAttributes<HTMLDivElement>;
const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

declare global {
  interface Window {
    MaterialGlass?: {
      init(root?: Element | Document): void;
      refresh(): void;
      setTheme(theme?: string | null, mode?: string): void;
      toast(message: string, opts?: { action?: string; onAction?: () => void; duration?: number }): { dismiss(): void };
      sparkline(el: Element, values: number[]): void;
      chartTheme(el?: Element): { series: string[]; text: string; grid: string; surface: string; font: string; chartjs: Record<string, unknown> };
    };
  }
}

export type Tier = 0 | 1 | 2 | 3 | 4;
export type ThemeName = 'sea-glass' | 'prism' | 'obsidian' | 'frost' | 'ember' | 'aurora' | 'mono' | 'sand' | (string & {});
export type Mode = 'light' | 'dark' | 'auto';

/* ─── Theme provider ─── */
export interface MaterialGlassProviderProps {
  theme?: ThemeName;
  mode?: Mode;
  glass?: 'frosted' | 'milk' | 'smoked' | 'crystal' | 'clear' | 'paper';
  density?: 'comfortable' | 'compact' | 'dense';
  shape?: 'sharp' | 'soft' | 'round' | 'squircle';
  motion?: 'none' | 'calm' | 'standard' | 'expressive';
  font?: 'system' | 'inter' | 'geist' | 'jakarta' | 'serif' | 'mono';
  /** Apply to <html> instead of a wrapper, so portals and the page background follow too. */
  global?: boolean;
  children?: React.ReactNode;
}

const KEYS = ['theme', 'mode', 'glass', 'density', 'shape', 'motion', 'font'] as const;

export function MaterialGlassProvider(props: MaterialGlassProviderProps) {
  const { global, children } = props;
  const attrs: Record<string, string> = {};
  for (const k of KEYS) {
    const v = props[k];
    if (v && !(k === 'mode' && v === 'auto')) attrs[`data-mg-${k}`] = v;
  }
  const key = JSON.stringify(attrs);
  React.useEffect(() => {
    if (global) {
      const html = document.documentElement;
      for (const k of KEYS) html.removeAttribute(`data-mg-${k}`);
      for (const [k, v] of Object.entries(attrs)) html.setAttribute(k, v);
    }
    const raf = requestAnimationFrame(() => window.MaterialGlass?.refresh());
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [global, key]);
  if (global) return <>{children}</>;
  return <div style={{ display: 'contents' }} {...attrs}>{children}</div>;
}

/** Initialises material-glass.js behaviour (liquid selection, refraction, menus) inside an element. */
export function useMaterialGlass<T extends Element>(ref: React.RefObject<T | null>) {
  React.useEffect(() => {
    if (ref.current) window.MaterialGlass?.init(ref.current);
  }, [ref]);
}

/** MaterialGlass.toast, safe to call before the script loads (no-op). */
export function useToast() {
  return React.useCallback((message: string, opts?: { action?: string; onAction?: () => void; duration?: number }) => window.MaterialGlass?.toast(message, opts), []);
}

/* ─── Surfaces ─── */
export interface GlassProps extends Div {
  tier?: Tier;
  /** Edge refraction strength in px (Chromium). true = 24. */
  refract?: boolean | number;
  as?: keyof React.JSX.IntrinsicElements;
}
export const Glass = React.forwardRef<HTMLElement, GlassProps>(function Glass({ tier = 2, refract, as = 'div', className, ...rest }, ref) {
  const Tag = as as React.ElementType;
  const extra = refract ? { 'data-mg-refract': refract === true ? 24 : refract } : {};
  return <Tag ref={ref} className={cx(`mg-glass-${tier}`, className)} {...extra} {...rest} />;
});

export interface CardProps extends Div {
  tier?: Tier;
  variant?: 'glass' | 'elevated' | 'filled' | 'outlined';
  headline?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  interactive?: boolean;
}
export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card({ tier = 2, variant = 'glass', headline, subtitle, actions, interactive, className, children, ...rest }, ref) {
  return (
    <div ref={ref} className={cx('mg-card', variant === 'glass' ? `mg-glass-${tier}` : `mg-card--${variant}`, interactive && 'mg-card--interactive', className)} {...rest}>
      {headline != null && <h3 className="mg-card__title">{headline}</h3>}
      {subtitle != null && <p className="mg-card__subtitle">{subtitle}</p>}
      {children}
      {actions != null && <div className="mg-card__actions">{actions}</div>}
    </div>
  );
});

/* ─── Actions ─── */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'glass' | 'outlined' | 'text' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant = 'filled', size = 'md', icon, className, type = 'button', children, ...rest }, ref) {
  return (
    <button ref={ref} type={type} className={cx('mg-btn', variant !== 'filled' && `mg-btn--${variant}`, size !== 'md' && `mg-btn--${size}`, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
});

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  label: string;
  icon: React.ReactNode;
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  tier?: Tier;
}
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ label, icon, pressed, onPressedChange, tier, className, onClick, type = 'button', ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      className={cx('mg-icon-btn', tier !== undefined && `mg-glass-${tier}`, className)}
      onClick={(e) => { onClick?.(e); if (pressed !== undefined) onPressedChange?.(!pressed); }}
      {...rest}
    >
      {icon}
    </button>
  );
});

export interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { icon: React.ReactNode; label?: string }
export const Fab = React.forwardRef<HTMLButtonElement, FabProps>(function Fab({ icon, label, children, className, type = 'button', ...rest }, ref) {
  return (
    <button ref={ref} type={type} aria-label={children ? undefined : label} className={cx('mg-fab', children != null && 'mg-fab--extended', className)} {...rest}>
      {icon}
      {children}
    </button>
  );
});

/* ─── Selection ─── */
export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
}
export function Chip({ selected = false, onSelectedChange, className, children, onClick, ...rest }: ChipProps) {
  return (
    <button type="button" aria-pressed={selected} className={cx('mg-chip', className)} onClick={(e) => { onClick?.(e); onSelectedChange?.(!selected); }} {...rest}>
      <svg className="mg-chip__check" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      {children}
    </button>
  );
}

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label: string;
}
export function Switch({ checked, defaultChecked = false, onCheckedChange, label, className, onClick, ...rest }: SwitchProps) {
  const [inner, setInner] = React.useState(defaultChecked);
  const on = checked ?? inner;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={cx('mg-switch', className)}
      onClick={(e) => { onClick?.(e); if (checked === undefined) setInner(!on); onCheckedChange?.(!on); }}
      {...rest}
    />
  );
}

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> { label?: string }
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(function Slider({ label, className, style, min = 0, max = 100, value, defaultValue, onChange, ...rest }, ref) {
  const [inner, setInner] = React.useState(Number(defaultValue ?? min));
  const v = Number(value ?? inner);
  const pct = ((v - Number(min)) / (Number(max) - Number(min))) * 100;
  return (
    <input
      ref={ref}
      type="range"
      aria-label={label}
      className={cx('mg-slider', className)}
      min={min}
      max={max}
      value={value === undefined ? inner : value}
      onChange={(e) => { if (value === undefined) setInner(Number(e.target.value)); onChange?.(e); }}
      style={{ ...style, ['--mg-value' as string]: `${pct}%` }}
      {...rest}
    />
  );
});

export interface Option<T extends string = string> { value: T; label: React.ReactNode; icon?: React.ReactNode }
export interface SegmentedProps<T extends string = string> { label: string; options: Option<T>[]; value: T; onChange: (value: T) => void; className?: string; liquid?: boolean }
export function Segmented<T extends string = string>({ label, options, value, onChange, className, liquid = true }: SegmentedProps<T>) {
  const ref = React.useRef<HTMLDivElement>(null);
  useMaterialGlass(ref);
  return (
    <div ref={ref} role="group" aria-label={label} className={cx('mg-segmented mg-glass-1', className)} data-mg-liquid={liquid ? 'manual' : undefined}>
      {options.map((o) => (
        <button key={o.value} type="button" className="mg-segmented__item" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Text field ─── */
export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  supporting?: React.ReactNode;
  error?: React.ReactNode;
  variant?: 'glass' | 'outlined' | 'filled';
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
}
export const TextField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(function TextField({ label, supporting, error, variant = 'glass', leading, trailing, multiline, rows, className, id, ...rest }, ref) {
  const auto = React.useId();
  const inputId = id ?? auto;
  const supportId = `${inputId}-support`;
  const describe = error || supporting ? supportId : undefined;
  const common = { id: inputId, className: 'mg-field__input', 'aria-invalid': error ? true : undefined, 'aria-describedby': describe };
  const control = multiline
    ? <textarea ref={ref as React.Ref<HTMLTextAreaElement>} rows={rows} {...common} {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
    : <input ref={ref as React.Ref<HTMLInputElement>} {...common} {...rest} />;
  return (
    <div className={className}>
      <label className={cx('mg-field', variant !== 'glass' && `mg-field--${variant}`)} htmlFor={inputId}>
        <span className="mg-field__label">{label}</span>
        {leading || trailing ? <span className="mg-field__row">{leading}{control}{trailing}</span> : control}
      </label>
      {describe && <div id={supportId} className={cx('mg-field__support', error ? 'mg-field__support--error' : false)}><span>{error || supporting}</span></div>}
    </div>
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string }
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, className, ...rest }, ref) {
  return <select ref={ref} aria-label={label} className={cx('mg-select', className)} {...rest} />;
});

/* ─── Navigation ─── */
export interface NavBarProps extends React.HTMLAttributes<HTMLElement> { label: string; rail?: boolean; tier?: Tier; refract?: boolean | number }
export function NavBar({ label, rail, tier = 3, refract, className, children, ...rest }: NavBarProps) {
  const ref = React.useRef<HTMLElement>(null);
  useMaterialGlass(ref);
  const extra = refract ? { 'data-mg-refract': refract === true ? 24 : refract } : {};
  return <nav ref={ref} aria-label={label} className={cx('mg-nav', `mg-glass-${tier}`, rail && 'mg-rail', className)} data-mg-liquid="manual" {...extra} {...rest}>{children}</nav>;
}
export interface NavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { icon?: React.ReactNode; current?: boolean; href?: string }
export function NavItem({ icon, current, href, className, children, type = 'button', ...rest }: NavItemProps) {
  if (href) return <a href={href} className={cx('mg-nav__item', className)} aria-current={current ? 'page' : undefined}>{icon}{children}</a>;
  return <button type={type} className={cx('mg-nav__item', className)} aria-current={current ? 'page' : undefined} {...rest}>{icon}{children}</button>;
}

export interface TabsProps<T extends string = string> { label: string; items: Option<T>[]; value: T; onChange: (value: T) => void; secondary?: boolean; idPrefix?: string }
export function Tabs<T extends string = string>({ label, items, value, onChange, secondary, idPrefix = 'mg-tabs' }: TabsProps<T>) {
  const ref = React.useRef<HTMLDivElement>(null);
  useMaterialGlass(ref);
  const onKey = (e: React.KeyboardEvent) => {
    // material-glass.js already moved selection for this key (it calls preventDefault); don't move twice.
    if (e.defaultPrevented) return;
    const i = items.findIndex((t) => t.value === value);
    const n = e.key === 'ArrowRight' ? (i + 1) % items.length : e.key === 'ArrowLeft' ? (i - 1 + items.length) % items.length : -1;
    if (n < 0) return;
    e.preventDefault();
    onChange(items[n].value);
    requestAnimationFrame(() => (ref.current?.querySelectorAll<HTMLElement>('[role="tab"]')[n])?.focus());
  };
  return (
    <div ref={ref} role="tablist" aria-label={label} className={cx('mg-tabs', secondary && 'mg-tabs--secondary')} data-mg-liquid="manual" onKeyDown={onKey}>
      {items.map((t) => (
        <button key={t.value} type="button" role="tab" id={`${idPrefix}-${t.value}`} aria-controls={`${idPrefix}-${t.value}-panel`} aria-selected={t.value === value} tabIndex={t.value === value ? 0 : -1} className="mg-tab" onClick={() => onChange(t.value)}>
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}
export function TabPanel({ value, current, idPrefix = 'mg-tabs', children }: { value: string; current: string; idPrefix?: string; children?: React.ReactNode }) {
  return <div role="tabpanel" id={`${idPrefix}-${value}-panel`} aria-labelledby={`${idPrefix}-${value}`} className="mg-tab-panel" hidden={value !== current}>{children}</div>;
}

/* ─── Overlays ─── */
export interface DialogProps { open: boolean; onClose: (returnValue: string) => void; headline: React.ReactNode; actions?: React.ReactNode; variant?: 'basic' | 'alert' | 'fullscreen'; children?: React.ReactNode; className?: string }
export function Dialog({ open, onClose, headline, actions, variant = 'basic', children, className }: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} aria-labelledby={titleId} className={cx('mg-dialog mg-glass-3', variant !== 'basic' && `mg-dialog--${variant}`, className)} onClose={(e) => onClose((e.currentTarget as HTMLDialogElement).returnValue)}>
      <h2 className="mg-dialog__title" id={titleId}>{headline}</h2>
      <div className="mg-dialog__body">{children}</div>
      {actions != null && <form method="dialog" className="mg-dialog__actions">{actions}</form>}
    </dialog>
  );
}

/* ─── Feedback and display ─── */
export function Progress({ value, max = 100, label, wavy, className }: { value?: number; max?: number; label: string; wavy?: boolean; className?: string }) {
  return <progress className={cx('mg-progress', wavy && 'mg-progress--wavy', className)} value={value} max={max} aria-label={label} />;
}
export function CircularProgress({ value, label, size = 'md' }: { value?: number; label: string; size?: 'sm' | 'md' | 'lg' }) {
  const indeterminate = value === undefined;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cx('mg-progress-circle', size !== 'md' && `mg-progress-circle--${size}`, indeterminate && 'is-indeterminate')}
      style={indeterminate ? undefined : { ['--value' as string]: value }}
    />
  );
}
export function Badge({ tone = 'secondary', children }: { tone?: 'primary' | 'secondary' | 'tertiary' | 'error'; children?: React.ReactNode }) {
  return <span className={cx('mg-badge', tone !== 'secondary' && `mg-badge--${tone}`)}>{children}</span>;
}
export function Avatar({ tone = 'primary', size = 'md', status, children }: { tone?: 'primary' | 'secondary' | 'tertiary'; size?: 'sm' | 'md' | 'lg' | 'xl'; status?: 'online' | 'busy' | 'away'; children?: React.ReactNode }) {
  return <span className={cx('mg-avatar', tone !== 'primary' && `mg-avatar--${tone}`, size !== 'md' && `mg-avatar--${size}`)} data-status={status}>{children}</span>;
}
export function Skeleton({ kind = 'text', width }: { kind?: 'text' | 'title' | 'circle' | 'block'; width?: number | string }) {
  return <span aria-hidden="true" className={cx('mg-skeleton', kind !== 'text' && `mg-skeleton--${kind}`)} style={width !== undefined ? { width } : undefined} />;
}
