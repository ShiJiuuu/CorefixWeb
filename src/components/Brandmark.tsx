export default function Brandmark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        x="12.5"
        y="1.5"
        width="10"
        height="10"
        transform="rotate(45 17.5 6.5)"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path d="M16 11.5 21.5 17 16 22.5 10.5 17 16 11.5Z" fill="currentColor" />
    </svg>
  )
}
