import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface TheaterIconProps {
  size?: number;
  color?: string;
}

export default function TheaterIcon({ size = 24, color = '#FFD700' }: TheaterIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Comedy Mask (Smiling) - Left */}
      <Circle cx="8" cy="10" r="6" stroke={color} strokeWidth="1.5" fill="none" />
      <Path
        d="M 5.5 10 Q 8 12.5 10.5 10"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="6.5" cy="8.5" r="0.8" fill={color} />
      <Circle cx="9.5" cy="8.5" r="0.8" fill={color} />

      {/* Tragedy Mask (Sad) - Right */}
      <Circle cx="16" cy="10" r="6" stroke={color} strokeWidth="1.5" fill="none" />
      <Path
        d="M 13.5 12 Q 16 9.5 18.5 12"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="14.5" cy="8.5" r="0.8" fill={color} />
      <Circle cx="17.5" cy="8.5" r="0.8" fill={color} />

      {/* Bottom decoration */}
      <Path
        d="M 8 16 L 8 20 M 16 16 L 16 20"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
