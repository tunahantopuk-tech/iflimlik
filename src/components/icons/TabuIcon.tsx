import React from 'react';
import Svg, { Path, Circle, G } from 'react-native-svg';

interface TabuIconProps {
  size?: number;
  color?: string;
}

export const TabuIcon: React.FC<TabuIconProps> = ({ size = 32, color = '#fff' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Speech bubble */}
      <Path
        d="M8 12C8 9.79086 9.79086 8 12 8H36C38.2091 8 40 9.79086 40 12V28C40 30.2091 38.2091 32 36 32H24L16 40V32H12C9.79086 32 8 30.2091 8 28V12Z"
        fill={color}
        opacity="0.9"
      />
      {/* Microphone */}
      <G transform="translate(18, 14)">
        <Path
          d="M6 0C4.34315 0 3 1.34315 3 3V7C3 8.65685 4.34315 10 6 10C7.65685 10 9 8.65685 9 7V3C9 1.34315 7.65685 0 6 0Z"
          fill="#1a1a2e"
        />
        <Path
          d="M1 6C1 6 1 9 6 9C11 9 11 6 11 6"
          stroke="#1a1a2e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <Path
          d="M6 9V12M4 12H8"
          stroke="#1a1a2e"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};
