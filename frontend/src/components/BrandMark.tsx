import { Activity } from "lucide-react";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="group cursor-pointer select-none">
      {/* أيقونة الشعار الدائرية المضيئة المستوحاة من هُوية الذكاء الاصطناعي الطبي الفاخرة */}
      <img 
        src="/logo-transparent.png" 
        alt="Nuvira Logo" 
        className="group-hover:scale-105 transition-transform duration-300"
        style={{ background: 'transparent', objectFit: 'contain', width: '42px', height: '42px', mixBlendMode: 'screen', filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.45))' }} 
      />

      {/* اسم المنصة مع الشعار الفرعي */}
      {!compact && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="text-lg font-black tracking-wider text-slate-900 dark:text-white leading-none brand-title">
            Nu<span className="bg-gradient-to-r from-amber-500 to-teal-500 bg-clip-text text-transparent">vira</span>
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">
            AI Healthcare
          </span>
        </div>
      )}
    </div>
  );
}