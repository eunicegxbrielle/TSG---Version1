import React, { useState } from 'react';
import { Player } from '../types';
import { createTributeSvgAvatar } from '../utils/avatars';

interface TributeAvatarProps {
  name: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
}

const SIZE_CLASSES: Record<NonNullable<TributeAvatarProps['size']>, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

export const TributeAvatar: React.FC<TributeAvatarProps> = ({
  name,
  avatarUrl,
  size = 'sm',
  className = '',
  onClick,
  title,
}) => {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = !imgError && avatarUrl ? avatarUrl : createTributeSvgAvatar(name);

  const baseClass = `${SIZE_CLASSES[size]} rounded-full object-cover border border-amber-500/60 dark:border-amber-500/50 bg-stone-200 dark:bg-[#181b26] shrink-0 overflow-hidden shadow-sm ${
    onClick ? 'cursor-pointer hover:border-amber-600 dark:hover:border-amber-300 hover:scale-105 transition-all' : ''
  } ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title || `View ${name}'s Profile`}
        className="inline-flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400/60 shrink-0"
      >
        <img
          src={resolvedSrc}
          alt={name}
          onError={() => setImgError(true)}
          className={baseClass}
        />
      </button>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={name}
      title={title}
      onError={() => setImgError(true)}
      className={baseClass}
    />
  );
};

export function resolvePlayerAvatar(
  playerId: string,
  name: string,
  tributes: Player[],
  fallbackAvatarUrl?: string
): string | undefined {
  return tributes.find((t) => t.id === playerId)?.avatarUrl || fallbackAvatarUrl;
}
