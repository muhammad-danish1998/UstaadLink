import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UstaadLink — Teacher & School Recruitment Marketplace',
    short_name: 'UstaadLink',
    description: 'Direct recruitment platform connecting qualified teachers with schools across Karachi.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/logo.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}
