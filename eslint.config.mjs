import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const config = [
  // `effects/` is a local scratch area for motion experiments, not part of the shipped app
  { ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts', 'effects/**'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // Static export runs with images.unoptimized, so plain <img> is intentional for the
    // brand assets and certificate scans that must also work without the Next image runtime.
    files: [
      'src/components/Nav.tsx',
      'src/components/Footer.tsx',
      'src/components/SocialLinks.tsx',
      'src/components/HeroVideo.tsx',
      'src/components/CertificateMarquee.tsx',
    ],
    rules: { '@next/next/no-img-element': 'off' },
  },
]

export default config
