import { Suspense } from "react";

import ResultadoPago from "./ResultadoPago";

export default function ResultadoPagoPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#080a08]" />}>
      <ResultadoPago />
    </Suspense>
  );
}
