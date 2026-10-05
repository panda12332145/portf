import {
  Anchor,
  Bird,
  BookOpen,
  Brush,
  Camera,
  Cloud,
  Coffee,
  Compass,
  Crown,
  Droplet,
  Feather,
  Flame,
  Flower,
  Flower2,
  Gem,
  Heart,
  Infinity as InfinityIcon,
  Leaf,
  LibraryBig,
  Moon,
  Mountain,
  Music,
  Palette,
  PenTool,
  Scissors,
  Shell,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Trees,
  Wand2,
  Waves,
} from "lucide-react";
import type { ComponentType } from "react";

/* ==================================================================
 *  Ícones do site
 *  O ícone da marca (cabeçalho e rodapé) vem do banco: guardamos só
 *  o nome e resolvemos aqui — assim dá para trocar pelo painel sem
 *  tocar no código.
 * ================================================================== */

export const SITE_ICONS = {
  Flower2,
  Flower,
  Sun,
  Moon,
  Star,
  Sparkles,
  Heart,
  Leaf,
  Sprout,
  Trees,
  Bird,
  Feather,
  Brush,
  Palette,
  PenTool,
  BookOpen,
  LibraryBig,
  Camera,
  Gem,
  Shell,
  Waves,
  Flame,
  Crown,
  Coffee,
  Compass,
  Anchor,
  Infinity: InfinityIcon,
  Music,
  Scissors,
  Wand2,
  Droplet,
  Cloud,
  Mountain,
} as const;

export type SiteIconName = keyof typeof SITE_ICONS;

export const SITE_ICON_NAMES = Object.keys(SITE_ICONS) as SiteIconName[];

export function isSiteIcon(name: string): name is SiteIconName {
  return name in SITE_ICONS;
}

export function SiteIcon({
  name,
  size = 16,
  className,
  strokeWidth = 2,
}: {
  name?: string | null;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Glyph: ComponentType<{ size?: number; className?: string; strokeWidth?: number }> =
    name && isSiteIcon(name) ? SITE_ICONS[name] : Flower2;
  return <Glyph size={size} className={className} strokeWidth={strokeWidth} />;
}

export default SiteIcon;
