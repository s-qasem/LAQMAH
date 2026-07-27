# LQMAH Project Rules

- Read relevant guidance in `node_modules/next/dist/docs/` before changing Next.js code.
- Keep App Router pages and layouts as Server Components unless browser APIs require a client boundary.
- Use theme tokens from `src/styles/theme.css`; do not hardcode brand colors in components.
- Use `next/font`, `next/image`, and semantic accessible markup.
- Reuse modules in `src/components/layout`, `src/components/ui`, and `src/components/animations`.
- Respect reduced-motion preferences and keep animations progressive.
- Run `npm run lint` and `npm run build` before handing off changes.
