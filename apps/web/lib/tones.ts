import type { IconTone } from '@/lib/types';

/** Background + foreground color pairs for template icons, one per tone. */
export const TONE_CLASSES: Record<IconTone, string> = {
  amber:  'bg-amber-500/[0.12] text-amber-400',
  green:  'bg-emerald-500/[0.12] text-emerald-400',
  rose:   'bg-rose-500/[0.12] text-rose-400',
  blue:   'bg-sky-500/[0.12] text-sky-400',
  violet: 'bg-violet-500/[0.12] text-violet-400',
  teal:   'bg-teal-500/[0.12] text-teal-400',
};
