import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MiEstilo — Luxury Linen Inventory & ERP',
    short_name: 'MiEstilo ERP',
    description: 'Enterprise inventory, warehouse operations, and sales order fulfillment system for hotel and hospitality linen.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F3F5F4',
    theme_color: '#171B18',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
