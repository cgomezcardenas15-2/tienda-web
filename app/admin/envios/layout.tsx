import AdminHeader from "../components/AdminHeader";

export default function EnviosLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-black text-white"><AdminHeader />{children}</div>;
}
