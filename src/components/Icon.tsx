import Svg, { Circle, Ellipse, Line, Path, Rect, type SvgProps } from 'react-native-svg';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

export type IconName =
  | 'fire'
  | 'gem'
  | 'heart'
  | 'heart-broken'
  | 'user'
  | 'check'
  | 'lock'
  | 'close'
  | 'arrow-back'
  | 'medal'
  | 'sparkle'
  | 'home'
  | 'profile'
  | 'star'
  | 'check-badge'
  | 'true'
  | 'false';

export function Icon({ name, size = 24, color = '#ffffff' }: Props) {
  const svg = icons[name];
  if (!svg) return null;
  return svg({ size, color });
}

type Renderer = (p: { size: number; color: string }) => React.ReactNode;

const base = (size: number): SvgProps => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
});

const icons: Record<IconName, Renderer> = {
  fire: ({ size, color }) => (
    <Svg {...base(size)}>
      <Path
        d="M12 2c0 4-4 6-4 10a4 4 0 0 0 8 0c0-2-1-3-2-4 0 2-1 3-2 3s-2-1-2-3c0-1.5 2-4 2-6Z"
        fill={color}
      />
    </Svg>
  ),

  gem: ({ size, color }) => (
    <Svg {...base(size)}>
      <Path
        d="M6 3h12l4 6-10 12L2 9l4-6Z"
        fill={color}
        opacity={0.2}
      />
      <Path
        d="M6 3h12l4 6-10 12L2 9l4-6Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M2 9h20M12 21 8 9l4-6 4 6-4 12Z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  ),

  heart: ({ size, color }) => (
    <Svg {...base(size)}>
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
        fill={color}
      />
    </Svg>
  ),

  'heart-broken': ({ size, color }) => (
    <Svg {...base(size)}>
      <Path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
        fill={color}
      />
      <Path
        d="M12 5l-1.5 4 3-1-1.5 4.5-3-1 1.5-3.5"
        stroke="#ffffff"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),

  user: ({ size, color }) => (
    <Svg {...base(size)}>
      <Circle cx={12} cy={8} r={4} fill={color} />
      <Path d="M4 20c0-3.31 3.58-6 8-6s8 2.69 8 6" fill={color} />
    </Svg>
  ),

  check: ({ size, color }) => (
    <Svg {...base(size)}>
      <Path
        d="M5 12.5l4.5 4.5L19 7"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),

  lock: ({ size, color }) => (
    <Svg {...base(size)}>
      <Rect x={5} y={11} width={14} height={10} rx={2} fill={color} />
      <Path
        d="M8 11V7a4 4 0 0 1 8 0v4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  ),

  close: ({ size, color }) => (
    <Svg {...base(size)}>
      <Path
        d="M6 6l12 12M18 6 6 18"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  ),

  'arrow-back': ({ size, color }) => (
    <Svg {...base(size)}>
      <Path
        d="M10 19l-7-7 7-7M3 12h18"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),

  medal: ({ size, color }) => (
    <Svg {...base(size)}>
      <Circle cx={12} cy={10} r={6} fill={color} />
      <Circle cx={12} cy={10} r={3.5} fill="none" stroke="#ffffff" strokeWidth={1.5} />
      <Path d="M8.5 15l-2 6.5 5.5-2 5.5 2-2-6.5" fill={color} opacity={0.7} />
    </Svg>
  ),

  sparkle: ({ size, color }) => (
    <Svg {...base(size)}>
      <Path
        d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2Z"
        fill={color}
      />
    </Svg>
  ),

  star: ({ size, color }) => (
    <Svg {...base(size)}>
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2Z"
        fill={color}
      />
    </Svg>
  ),

  home: ({ size, color }) => (
    <Svg {...base(size)}>
      <Path
        d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5Z"
        fill={color}
      />
    </Svg>
  ),

  profile: ({ size, color }) => (
    <Svg {...base(size)}>
      <Circle cx={12} cy={8} r={4.5} stroke={color} strokeWidth={2} />
      <Path
        d="M4 20.5c0-3.6 3.6-6.5 8-6.5s8 2.9 8 6.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  ),

  'check-badge': ({ size, color }) => (
    <Svg {...base(size)}>
      <Circle cx={12} cy={12} r={10} fill={color} />
      <Path
        d="M7.5 12.5l3 3 6-6"
        stroke="#ffffff"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),

  true: ({ size, color }) => (
    <Svg {...base(size)}>
      <Path
        d="M5 12.5l4.5 4.5L19 7"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  ),

  false: ({ size, color }) => (
    <Svg {...base(size)}>
      <Path
        d="M6 6l12 12M18 6 6 18"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  ),
};
