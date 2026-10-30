
// ==========================================
// SUPPORT PRO - APPLICATION PRINCIPALE
// English / Français / العربية
// ==========================================

const client = window.supabaseClient;

const translations = {
  en: {
    tagline: "Professional Business Email Support",
    welcome: "Welcome to Support Pro",
    authDescription: "Create your business account or sign in.",
    login: "Login",
    createAccount: "Create Account",
    emailAddress: "Email address",
    password: "Password",
    confirmPassword: "Confirm password",
    passwordAgain: "Enter password again",
    passwordPlaceholder: "At least 6 characters",
    manageEmails: "Manage your business emails professionally.",
    logout: "Logout",
    companyProfile: "Company Profile",
    companyName: "Company Name",
    businessEmail: "Business Email",
    companyLogo: "Company Logo",
    dropLogo: "Drop your logo here",
    chooseFile: "Or choose a file from your phone",
    chooseLogo: "Choose Logo",
    saveProfile: "Save Profile",
    connectMailbox: "Connect Your Mailbox",
    mailboxLater: "Mailbox connections will be added in a later step.",
    otherEmail: "Other Email",
    yourCompany: "Your Company",
    emailPlaceholder: "Enter business email",
    companyPlaceholder: "Enter company name",
    loginSuccess: "Login successful.",
    signupSuccess: "Account created successfully.",
    checkEmail: "Please check your email to confirm your account.",
    passwordMismatch: "Passwords do not match.",
    passwordShort: "Password must contain at least 6 characters.",
    fillFields: "Please complete all required fields.",
    profileSaved: "Company profile saved successfully.",
    profileError: "Could not save the company profile.",
    loginError: "Login failed. Check your email and password.",
    signupError: "Account creation failed.",
    logoutError: "Could not log out.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    supabaseError: "Supabase is not configured correctly."
  },

  fr: {
    tagline: "Assistance professionnelle pour les e-mails",
    welcome: "Bienvenue sur Support Pro",
    authDescription: "Créez votre compte professionnel ou connectez-vous.",
    login: "Connexion",
    createAccount: "Créer un compte",
    emailAddress: "Adresse e-mail",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    passwordAgain: "Saisissez à nouveau le mot de passe",
    passwordPlaceholder: "Au moins 6 caractères",
    manageEmails: "Gérez vos e-mails professionnels facilement.",
    logout: "Déconnexion",
    companyProfile: "Profil de l'entreprise",
    companyName: "Nom de l'entreprise",
    businessEmail: "E-mail professionnel",
    companyLogo: "Logo de l'entreprise",
    dropLogo: "Déposez votre logo ici",
    chooseFile: "Ou choisissez un fichier sur votre téléphone",
    chooseLogo: "Choisir un logo",
    saveProfile: "Enregistrer le profil",
    connectMailbox: "Connecter votre boîte mail",
    mailboxLater: "La connexion des boîtes mail sera ajoutée ultérieurement.",
    otherEmail: "Autre e-mail",
    yourCompany: "Votre entreprise",
    emailPlaceholder: "Saisissez l'e-mail professionnel",
    companyPlaceholder: "Saisissez le nom de l'entreprise",
    loginSuccess: "Connexion réussie.",
    signupSuccess: "Compte créé avec succès.",
    checkEmail: "Veuillez vérifier votre e-mail pour confirmer votre compte.",
    passwordMismatch: "Les mots de passe ne correspondent pas.",
    passwordShort: "Le mot de passe doit contenir au moins 6 caractères.",
    fillFields: "Veuillez remplir tous les champs obligatoires.",
    profileSaved: "Profil de l'entreprise enregistré.",
    profileError: "Impossible d'enregistrer le profil.",
    loginError: "Connexion impossible. Vérifiez vos identifiants.",
    signupError: "La création du compte a échoué.",
    logoutError: "Impossible de se déconnecter.",
    showPassword: "Afficher le mot de passe",
    hidePassword: "Masquer le mot de passe",
    supabaseError: "Supabase n'est pas correctement configuré."
  },

  ar: {
    tagline: "دعم احترافي للبريد الإلكتروني للأعمال",
    welcome: "مرحباً بك في Support Pro",
    authDescription: "أنشئ حساب شركتك أو سجّل الدخول.",
    login: "تسجيل الدخول",
    createAccount: "إنشاء حساب",
    emailAddress: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    passwordAgain: "أعد إدخال كلمة المرور",
    passwordPlaceholder: "6 أحرف على الأقل",
    manageEmails: "أدر رسائل شركتك الإلكترونية باحترافية.",
    logout: "تسجيل الخروج",
    companyProfile: "ملف الشركة",
    companyName: "اسم الشركة",
    businessEmail: "البريد الإلكتروني للشركة",
    companyLogo: "شعار الشركة",
    dropLogo: "ضع شعارك هنا",
    chooseFile: "أو اختر ملفاً من هاتفك",
    chooseLogo: "اختر الشعار",
    saveProfile: "حفظ الملف الشخصي",
    connectMailbox: "ربط صندوق البريد",
    mailboxLater: "ستتم إضافة ربط صناديق البريد في مرحلة لاحقة.",
    otherEmail: "بريد إلكتروني آخر",
    yourCompany: "شركتك",
    emailPlaceholder: "أدخل بريد الشركة",
    companyPlaceholder: "أدخل اسم الشركة",
    loginSuccess: "تم تسجيل الدخول بنجاح.",
    signupSuccess: "تم إنشاء الحساب بنجاح.",
    checkEmail: "يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    passwordShort: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
    fillFields: "يرجى ملء جميع الحقول المطلوبة.",
    profileSaved: "تم حفظ ملف الشركة بنجاح.",
    profileError: "تعذر حفظ ملف الشركة.",
    loginError: "فشل تسجيل الدخول. تحقق من البريد وكلمة المرور.",
    signupError: "تعذر إنشاء الحساب.",
    logoutError: "تعذر تسجيل الخروج.",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    supabaseError: "إعدادات Supabase غير صحيحة."
  }
};

