export default function ImgSlot({ label, style }) {
  return (
    <div className="img-slot" style={style}>
      <div className="img-slot-inner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        {label && (
          <>
            <span className="img-slot-label">{label}</span>
            <span className="img-slot-sub">
              or <u>browse files</u>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
