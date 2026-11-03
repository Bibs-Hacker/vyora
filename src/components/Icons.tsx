// Original line-based SVG icon set for VYORA. No emoji used in the UI.
import { SVGProps } from 'react'
type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...p
})

export const VyoraMark = (p: P) => (
  <svg viewBox='0 0 64 64' {...p}>
    <defs><linearGradient id='vm' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stopColor='var(--accent)' /><stop offset='1' stopColor='var(--accent-2)' />
    </linearGradient></defs>
    <path d='M16 18 L32 46 L48 18' fill='none' stroke='url(#vm)' strokeWidth='6'
      strokeLinecap='round' strokeLinejoin='round' />
    <circle cx='32' cy='22' r='3.2' fill='var(--accent-2)' />
  </svg>
)
export const Home = (p: P) => <svg {...base(p)}><path d='M3 10.5 12 3l9 7.5' /><path d='M5 9.5V21h14V9.5' /></svg>
export const Compass = (p: P) => <svg {...base(p)}><circle cx='12' cy='12' r='9' /><path d='m15.5 8.5-2 5-5 2 2-5z' /></svg>
export const Plus = (p: P) => <svg {...base(p)}><path d='M12 5v14M5 12h14' /></svg>
export const Chat = (p: P) => <svg {...base(p)}><path d='M21 12a8 8 0 0 1-11.5 7.2L4 20l.9-5A8 8 0 1 1 21 12Z' /></svg>
export const User = (p: P) => <svg {...base(p)}><circle cx='12' cy='8' r='4' /><path d='M4 20a8 8 0 0 1 16 0' /></svg>
export const Bell = (p: P) => <svg {...base(p)}><path d='M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z' /><path d='M10 19a2 2 0 0 0 4 0' /></svg>
export const Search = (p: P) => <svg {...base(p)}><circle cx='11' cy='11' r='7' /><path d='m20 20-3.2-3.2' /></svg>
export const Heart = (p: P) => <svg {...base(p)}><path d='M12 20s-7-4.4-9.3-8.6C1 8 3 4.8 6.2 4.8c2 0 3.2 1.1 3.8 2 .6-.9 1.8-2 3.8-2C17 4.8 19 8 17.3 11.4 15 15.6 12 20 12 20Z' /></svg>
export const Comment = (p: P) => <svg {...base(p)}><path d='M21 12a8 8 0 0 1-11.5 7.2L4 20l.9-5A8 8 0 1 1 21 12Z' /></svg>
export const Bookmark = (p: P) => <svg {...base(p)}><path d='M6 4h12v16l-6-4-6 4Z' /></svg>
export const Share = (p: P) => <svg {...base(p)}><circle cx='18' cy='5' r='3' /><circle cx='6' cy='12' r='3' /><circle cx='18' cy='19' r='3' /><path d='m8.6 10.6 6.8-4.2M8.6 13.4l6.8 4.2' /></svg>
export const More = (p: P) => <svg {...base(p)}><circle cx='5' cy='12' r='1.6' /><circle cx='12' cy='12' r='1.6' /><circle cx='19' cy='12' r='1.6' /></svg>
export const Close = (p: P) => <svg {...base(p)}><path d='M6 6l12 12M18 6 6 18' /></svg>
export const Eye = (p: P) => <svg {...base(p)}><path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z' /><circle cx='12' cy='12' r='3' /></svg>
export const EyeOff = (p: P) => <svg {...base(p)}><path d='M3 3l18 18' /><path d='M10.6 10.6a3 3 0 0 0 4.2 4.2' /><path d='M9.4 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3 3.9M6.1 6.1A18 18 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 3-.5' /></svg>
export const Settings = (p: P) => <svg {...base(p)}><circle cx='12' cy='12' r='3' /><path d='M19.4 13.5a7.8 7.8 0 0 0 0-3l1.6-1.3-1.8-3.1-2 .7a7.6 7.6 0 0 0-2.6-1.5L14.2 2H9.8l-.4 2.3A7.6 7.6 0 0 0 6.8 5.8l-2-.7L3 8.2l1.6 1.3a7.8 7.8 0 0 0 0 3L3 13.8l1.8 3.1 2-.7a7.6 7.6 0 0 0 2.6 1.5l.4 2.3h4.4l.4-2.3a7.6 7.6 0 0 0 2.6-1.5l2 .7 1.8-3.1Z' /></svg>
export const Check = (p: P) => <svg {...base(p)}><path d='m4 12 5 5L20 6' /></svg>
export const Back = (p: P) => <svg {...base(p)}><path d='M15 5l-7 7 7 7' /></svg>
export const Image = (p: P) => <svg {...base(p)}><rect x='3' y='4' width='18' height='16' rx='3' /><circle cx='8.5' cy='9.5' r='1.8' /><path d='m4 18 5-5 4 4 3-3 4 4' /></svg>
export const Send = (p: P) => <svg {...base(p)}><path d='M4 12 20 4l-6 16-3-7-7-1Z' /></svg>
export const Logout = (p: P) => <svg {...base(p)}><path d='M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8' /><path d='M18 15l3-3-3-3M9 12h12' /></svg>
export const Shield = (p: P) => <svg {...base(p)}><path d='M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6Z' /></svg>
export const Trash = (p: P) => <svg {...base(p)}><path d='M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13' /></svg>
export const Switch = (p: P) => <svg {...base(p)}><path d='M4 8h14l-3-3M20 16H6l3 3' /></svg>
export const Globe = (p: P) => <svg {...base(p)}><circle cx='12' cy='12' r='9' /><path d='M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z' /></svg>
