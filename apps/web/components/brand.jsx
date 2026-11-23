import Link from 'next/link'

export function Brand({ href = '/' }) {
  return (
    <Link
      href={href}
      className="brand-link inline-flex items-center gap-2.5 rounded-md text-sm font-semibold tracking-[-0.02em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b7f34a]"
      aria-label="TripleCode"
    >
      <span className="brand-mark grid size-7 place-items-center rounded-[7px]">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path d="M4 6.5 9.3 3.5v6L4 12.5v-6Z" fill="#b7f34a" />
          <path d="m14.7 3.5 5.3 3v6l-5.3-3v-6Z" fill="currentColor" fillOpacity=".9" />
          <path d="m9.3 14.5 5.4-3v6L9.3 20.5v-6Z" fill="#8f7dff" />
        </svg>
      </span>
      TripleCode
    </Link>
  )
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
      <path
        d="M3 8h9M9 4.5 12.5 8 9 11.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
