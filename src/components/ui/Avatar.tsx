import Image from 'next/image';

export interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  verified?: boolean;
  className?: string;
}

export function Avatar({ src, alt, size = 'md', verified = false, className = '' }: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-11 w-11',
    lg: 'h-14 w-14',
    xl: 'h-20 w-20',
    '2xl': 'h-24 w-24',
  };

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      <div className={`${sizes[size]} rounded-full overflow-hidden bg-[#1A1A22] border border-[#2D2D38] relative flex items-center justify-center`}>
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#71717A]">
            <svg className="w-1/2 h-1/2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>
      {verified && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-[#FF1493] rounded-full p-0.5 border-2 border-[#08080A] shadow-sm">
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>
      )}
    </div>
  );
}
