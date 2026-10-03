import { QueryProvider } from "@/lib/query/query-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <QueryProvider>{children}</QueryProvider>;
}
