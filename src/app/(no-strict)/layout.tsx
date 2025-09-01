export default function NoStrictLayout({ children }: { children: React.ReactNode }) {
  // Intentionally simple wrapper to avoid Strict-mode double effects for this subtree
  return <>{children}</>;
}

