import originalCan from './assets/original.png';
import ultraWhiteCan from './assets/ultra-white.png';
import pipelineCan from './assets/pipeline-punch.png';
import mangoCan from './assets/mango-loco.png';

// Each can is the uploaded photo with its background removed; the can pixels are unchanged.
export const FLAVORS = [
  {
    id: 'original',
    name: 'Original',
    short: 'Original',
    tag: 'The classic energy hit.',
    accent: '#8cff1a',
    src: originalCan,
    desc:
      'The original. Bold, crisp and built for the moment you need to push harder. The same relentless energy that started it all.',
    chips: ['Classic formula', 'Bold and crisp', 'Built for focus'],
  },
  {
    id: 'ultra-white',
    name: 'Ultra White',
    short: 'Ultra White',
    tag: 'Clean energy. Zero sugar.',
    accent: '#8fe8ff',
    src: ultraWhiteCan,
    desc:
      'Clean energy with zero sugar. Light, sharp and ice-cold, it keeps you locked in from the first sip to the last.',
    chips: ['Zero sugar', 'Clean finish', 'Ice-cold crisp'],
  },
  {
    id: 'pipeline-punch',
    name: 'Pipeline Punch',
    short: 'Pipeline Punch',
    tag: 'Tropical vibes. Maximum energy.',
    accent: '#ff4f8f',
    src: pipelineCan,
    desc:
      'Tropical punch with a bright, fruity kick. Maximum energy for the days that need a little extra color.',
    chips: ['Tropical notes', 'Fruity kick', 'Maximum energy'],
  },
  {
    id: 'mango-loco',
    name: 'Mango Loco',
    short: 'Mango Loco',
    tag: 'Exotic flavor. All the energy.',
    accent: '#35c8ff',
    src: mangoCan,
    desc:
      'Ripe mango, a sunny burst and a bold energy hit. Juiced up for the moments that deserve a little more flavor.',
    chips: ['Mango juice', 'Exotic flavor', 'All the energy'],
  },
];

export const DEFAULT_ACCENT = '#8cff1a';