let currentLanguage = localStorage.getItem("supportProLanguage") || "en";
let authMode = "login";
let selectedLogo = null;

function t(key) {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

// ==========================================
// LANGUAGE SYSTEM
// ==========================================

function applyLanguage(language) {
  if (!translations[language]) language = "en";

  currentLanguage = language;
  localStorage.setItem("supportProLanguage", language);

  document.documentElement.lang = language;
  document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    if (translations[language][key]) {
      element.textContent = translations[language][key];
    }
  });

  const companyInput = document.getElementById("companyName");
  const emailInput = document.getElementById("businessEmail");
  const passwordInput = document.getElementById("authPassword");
  const confirmInput = document.getElementById("confirmPassword");

  if (companyInput) companyInput.placeholder = t("companyPlaceholder");
  if (emailInput) emailInput.placeholder = t("emailPlaceholder");
  if (passwordInput) passwordInput.placeholder = t("passwordPlaceholder");
  if (confirmInput) confirmInput.placeholder = t("passwordAgain");

  const languageSelect = document.getElementById("languageSelect");
  if (languageSelect) languageSelect.value = language;

  updateAuthInterface();

  document.querySelectorAll(".password-toggle").forEach(button => {
    button.setAttribute("aria-label", t("showPassword"));
  });
}

const languageSelect = document.getElementById("languageSelect");

if (languageSelect) {
  languageSelect.addEventListener("change", event => {
    applyLanguage(event.target.value);
  });
}

// ==========================================
// AUTHENTICATION INTERFACE
// ==========================================

