import type { Config } from 'tailwindcss';
import navoPreset from '@navo/design-tokens/tailwind';

const config: Config = {
  presets: [navoPreset as Config],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [],
};

export default config;
