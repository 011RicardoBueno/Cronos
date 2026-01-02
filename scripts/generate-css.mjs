import fs from 'fs/promises';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from '../tailwind.config.js';

const src = await fs.readFile('src/index.css', 'utf8');
console.log('tailwindConfig keys:', Object.keys(tailwindConfig));

// Adiciona safelist para forçar a geração das classes de 'brand' para verificação,
// mesmo que não estejam sendo usadas nos arquivos de conteúdo.
const config = {
  ...tailwindConfig,
  safelist: [
    ...(tailwindConfig.safelist || []),
    { pattern: /(bg|text|border)-brand-.+/ },
  ],
};

const result = await postcss([tailwind({ config }), autoprefixer()]).process(src, { from: 'src/index.css' });
await fs.writeFile('/tmp/tw-output.css', result.css, 'utf8');
console.log('wrote /tmp/tw-output.css');
