const PATHS = {
  rice: <><path d="M3 11h18a9 9 0 0 1-18 0Z" /><path d="M7 11c0-3 2.2-5 5-5s5 2 5 5" /><path d="M10 8.5h.01M13 7.5h.01M14.5 9h.01" /></>,
  atta: <><path d="M12 21V9" /><path d="M12 13c-3 0-4.5-2-4.5-4.5 2.5 0 4.5 1.5 4.5 4.5Zm0 0c3 0 4.5-2 4.5-4.5-2.5 0-4.5 1.5-4.5 4.5Zm0 4.5c-3 0-4.5-2-4.5-4.5 2.5 0 4.5 1.5 4.5 4.5Zm0 0c3 0 4.5-2 4.5-4.5-2.5 0-4.5 1.5-4.5 4.5ZM12 9c-1.3-1.3-1.3-3.7 0-6 1.3 2.3 1.3 4.7 0 6Z" /></>,
  dal: <><ellipse cx="8" cy="9" rx="4" ry="3" /><ellipse cx="16" cy="11" rx="4" ry="3" /><ellipse cx="10" cy="16.5" rx="4" ry="3" /></>,
  masala: <><path d="M14.5 7C18 7 20 9 20 11.5 20 16.5 13 20.5 5 20.5c5-3 6.5-7 6.5-10.5 0-2 1.3-3 3-3Z" /><path d="M14.5 7c0-2 1-3.5 3-3.5" /></>,
  snacks: <><circle cx="12" cy="12" r="8.5" /><path d="M9 9.5h.01M14 8.5h.01M13.5 14h.01M9 15h.01M16 12h.01" /></>,
  pickles: <><path d="M8 3h8v3H8z" /><path d="M7 6h10l1 3v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9Z" /><path d="M6 12.5h12" /></>,
  tea: <><path d="M4 9.5h13v4a5.5 5.5 0 0 1-5.5 5.5h-2A5.5 5.5 0 0 1 4 13.5Z" /><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" /><path d="M8 3c0 2 2 2 2 4.5M12 3c0 2 2 2 2 4.5" /></>,
  frozen: <><path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6" /><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2" /></>,
  sweets: <><circle cx="12" cy="12.5" r="6.5" /><path d="M9 11h.01M12 9h.01M15 12h.01M10.5 15h.01M14 15.5h.01" /><path d="M4 20.5h16" /></>,
  packs: <><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></>,
  truck: <><path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7z" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  tag: <><path d="M3 12V4h8l9 9-8 8Z" /><circle cx="7.5" cy="8" r="1.3" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  chat: <path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.2A8.5 8.5 0 1 1 20 11.5Z" />,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  box: <><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z" /><path d="m3 7.5 9 4.5 9-4.5M12 12v9" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  cart: <><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" /><circle cx="10" cy="20.5" r="1" /><circle cx="17" cy="20.5" r="1" /></>,
  home: <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  // Brand mark: three tyres, arranged like an auto-rickshaw's wheels
  tyres: <><circle cx="12" cy="7" r="4.3" /><circle cx="12" cy="7" r="1.4" /><circle cx="6.2" cy="17" r="4.3" /><circle cx="6.2" cy="17" r="1.4" /><circle cx="17.8" cy="17" r="4.3" /><circle cx="17.8" cy="17" r="1.4" /></>,
  basket: <><path d="M3 10h18l-2 9a2 2 0 0 1-2 1.6H7A2 2 0 0 1 5 19Z" /><path d="m8 10 3-6M16 10l-3-6M9 14v3M15 14v3M12 14v3" /></>,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  logout: <><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><path d="M10 17l-5-5 5-5M5 12h11" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "i" }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}

export const isIconName = (n: string): n is IconName => n in PATHS;
