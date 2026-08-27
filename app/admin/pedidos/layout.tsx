import AdminHeader from "../components/AdminHeader";

export default function PedidosAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <AdminHeader />
      {children}
    </div>
  );
}
