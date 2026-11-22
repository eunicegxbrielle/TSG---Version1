/**
 * Tribute avatar helpers:
 * - Deterministic Hunger Games-styled SVG portrait data URIs (works 100% offline/sandboxed)
 * - Preset portrait gallery for quick profile selection
 * - Client-side image resize helper for uploaded profile photos
 */

interface AvatarPalette {
  bg1: string;
  bg2: string;
  accent: string;
  skin: string;
  hair: string;
  outfit: string;
}

const AVATAR_PALETTES: AvatarPalette[] = [
  { bg1: '#231710', bg2: '#0f0b08', accent: '#f59e0b', skin: '#e8bfa0', hair: '#2a1d17', outfit: '#292524' },
  { bg1: '#1c1917', bg2: '#0c0a09', accent: '#fbbf24', skin: '#f2cfb6', hair: '#d4a359', outfit: '#1e293b' },
  { bg1: '#0f1f24', bg2: '#071115', accent: '#38bdf8', skin: '#dfb190', hair: '#7c4a2d', outfit: '#164e63' },
  { bg1: '#231117', bg2: '#12080b', accent: '#fb7185', skin: '#edd0b9', hair: '#451a1a', outfit: '#3b0764' },
  { bg1: '#1a2013', bg2: '#0d1109', accent: '#a3e635', skin: '#c68b59', hair: '#1c1917', outfit: '#365314' },
  { bg1: '#1e1b2e', bg2: '#0f0d18', accent: '#f59e0b', skin: '#8d5524', hair: '#171717', outfit: '#312e81' },
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function createTributeSvgAvatar(name: string, paletteIndex?: number): string {
  const safeName = (name || 'T').trim();
  const h = hashString(safeName);
  const p = AVATAR_PALETTES[paletteIndex !== undefined ? paletteIndex % AVATAR_PALETTES.length : h % AVATAR_PALETTES.length];
  const initial = safeName.charAt(0).toUpperCase();
  const hairVariant = h % 3;

  const hairPath =
    hairVariant === 0
      ? `<path d="M38 56 C36 28, 92 28, 90 56 C86 38, 42 38, 38 56 Z" fill="${p.hair}" />
         <path d="M38 54 L34 86 C40 80, 42 66, 44 56 Z" fill="${p.hair}" />`
      : hairVariant === 1
      ? `<path d="M36 56 C36 24, 92 24, 92 56 C84 42, 44 42, 36 56 Z" fill="${p.hair}" />`
      : `<path d="M35 60 C34 24, 94 24, 93 60 C96 76, 90 90, 84 92 L82 60 C72 44, 56 44, 46 60 L44 92 C38 90, 32 76, 35 60 Z" fill="${p.hair}" />`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <defs>
      <radialGradient id="bg" cx="50%" cy="35%" r="70%">
        <stop offset="0%" stop-color="${p.bg1}" />
        <stop offset="100%" stop-color="${p.bg2}" />
      </radialGradient>
    </defs>
    <rect width="128" height="128" rx="64" fill="url(#bg)" />
    <circle cx="64" cy="64" r="59" fill="none" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="2" />
    <path d="M22 126 C26 96, 102 96, 106 126 Z" fill="${p.outfit}" />
    <path d="M48 99 L64 114 L80 99" fill="none" stroke="${p.accent}" stroke-width="2.5" stroke-linecap="round" />
    <rect x="55" y="76" width="18" height="18" rx="6" fill="${p.skin}" />
    <circle cx="64" cy="58" r="24" fill="${p.skin}" />
    ${hairPath}
    <circle cx="55" cy="59" r="2.4" fill="#171717" />
    <circle cx="73" cy="59" r="2.4" fill="#171717" />
    <path d="M58 70 Q64 74 70 70" fill="none" stroke="#6b3e26" stroke-width="2" stroke-linecap="round" />
    <circle cx="102" cy="26" r="12" fill="${p.bg2}" stroke="${p.accent}" stroke-width="1.5" />
    <text x="102" y="30" text-anchor="middle" font-family="serif" font-weight="bold" font-size="11" fill="${p.accent}">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRESET_AVATARS: { id: string; label: string; url: string }[] = [
  { id: 'mockingjay', label: 'Mockingjay Gold', url: createTributeSvgAvatar('Mockingjay', 0) },
  { id: 'victor', label: 'Capitol Amber', url: createTributeSvgAvatar('Victor', 1) },
  { id: 'tide', label: 'District Tide', url: createTributeSvgAvatar('Fin', 2) },
  { id: 'ember', label: 'Crimson Ember', url: createTributeSvgAvatar('Ember', 3) },
  { id: 'meadow', label: 'Forest Tribute', url: createTributeSvgAvatar('Rue', 4) },
  { id: 'atelier', label: 'Capitol Atelier', url: createTributeSvgAvatar('Cinna', 5) },
];

export function resizeImageFileToDataUrl(file: File, maxSize: number = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Invalid image file'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
