import { AntdScope } from "@/components/providers/AntdScope";

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <AntdScope>{children}</AntdScope>;
}
