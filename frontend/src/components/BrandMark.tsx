import { Activity } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 group cursor-pointer select-none">
      {/* أيقونة الشعار الدائرية المضيئة المستوحاة من هُوية الذكاء الاصطناعي الطبي الفاخرة */}
      <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-teal-600 to-emerald-500 p-0.5 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-300">
        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400 relative overflow-hidden">
          {/* تأثير توهج نبضي خلف الأيقونة */}
          <div className="absolute inset-0 bg-amber-500/10 animate-pulse" />
          <Activity size={20} className="relative z-10 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
        </div>
      </div>

      {/* اسم المنصة مع الشعار الفرعي */}
      {!compact && (
        <div className="flex flex-col">
          <span className="text-lg font-black tracking-wider text-slate-900 dark:text-white leading-none">
            CARE<span className="bg-gradient-to-r from-amber-500 to-teal-500 bg-clip-text text-transparent">360</span>
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">
            AI Healthcare
          </span>
        </div>
      )}
    </div>
  );
}