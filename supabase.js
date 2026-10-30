// ======================================
// SUPPORT PRO - SUPABASE CONFIGURATION
// ======================================

// URL du projet Supabase
const SUPABASE_URL = "https://lyykydpgabevqtodlwoq.supabase.co";

// Clé Publishable
// Remplace le texte ci-dessous par ta vraie clé
const SUPABASE_KEY = "sb_publishable_JDG1j8DEyplF3jwqM-2MPg_yPbGynl8";

// ======================================
// INITIALISATION DE SUPABASE
// ======================================

var supabaseClient;

if (!window.supabase) {
  console.error("Supabase library not loaded.");

} else if (
  SUPABASE_URL.includes("COLLE_") ||
  SUPABASE_KEY.includes("COLLE_")
) {
  console.error("Please configure your Supabase URL and key.");

} else {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  window.supabaseClient = supabaseClient;

  console.log("Support Pro Supabase initialized.");
}