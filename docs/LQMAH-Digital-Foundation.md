# LQMAH Digital Foundation

## Brand Rules

LQMAH uses a warm, cinematic visual language: dark burgundy and near-black environments, cream editorial typography, restrained gold accents, and image-led compositions. Cormorant Garamond is reserved for editorial headings, Inter for interface and body copy, and Noto Naskh Arabic for short decorative accents. Theme values live in `src/styles/theme.css`.

## Site Map

- `/` - Homepage and scroll story
- `/menu` - Searchable, categorized menu with product details
- `/about` - Philosophy, craft, atmosphere, and community
- `/gallery` - Filtered gallery with keyboard-accessible lightbox
- `/contact` - Replaceable business information and demo inquiry form
- `/order` - Future ordering landing page; no checkout is active

## Component Architecture

Shared layout primitives live in `src/components/layout`. Navigation and the global footer are rendered by the root layout. Interactive experiences live in `src/components/ui`; page routes remain Server Components where possible. `MediaFallback` is the single missing-image boundary.

## Animation System

GSAP and ScrollTrigger own major timelines and scroll scenes. Framer Motion wrappers are available for interface transitions. Lenis provides global smooth scrolling. Shared constants live in `src/lib/motion.ts`. Reduced-motion CSS removes sticky storytelling and shortens or disables motion.

## Image Assets

Replaceable paths are centralized in `src/data/images.ts`. Product image paths live with products in `src/data/menu.ts`. Add approved photography under `public/images/{logo,exterior,interior,coffee,desserts,gallery,menu}` using the configured names. Missing files display branded color fields and never expose broken-image icons. Do not overwrite user-provided assets.

## Content Updates

- Menu categories and products: `src/data/menu.ts`
- Featured products: set `featured: true` on approved menu items
- Reviews: `src/data/site.ts`; replace only with verified, attributed reviews
- Business details and social links: `src/data/site.ts`
- Gallery records: `src/data/images.ts`

All current reviews, address, phone, email, hours, social URLs, and prices are explicitly temporary or omitted.

## Future Integrations

Online ordering should connect the existing `/order` experience and product dialog to an approved commerce provider. The contact form currently validates and demonstrates a success state but sends no email.

The chocolate scene is a CSS and GSAP visual simulation, not fluid physics. Its visual module can later be replaced with an approved transparent WebM, an optimized frame sequence, or a professional filmed clip. A future true 3D implementation should preserve the same reduced-motion and mobile fallback paths.