function updateAuthInterface() {
  const title = document.getElementById("authTitle");
  const description = document.getElementById("authDescription");
  const submit = document.getElementById("authSubmit");
  const confirmGroup = document.getElementById("confirmPasswordGroup");
  const loginTab = document.getElementById("showLogin");
  const signupTab = document.getElementById("showSignup");
  const confirmInput = document.getElementById("confirmPassword");

  if (!title || !submit || !confirmGroup) return;

  if (authMode === "signup") {
    title.textContent = t("createAccount");
    description.textContent = t("authDescription");
    submit.textContent = t("createAccount");
    confirmGroup.hidden = false;

    if (confirmInput) confirmInput.required = true;

    signupTab?.classList.add("active");
    loginTab?.classList.remove("active");
  } else {
    title.textContent = t("welcome");
    description.textContent = t("authDescription");
    submit.textContent = t("login");
    confirmGroup.hidden = true;

    if (confirmInput) {
      confirmInput.required = false;
      confirmInput.value = "";
    }

    loginTab?.classList.add("active");
    signupTab?.classList.remove("active");
  }
}

document.getElementById("showLogin")?.addEventListener("click", () => {
  authMode = "login";
  clearMessage("authMessage");
  updateAuthInterface();
});

document.getElementById("showSignup")?.addEventListener("click", () => {
  authMode = "signup";
  clearMessage("authMessage");
  updateAuthInterface();
});

// ==========================================
// PASSWORD SHOW / HIDE
// ==========================================

document.querySelectorAll(".password-toggle").forEach(button => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;

    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";

    button.textContent = isHidden ? "🙈" : "👁️";
    button.setAttribute(
      "aria-label",
      isHidden ? t("hidePassword") : t("showPassword")
    );
  });
});

// ==========================================
// MESSAGE HELPERS
// ==========================================

function showMessage(id, message, success = false) {
  const element = document.getElementById(id);
  if (!element) return;

  element.textContent = message;
  element.classList.toggle("success", success);
  element.classList.toggle("error", !success);
}

function clearMessage(id) {
  const element = document.getElementById(id);
  if (element) element.textContent = "";
}

// ==========================================
// AUTHENTICATION
// ==========================================

const authForm = document.getElementById("authForm");

authForm?.addEventListener("submit", async event => {
  event.preventDefault();

  if (!client) {
    showMessage("authMessage", t("supabaseError"));
    return;
  }

  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const confirmPassword = document.getElementById("confirmPassword")?.value || "";
  const submitButton = document.getElementById("authSubmit");

  if (!email || !password) {
    showMessage("authMessage", t("fillFields"));
    return;
  }

  if (password.length < 6) {
    showMessage("authMessage", t("passwordShort"));
    return;
  }

  if (authMode === "signup" && password !== confirmPassword) {
    showMessage("authMessage", t("passwordMismatch"));
    return;
  }

  submitButton.disabled = true;

  try {
    let result;

    if (authMode === "signup") {
      result = await client.auth.signUp({
        email,
        password
      });

      if (result.error) throw result.error;

      if (result.data.session) {
        showMessage("authMessage", t("signupSuccess"), true);
        await startApp(result.data.session.user);
      } else {
        showMessage("authMessage", t("checkEmail"), true);
      }

    } else {
      result = await client.auth.signInWithPassword({
        email,
        password
      });

      if (result.error) throw result.error;

      showMessage("authMessage", t("loginSuccess"), true);
      await startApp(result.data.user);
    }

  } catch (error) {
    console.error("Authentication error:", error);

    showMessage(
      "authMessage",
      error.message || (
        authMode === "signup" ? t("signupError") : t("loginError")
      )
    );
  } finally {
    submitButton.disabled = false;
  }
});

// ==========================================
// START APPLICATION
// ==========================================

async function startApp(user) {
  if (!user) return;

  document.getElementById("authCard").hidden = true;
  document.getElementById("appArea").hidden = false;

  document.getElementById("signedInEmail").textContent = user.email || "";

  await loadProfile(user);
}

// ==========================================
// LOGOUT
// ==========================================

