import { createClient } from "@supabase/supabase-js";

/*
|--------------------------------------------------------------------------
| CLIENTE DE SUPABASE - NOVA
|--------------------------------------------------------------------------
|
| Este cliente permite que la aplicación se comunique con Supabase.
|
| IMPORTANTE:
| Aquí solamente utilizamos la Publishable Key.
| Nunca debemos colocar una Secret Key en este archivo.
|
*/

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Falta NEXT_PUBLIC_SUPABASE_URL en .env.local."
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    "Falta NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);