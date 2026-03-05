"use client";

interface Props {
  depth: number;
  hasChildren: boolean;
  isLast: boolean;
}

const INDENT_COLORS = [
  "border-blue-800/50",
  "border-purple-800/50",
  "border-amber-800/50",
  "border-emerald-800/50",
  "border-rose-800/50",
];

export function ThreadConnector({ depth }: Props) {
  if (depth === 0) return null;

  return (
    <div className="absolute left-0 top-0 bottom-0 flex" style={{ width: depth * 20 }}>
      {Array.from({ length: depth }).map((_, i) => (
        <div
          key={i}
          className={`w-5 flex-shrink-0 border-l-2 ${INDENT_COLORS[i % INDENT_COLORS.length]}`}
          style={{ marginLeft: i === 0 ? 16 : 0 }}
        />
      ))}
    </div>
  );
}