document.getElementById("logoutButton")?.addEventListener("click", async () => {
  if (!client) return;

  try {
    const { error } = await client.auth.signOut();
    if (error) throw error;

    document.getElementById("appArea").hidden = true;
    document.getElementById("authCard").hidden = false;
    document.getElementById("authForm").reset();

    authMode = "login";
    updateAuthInterface();
    clearMessage("authMessage");

  } catch (error) {
    console.error("Logout error:", error);
    showMessage("authMessage", t("logoutError"));
  }
});

// ==========================================
// COMPANY PROFILE
// ==========================================

async function loadProfile(user) {
  if (!client || !user) return;

  try {
    const { data, error } = await client
      .from("business_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      document.getElementById("companyName").value = data.company_name || "";
      document.getElementById("businessEmail").value = data.business_email || "";

      updateProfilePreview();

      const storedLogo = localStorage.getItem("supportProLogo_" + user.id);
      if (storedLogo) {
        displayLogo(storedLogo);
      }
    } else {
      updateProfilePreview();
    }

  } catch (error) {
    console.error("Profile loading error:", error);
    showMessage("profileMessage", t("profileError"));
  }
}

function updateProfilePreview() {
  const name = document.getElementById("companyName")?.value.trim();
  const email = document.getElementById("businessEmail")?.value.trim();

  document.getElementById("profileCompanyName").textContent =
    name || t("yourCompany");

  document.getElementById("profileBusinessEmail").textContent =
    email || "your@email.com";
}

document.getElementById("companyName")?.addEventListener("input", updateProfilePreview);
document.getElementById("businessEmail")?.addEventListener("input", updateProfilePreview);

// ==========================================
// COMPANY LOGO
// ==========================================

function displayLogo(source) {
  const preview = document.getElementById("logoPreview");
  const profileLogo = document.getElementById("profileLogo");
  const defaultLogo = document.getElementById("profileDefaultLogo");

  preview.src = source;
  preview.style.display = "block";

  profileLogo.src = source;
  profileLogo.style.display = "block";

  defaultLogo.style.display = "none";
}

document.getElementById("logoFile")?.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showMessage("profileMessage", "Please select an image file.");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    selectedLogo = reader.result;
    displayLogo(selectedLogo);
  };

  reader.readAsDataURL(file);
});

// ==========================================
// SAVE COMPANY PROFILE
// ==========================================

document.getElementById("save")?.addEventListener("click", async () => {
  if (!client) {
    showMessage("profileMessage", t("supabaseError"));
    return;
  }

  const { data: sessionData, error: sessionError } =
    await client.auth.getSession();

  if (sessionError || !sessionData.session) {
    showMessage("profileMessage", t("loginError"));
    return;
  }

  const user = sessionData.session.user;
  const companyName = document.getElementById("companyName").value.trim();
  const businessEmail = document.getElementById("businessEmail").value.trim();

  if (!companyName) {
    showMessage("profileMessage", t("fillFields"));
    return;
  }

  const profile = {
    user_id: user.id,
    company_name: companyName,
    business_email: businessEmail
  };

  try {
    const { error } = await client
      .from("business_profiles")
      .upsert(profile, { onConflict: "user_id" });

    if (error) throw error;

    if (selectedLogo) {
      localStorage.setItem("supportProLogo_" + user.id, selectedLogo);
    }

    updateProfilePreview();
    showMessage("profileMessage", t("profileSaved"), true);

  } catch (error) {
    console.error("Profile save error:", error);
    showMessage(
      "profileMessage",
      error.message || t("profileError")
    );
  }
});

// ==========================================
// INITIALIZATION
// ==========================================

async function initializeApp() {
  applyLanguage(currentLanguage);
  updateAuthInterface();

  if (!client) {
    console.error("Supabase client is not available.");
    showMessage("authMessage", t("supabaseError"));
    return;
  }

  try {
    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    if (data.session?.user) {
      await startApp(data.session.user);
    }

    client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        document.getElementById("appArea").hidden = true;
        document.getElementById("authCard").hidden = false;
      }
    });

  } catch (error) {
    console.error("Session error:", error);
  }
}

initializeApp();
