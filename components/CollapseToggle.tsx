"use client";

interface Props {
  isCollapsed: boolean;
  onToggle: () => void;
  childCount: number;
}

export function CollapseToggle({ isCollapsed, onToggle, childCount }: Props) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1 px-2 -ml-2 rounded hover:bg-zinc-800"
    >
      <svg
        className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? "" : "rotate-90"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      {isCollapsed && <span>{childCount} replies</span>}
    </button>
  );
}
