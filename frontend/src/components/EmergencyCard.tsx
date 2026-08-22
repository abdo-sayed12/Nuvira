import { PhoneCall, Siren } from "lucide-react";

export function EmergencyCard({ arabic = false }: { arabic?: boolean }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950" role="alert">
    <div className="flex gap-3"><Siren className="mt-0.5 shrink-0 text-red-700" aria-hidden="true" /><div><h3 className="font-bold">{arabic ? "قد تكون هذه حالة طارئة" : "This may be an emergency"}</h3><p className="mt-1 text-sm leading-6">{arabic ? "اتصل برقم الطوارئ المحلي أو اطلب رعاية إسعافية الآن. لا تقد السيارة بنفسك إذا كنت تشعر بإغماء أو مرض شديد." : "Contact your local emergency number or seek emergency care now. Do not drive yourself if you feel faint or severely unwell."}</p><a className="mt-3 inline-flex items-center gap-2 font-semibold text-red-800 underline" href="tel:112"><PhoneCall size={16} />{arabic ? "اتصل بالطوارئ" : "Call emergency services"}</a></div></div>
  </div>;
}

