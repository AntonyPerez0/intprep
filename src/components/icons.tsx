// Central icon registry. The whole UI uses Lucide (stroke icons) — never emoji.
// Content files still carry an emoji `icon` field for backwards compatibility;
// do NOT render those. Use the maps below instead.

import {
  ArrowLeftRight,
  ArrowRight,
  Award,
  BadgeCheck,
  Binary,
  BookMarked,
  BookOpen,
  Boxes,
  Brain,
  Braces,
  CalendarCheck,
  CalendarRange,
  ChartColumnIncreasing,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock,
  CodeXml,
  Coins,
  Command,
  Compass,
  Copy,
  Crown,
  Download,
  Dumbbell,
  ExternalLink,
  Eye,
  FlaskConical,
  Flame,
  Gauge,
  Gem,
  GitBranch,
  GraduationCap,
  Grid3x3,
  Hash,
  House,
  Info,
  Keyboard,
  Layers,
  LayoutDashboard,
  Library,
  Lightbulb,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Lock,
  type LucideIcon,
  type LucideProps,
  Map as MapIcon,
  MessageSquare,
  Milestone,
  Monitor,
  Moon,
  Mountain,
  Network,
  Pi,
  Play,
  Puzzle,
  Pyramid,
  RefreshCw,
  Repeat,
  Repeat2,
  Rocket,
  RotateCcw,
  Route,
  Search,
  Settings,
  Share2,
  Shuffle,
  Snowflake,
  Sparkles,
  SquareFunction,
  Star,
  Sun,
  Sunrise,
  Target,
  Terminal,
  Timer,
  TrendingUp,
  TriangleAlert,
  Trophy,
  Type,
  Undo2,
  Upload,
  User,
  Volume2,
  Waypoints,
  Wrench,
  X,
  Zap,
  Columns2,
} from 'lucide-react';
import type { CategoryId } from '../content/types';

export type { LucideIcon };

export const CATEGORY_ICON: Record<CategoryId, LucideIcon> = {
  'arrays-hashing': Hash,
  'two-pointers': ArrowLeftRight,
  stack: Layers,
  'binary-search': Search,
  'sliding-window': Columns2,
  'linked-list': Link2,
  trees: Network,
  tries: Type,
  heap: Pyramid,
  backtracking: Undo2,
  graphs: Share2,
  'dp-1d': ChartColumnIncreasing,
  intervals: CalendarRange,
  greedy: Coins,
  'advanced-graphs': Waypoints,
  'dp-2d': Grid3x3,
  'bit-manipulation': Binary,
  'math-geometry': Pi,
};

export const LESSON_ICON: Record<string, LucideIcon> = {
  'how-to-learn': Compass,
  'python-basics': CodeXml,
  'control-flow': GitBranch,
  'lists-and-strings': List,
  'dicts-and-sets': Braces,
  'functions-and-classes': SquareFunction,
  'big-o': Gauge,
  recursion: RefreshCw,
  'data-structures-tour': Boxes,
  'solving-a-problem': Lightbulb,
  'leetcode-mechanics': Terminal,
};

export const SCIENCE_ICON: Record<string, LucideIcon> = {
  'retrieval-practice': Brain,
  'spaced-repetition': CalendarCheck,
  interleaving: Shuffle,
  pretesting: Target,
  'worked-examples': ListOrdered,
  chunking: Boxes,
  'self-explanation': MessageSquare,
  'parsons-problems': Puzzle,
  'desirable-difficulties': Dumbbell,
  calibration: Gauge,
  'deliberate-practice': Target,
  flow: TrendingUp,
  motivation: Compass,
  habits: Repeat,
};

/**
 * Generic named icons. Used by toasts, achievements and anywhere an icon is
 * chosen by data rather than imported directly.
 */
export const ICONS = {
  // navigation
  home: House,
  dashboard: LayoutDashboard,
  learn: MapIcon,
  path: Route,
  review: Repeat2,
  bolt: Zap,
  blitz: Zap,
  user: User,
  book: BookOpen,
  library: Library,
  list: List,
  flask: FlaskConical,
  search: Search,
  settings: Settings,
  command: Command,
  // actions
  x: X,
  check: Check,
  lock: Lock,
  chevron: ChevronRight,
  back: ChevronLeft,
  arrow: ArrowRight,
  external: ExternalLink,
  keyboard: Keyboard,
  play: Play,
  copy: Copy,
  download: Download,
  upload: Upload,
  reset: RotateCcw,
  eye: Eye,
  // status
  success: CircleCheck,
  error: CircleX,
  info: Info,
  warning: TriangleAlert,
  // gamification
  flame: Flame,
  gem: Gem,
  star: Star,
  trophy: Trophy,
  award: Award,
  crown: Crown,
  target: Target,
  snowflake: Snowflake,
  wrench: Wrench,
  sunrise: Sunrise,
  rocket: Rocket,
  sparkles: Sparkles,
  timer: Timer,
  clock: Clock,
  mountain: Mountain,
  milestone: Milestone,
  badge: BadgeCheck,
  checks: ListChecks,
  grad: GraduationCap,
  bookmark: BookMarked,
  brain: Brain,
  lightbulb: Lightbulb,
  message: MessageSquare,
  puzzle: Puzzle,
  layers: Layers,
  trending: TrendingUp,
  repeat: Repeat,
  // settings
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
  volume: Volume2,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

/** Render a registry icon by name. Defaults: 16px, 1.75 stroke. */
export function Icon({ name, size = 16, strokeWidth = 1.75, ...rest }: { name: IconName | string } & LucideProps) {
  const C = (ICONS as Record<string, LucideIcon>)[name] ?? Info;
  return <C size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />;
}

/** Category icon inside a tinted tile using the category colour. */
export function CategoryIcon({
  id,
  color,
  size = 'md',
  solid,
}: {
  id: CategoryId;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  solid?: boolean;
}) {
  const C = CATEGORY_ICON[id];
  return (
    <span className={`icon-tile ${size === 'md' ? '' : size} ${solid ? 'solid' : ''}`} style={{ ['--c' as string]: color }} aria-hidden="true">
      <C strokeWidth={1.9} />
    </span>
  );
}

/** Any Lucide icon inside a tinted tile. */
export function IconTile({
  icon: C,
  color = 'var(--brand)',
  size = 'md',
  solid,
}: {
  icon: LucideIcon;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  solid?: boolean;
}) {
  return (
    <span className={`icon-tile ${size === 'md' ? '' : size} ${solid ? 'solid' : ''}`} style={{ ['--c' as string]: color }} aria-hidden="true">
      <C strokeWidth={1.9} />
    </span>
  );
}
