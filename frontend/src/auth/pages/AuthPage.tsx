import { useMemo, useState, type FormEvent, type InputHTMLAttributes } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, HeartPulse, Mail, ShieldCheck } from "lucide-react";
import { BrandMark } from "../../components/BrandMark";
import { useAuth } from "../hooks/useAuth";
import { AuthError } from "../types/auth.types";
import { getPasswordError, isValidEmail, validatePassword } from "../validation/auth.validation";
import { navigate } from "./AuthRoutes";

export type AuthPath = "/login" | "/signup" | "/verify-email" | "/forgot-password" | "/reset-password";
type Copy = Record<string, string>;

const english: Copy = {
  loginTitle: "Welcome back", signupTitle: "Create your Nuvira account", forgotTitle: "Reset your password", resetTitle: "Choose a new password", verifyTitle: "Verify your email",
  loginSubtitle: "Sign in to continue to evidence-grounded health intelligence.", signupSubtitle: "Create a secure account for your personal Nuvira experience.", forgotSubtitle: "Enter your email and we will send a secure recovery link.", resetSubtitle: "Your new password must meet all security requirements.", verifySubtitle: "Check your inbox for the verification link from Nuvira.",
  email: "Email address", password: "Password", confirmPassword: "Confirm password", emailPlaceholder: "you@example.com", passwordPlaceholder: "Enter your password", submitLogin: "Sign in", submitSignup: "Create account", submitForgot: "Send recovery link", submitReset: "Update password", resend: "Resend verification email", backLogin: "Back to sign in", noAccount: "Need an account?", haveAccount: "Already have an account?", signup: "Sign up", login: "Sign in", forgot: "Forgot password?", back: "Back to Nuvira", showPassword: "Show password", hidePassword: "Hide password", loading: "Please wait...", invalidEmail: "Enter a valid email address.", required: "This field is required.", mismatch: "Passwords do not match.", weakPassword: "Use at least 12 characters with uppercase, lowercase, number, and special character (!@#$%^&*).", checkInbox: "We sent a verification link. Verify your email before signing in.", recoverySent: "If an account exists for this email, a recovery link has been sent.", resetSuccess: "Your password was updated. You can now sign in.", verified: "Your email is verified. You can sign in now.", retry: "Try again", unexpected: "Something went wrong. Please try again.", passwordRules: "Password requirements", minLength: "12+ characters", uppercase: "One uppercase letter", lowercase: "One lowercase letter", number: "One number", specialChar: "One special character (!@#$%^&*)", medicalNote: "Your health information deserves careful protection.", sessionExpired: "This link is expired or invalid. Request a new one from password recovery.",
};

const arabic: Copy = {
  loginTitle: "مرحباً بعودتك", signupTitle: "أنشئ حساب Nuvira", forgotTitle: "إعادة تعيين كلمة المرور", resetTitle: "اختر كلمة مرور جديدة", verifyTitle: "تحقق من بريدك الإلكتروني", loginSubtitle: "سجّل الدخول لمتابعة المعلومات الصحية المدعومة بالأدلة.", signupSubtitle: "أنشئ حساباً آمناً لتجربة Nuvira الشخصية.", forgotSubtitle: "أدخل بريدك وسنرسل رابط استعادة آمناً.", resetSubtitle: "يجب أن تستوفي كلمة المرور الجديدة جميع متطلبات الأمان.", verifySubtitle: "تحقق من صندوق الوارد للعثور على رابط التحقق من Nuvira.", email: "البريد الإلكتروني", password: "كلمة المرور", confirmPassword: "تأكيد كلمة المرور", emailPlaceholder: "you@example.com", passwordPlaceholder: "أدخل كلمة المرور", submitLogin: "تسجيل الدخول", submitSignup: "إنشاء الحساب", submitForgot: "إرسال رابط الاستعادة", submitReset: "تحديث كلمة المرور", resend: "إعادة إرسال رسالة التحقق", backLogin: "العودة لتسجيل الدخول", noAccount: "تحتاج إلى حساب؟", haveAccount: "لديك حساب بالفعل؟", signup: "إنشاء حساب", login: "تسجيل الدخول", forgot: "هل نسيت كلمة المرور؟", back: "العودة إلى Nuvira", showPassword: "إظهار كلمة المرور", hidePassword: "إخفاء كلمة المرور", loading: "يرجى الانتظار...", invalidEmail: "أدخل بريداً إلكترونياً صحيحاً.", required: "هذا الحقل مطلوب.", mismatch: "كلمتا المرور غير متطابقتين.", weakPassword: "استخدم 12 حرفاً على الأقل مع حرف كبير وصغير ورقم وحرف خاص (!@#$%^&*).", checkInbox: "أرسلنا رابط التحقق. تحقق من بريدك قبل تسجيل الدخول.", recoverySent: "إذا كان هناك حساب بهذا البريد، فسيتم إرسال رابط الاستعادة.", resetSuccess: "تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.", verified: "تم التحقق من بريدك. يمكنك تسجيل الدخول الآن.", retry: "حاول مرة أخرى", unexpected: "حدث خطأ ما. حاول مرة أخرى.", passwordRules: "متطلبات كلمة المرور", minLength: "12 حرفاً أو أكثر", uppercase: "حرف كبير واحد", lowercase: "حرف صغير واحد", number: "رقم واحد", specialChar: "حرف خاص واحد (!@#$%^&*)", medicalNote: "معلوماتك الصحية تستحق حماية دقيقة.", sessionExpired: "هذا الرابط منتهي أو غير صالح. اطلب رابطاً جديداً من استعادة كلمة المرور.",
};

