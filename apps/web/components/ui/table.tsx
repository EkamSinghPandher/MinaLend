import { ReactNode } from "react";

// Table wrapper
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={`min-w-full table-auto ${className ?? ""}`}>{children}</table>;
}

// Table head (thead)
export function Thead({ children }: { children: ReactNode }) {
  return <thead className="bg-gray-100">{children}</thead>;
}

// Table body (tbody)
export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-gray-200">{children}</tbody>;
}

// Table row (tr)
export function Tr({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>;
}

// Table header cell (th)
export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className ?? ""}`}>
    {children}
  </th>;
}

// Table data cell (td)
export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className ?? ""}`}>
    {children}
  </td>;
}