import afiLogo from '../../../imports/AFI_logo.png';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Show just the image with no wrapper (for use in containers that already handle sizing) */
  raw?: boolean;
}

const sizeMap = {
  xs: 28,
  sm: 40,
  md: 64,
  lg: 88,
};

export function Logo({ size = 'md', raw = false }: LogoProps) {
  const px = sizeMap[size];

  if (raw) {
    return (
      <img
        src={afiLogo}
        alt="AFI"
        style={{ width: px, height: px, objectFit: 'contain', display: 'block' }}
      />
    );
  }

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: px * 0.22,
        background: '#ffffff',
        boxShadow: '0 4px 24px rgba(99,102,241,0.35), 0 1px 4px rgba(0,0,0,0.18)',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={afiLogo}
        alt="AFI"
        style={{ width: '88%', height: '88%', objectFit: 'contain' }}
      />
    </div>
  );
}
