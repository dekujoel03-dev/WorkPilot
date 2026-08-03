import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const BRAND = {
  wordmarkLight: '/brand/logo-wordmark-light.png',
  wordmarkDark: '/brand/logo-wordmark-dark.png',
  markLight: '/brand/logo-mark-light.png',
  markDark: '/brand/logo-mark-dark.png',
  stackedLight: '/brand/logo-stacked-light.png',
  stackedDark: '/brand/logo-stacked-dark.png',
  icon: '/brand/logo-icon.png',
} as const;

type LogoVariant = 'banner' | 'mark' | 'icon' | 'stacked';
type LogoSize = 'xs' | 'sm' | 'md';
type LogoTone = 'auto' | 'light' | 'dark';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  tone?: LogoTone;
  className?: string;
  linkClassName?: string;
  asLink?: boolean;
}

const WORDMARK_HEIGHT = {
  sm: 'h-8',
  md: 'h-11',
} as const;

const MARK_HEIGHT = {
  xs: 'h-3',
  sm: 'h-4',
  md: 'h-5',
} as const;

const APP_ICON_SIZE = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9 sm:h-10 sm:w-10',
} as const;

function ThemedImage({
  lightSrc,
  darkSrc,
  alt,
  tone,
  className,
}: {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  tone: LogoTone;
  className?: string;
}) {
  if (tone === 'light') {
    return <img src={lightSrc} alt={alt} draggable={false} className={className} />;
  }
  if (tone === 'dark') {
    return <img src={darkSrc} alt={alt} draggable={false} className={className} />;
  }

  return (
    <>
      <img src={lightSrc} alt={alt} draggable={false} className={cn('dark:hidden', className)} />
      <img src={darkSrc} alt={alt} draggable={false} className={cn('hidden dark:block', className)} />
    </>
  );
}

export function Logo({
  variant = 'banner',
  size = 'md',
  tone = 'auto',
  className,
  linkClassName,
  asLink = true,
}: LogoProps) {
  const wordmarkSize = size === 'xs' || size === 'sm' ? 'sm' : 'md';

  const content =
    variant === 'banner' ? (
      <ThemedImage
        lightSrc={BRAND.wordmarkLight}
        darkSrc={BRAND.wordmarkDark}
        alt="WorkPilot"
        tone={tone}
        className={cn(
          'w-auto shrink-0 object-contain object-left',
          WORDMARK_HEIGHT[wordmarkSize],
          className,
        )}
      />
    ) : variant === 'mark' ? (
      <ThemedImage
        lightSrc={BRAND.markLight}
        darkSrc={BRAND.markDark}
        alt=""
        tone={tone}
        className={cn(
          'block w-auto max-w-none shrink-0 object-contain object-left',
          MARK_HEIGHT[size],
          className,
        )}
      />
    ) : variant === 'stacked' ? (
      <ThemedImage
        lightSrc={BRAND.stackedLight}
        darkSrc={BRAND.stackedDark}
        alt="WorkPilot"
        tone={tone}
        className={cn('h-24 w-auto object-contain sm:h-28', className)}
      />
    ) : (
      <img
        src={BRAND.icon}
        alt="WorkPilot"
        draggable={false}
        className={cn('shrink-0 rounded-[var(--radius-md)] object-cover', APP_ICON_SIZE[size], className)}
      />
    );

  if (!asLink) {
    return (
      <div className={cn('inline-flex shrink-0 items-center overflow-visible', className)}>
        {content}
      </div>
    );
  }

  return (
    <Link to="/" className={cn('inline-flex shrink-0 items-center', linkClassName)}>
      {content}
    </Link>
  );
}
