import { createClient } from "@supabase/supabase-js";

/*
|--------------------------------------------------------------------------
| CLIENTE PRIVADO DE SUPABASE - NOVA
|--------------------------------------------------------------------------
|
| Este cliente debe utilizarse SOLAMENTE del lado del servidor.
|
| Utiliza la Secret Key de Supabase, por lo que:
|
| - NO debe importarse en componentes "use client".
| - NO debe utilizarse directamente desde el navegador.
| - NO debe contener variables NEXT_PUBLIC para la clave privada.
|
*/

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Falta NEXT_PUBLIC_SUPABASE_URL en .env.local."
  );
}

if (!supabaseSecretKey) {
  throw new Error(
    "Falta SUPABASE_SECRET_KEY en .env.local."
  );
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);