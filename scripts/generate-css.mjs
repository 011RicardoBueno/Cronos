import fs from 'fs/promises';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from '../tailwind.config.js';

const src = await fs.readFile('src/index.css', 'utf8');
console.log('tailwindConfig keys:', Object.keys(tailwindConfig));
console.log('brand config:', tailwindConfig.theme?.extend?.colors?.brand);
const result = await postcss([tailwind({ config: tailwindConfig }), autoprefixer()]).process(src, { from: 'src/index.css' });
await fs.writeFile('/tmp/tw-output.css', result.css, 'utf8');
console.log('wrote /tmp/tw-output.css');
