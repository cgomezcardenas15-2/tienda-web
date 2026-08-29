import AdminHeader from "@/app/admin/components/AdminHeader";

export default function InventarioLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-black text-white"><AdminHeader />{children}</div>;
}
