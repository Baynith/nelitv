import React, { useState } from 'react';
import { Tv } from 'lucide-react';

interface ChannelLogoProps {
  src?: string;
  name: string;
  category?: string;
  className?: string;
}

export const ChannelLogo: React.FC<ChannelLogoProps> = ({
  src,
  name,
  category,
  className = 'max-h-full max-w-full object-contain group-hover:scale-105 transition',
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    const initials = name
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 3)
      .join('')
      .toUpperCase() || 'TV';

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-2 text-center select-none rounded-lg">
        <Tv className="w-5 h-5 text-cyan-400 mb-1 opacity-80" />
        <span className="text-[11px] font-black text-white truncate max-w-full px-1">{initials}</span>
        {category && (
          <span className="text-[8px] text-slate-400 truncate max-w-full mt-0.5">{category}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        if (src && !img.src.includes('/api/proxy/image')) {
          img.src = `/api/proxy/image?url=${encodeURIComponent(src)}`;
        } else {
          setHasError(true);
        }
      }}
      className={className}
      loading="lazy"
    />
  );
};