function useCopy() {
  const lang = localStorage.getItem("care360_lang") || "en";
  return lang === "ar" ? arabic : english;
}

function friendlyError(error: unknown, copy: Copy) {
  return error instanceof AuthError ? error.message : copy.unexpected;
}

function safeNext() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export function AuthPage({ path }: { path: AuthPath }) {
  const copy = useCopy();
  const { user, status, login, signup, resetPassword, updatePassword, resendVerification } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const mode = path === "/login" ? "login" : path === "/signup" ? "signup" : path === "/forgot-password" ? "forgot" : path === "/reset-password" ? "reset" : "verify";
  const title = copy[`${mode}Title`];
  const subtitle = copy[`${mode}Subtitle`];
  const passwordChecks = useMemo(() => getPasswordError(password), [password]);

  const validateEmail = () => {
    if (!email.trim()) { setError(copy.required); return false; }
    if (!isValidEmail(email)) { setError(copy.invalidEmail); return false; }
    return true;
  };

  const validateNewPassword = () => {
    if (!validatePassword(password)) { setError(copy.weakPassword); return false; }
    if (password !== confirmPassword) { setError(copy.mismatch); return false; }
    return true;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(""); setSuccess("");
    if ((mode === "login" || mode === "signup" || mode === "forgot") && !validateEmail()) return;
    if ((mode === "signup" || mode === "reset") && !validateNewPassword()) return;
    setBusy(true);
    try {
      if (mode === "login") { await login(email.trim(), password); navigate(safeNext()); return; }
      if (mode === "signup") { const result = await signup(email.trim(), password); setSuccess(result.needsVerification ? copy.checkInbox : copy.verified); return; }
      if (mode === "forgot") { await resetPassword(email.trim()); setSuccess(copy.recoverySent); return; }
      if (mode === "reset") { await updatePassword(password); setSuccess(copy.resetSuccess); setPassword(""); setConfirmPassword(""); return; }
    } catch (authError) { setError(friendlyError(authError, copy)); }
    finally { setBusy(false); }
  };

  const resend = async () => {
    if (!email || cooldown > 0) return;
    setError(""); setSuccess(""); setBusy(true);
    try {
      await resendVerification(email.trim()); setSuccess(copy.checkInbox); setCooldown(60);
      const timer = window.setInterval(() => setCooldown((value) => { if (value <= 1) { window.clearInterval(timer); return 0; } return value - 1; }), 1000);
    } catch (authError) { setError(friendlyError(authError, copy)); }
    finally { setBusy(false); }
  };

  const titleText = title || copy.verifyTitle;
  const shouldShowForm = mode !== "verify";
  return (
    <main className="premium-page flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 sm:px-6">
      <div className="w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <button type="button" onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-teal-300" aria-label={copy.back}>
            <ArrowLeft size={17} /> {copy.back}
          </button>
          <BrandMark />
        </div>
        <section className="grid overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/80 shadow-2xl shadow-teal-950/30 md:grid-cols-[0.8fr_1.2fr]">
          <aside className="hidden flex-col justify-between border-r border-slate-700/70 bg-gradient-to-br from-teal-950/90 to-slate-950 p-10 md:flex">
            <div><div className="mb-7 inline-flex rounded-2xl bg-teal-400/10 p-3 text-teal-300"><HeartPulse size={28} /></div><h2 className="font-display text-3xl font-bold leading-tight text-white">Nuvira</h2><p className="mt-4 max-w-xs text-sm leading-7 text-slate-300">Evidence-grounded health intelligence with a calm, privacy-conscious experience.</p></div>
            <div className="flex items-center gap-3 text-xs font-semibold text-teal-200"><ShieldCheck size={18} /> {copy.medicalNote}</div>
          </aside>
          <div className="p-6 sm:p-10">
            <div className="mb-8"><p className="eyebrow text-teal-400">Secure access</p><h1 className="mt-3 text-3xl font-black tracking-tight text-white">{titleText}</h1><p className="mt-3 max-w-lg text-sm leading-6 text-slate-400">{subtitle}</p></div>
            {mode === "verify" ? <div className="space-y-6" role="status"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-300">{user ? <CheckCircle2 size={30} /> : <Mail size={30} />}</div><p className="text-sm leading-7 text-slate-300">{user ? copy.verified : copy.checkInbox}</p>{!user && <Field label={copy.email} value={email} onChange={setEmail} type="email" placeholder={copy.emailPlaceholder} autoComplete="email" />}{email && <button type="button" onClick={resend} disabled={busy || cooldown > 0} className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-50">{cooldown > 0 ? `${copy.resend} (${cooldown})` : copy.resend}</button>}{!user && <button type="button" onClick={() => navigate("/login")} className="button-secondary w-full">{copy.backLogin}</button>}</div> : mode === "reset" && status === "unauthenticated" ? <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100" role="alert">{copy.sessionExpired}</p> : <form onSubmit={submit} noValidate className="space-y-5">
              {(mode === "login" || mode === "signup" || mode === "forgot") && <Field label={copy.email} value={email} onChange={setEmail} type="email" placeholder={copy.emailPlaceholder} autoComplete="email" />}
              {(mode === "login" || mode === "signup" || mode === "reset") && <PasswordField label={copy.password} value={password} onChange={setPassword} show={showPassword} setShow={setShowPassword} placeholder={copy.passwordPlaceholder} autoComplete={mode === "login" ? "current-password" : "new-password"} />}
              {(mode === "signup" || mode === "reset") && <PasswordField label={copy.confirmPassword} value={confirmPassword} onChange={setConfirmPassword} show={showPassword} setShow={setShowPassword} placeholder={copy.passwordPlaceholder} autoComplete="new-password" />}
              {(mode === "signup" || mode === "reset") && <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4"><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{copy.passwordRules}</p><div className="grid gap-1 text-xs text-slate-400 sm:grid-cols-2"><Rule valid={!passwordChecks?.includes("minLength")} text={copy.minLength} /><Rule valid={!passwordChecks?.includes("uppercase")} text={copy.uppercase} /><Rule valid={!passwordChecks?.includes("lowercase")} text={copy.lowercase} /><Rule valid={!passwordChecks?.includes("number")} text={copy.number} /><Rule valid={!passwordChecks?.includes("special")} text={copy.specialChar} /></div></div>}
              {error && <p className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200" role="alert">{error}</p>}
              {success && <p className="rounded-xl border border-teal-400/30 bg-teal-400/10 p-3 text-sm text-teal-100" role="status">{success}</p>}
              <button type="submit" disabled={busy} className="button-primary w-full">{busy ? copy.loading : copy[`submit${mode[0].toUpperCase()}${mode.slice(1)}`]}</button>
            </form>}
            {mode === "login" && <button type="button" onClick={() => navigate("/forgot-password")} className="mt-5 text-sm font-semibold text-teal-300 hover:text-teal-200">{copy.forgot}</button>}
            {mode === "login" && <p className="mt-7 text-center text-sm text-slate-400">{copy.noAccount} <button type="button" onClick={() => navigate("/signup")} className="font-bold text-teal-300 hover:text-teal-200">{copy.signup}</button></p>}
            {mode === "signup" && <p className="mt-7 text-center text-sm text-slate-400">{copy.haveAccount} <button type="button" onClick={() => navigate("/login")} className="font-bold text-teal-300 hover:text-teal-200">{copy.login}</button></p>}
            {(mode === "forgot" || mode === "reset") && <button type="button" onClick={() => navigate("/login")} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-teal-300"><ArrowLeft size={15} /> {copy.backLogin}</button>}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return <label className="block text-sm font-semibold text-slate-200">{label}<input {...props} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10" /></label>;
}

function PasswordField({ label, value, onChange, show, setShow, ...props }: { label: string; value: string; onChange: (value: string) => void; show: boolean; setShow: (value: boolean) => void } & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type">) {
  const lang = localStorage.getItem("care360_lang") || "en";
  const accessibleLabel = show ? (lang === "ar" ? "إخفاء كلمة المرور" : "Hide password") : (lang === "ar" ? "إظهار كلمة المرور" : "Show password");
  return <label className="block text-sm font-semibold text-slate-200">{label}<span className="relative mt-2 block"><input {...props} type={show ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3.5 pr-12 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/10" /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-teal-300" aria-label={accessibleLabel}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>;
}

function Rule({ valid, text }: { valid: boolean; text: string }) { return <span className={valid ? "text-teal-300" : "text-slate-500"}>{valid ? "✓" : "○"} {text}</span>; }
