const benefitCopy = {
  en: {
    status: "Exploring",
    items: [
      {
        title: "Optional USDC yield",
        short: "An optional earning concept for part of your USDC balance.",
        detail: "Any yield concept would involve risk, may lose value, and would not be guaranteed. It is not enabled here; no yield accrues and no deposit is requested.",
      },
      {
        title: "Job-loss insurance",
        short: "A concept for support during an interruption in work.",
        detail: "Any insurance would depend on a provider, underwriting, eligibility, local rules, and final policy terms. No policy is offered or bound here.",
      },
      {
        title: "Medical insurance",
        short: "A concept for exploring access to health coverage.",
        detail: "Coverage would depend on an insurer, underwriting, eligibility, country availability, and policy terms. No coverage or enrollment is available in this prototype.",
      },
      {
        title: "Short-term credit",
        short: "A concept for carefully scoped access to short-term funds.",
        detail: "Any credit would be subject to a lender, collateral, eligibility, regulation, and underwriting. This is not an approval or loan offer.",
      },
    ],
    more: "Read what this means",
    less: "Hide details",
  },
  es: {
    status: "En evaluación",
    items: [
      {
        title: "Rendimiento opcional en USDC",
        short: "Una opción en estudio para una parte de tu saldo en USDC.",
        detail: "Cualquier concepto de rendimiento implicaría riesgos y podría perder valor; no estaría garantizado. No está habilitado aquí, no se acumulan rendimientos y no se solicita ningún depósito.",
      },
      {
        title: "Seguro por pérdida de empleo",
        short: "Un concepto de apoyo durante una interrupción laboral.",
        detail: "Cualquier seguro dependería de un proveedor, evaluación, elegibilidad, normas locales y términos finales de la póliza. Aquí no se ofrece ni se contrata ninguna póliza.",
      },
      {
        title: "Seguro médico",
        short: "Un concepto para explorar el acceso a cobertura de salud.",
        detail: "La cobertura dependería de una aseguradora, evaluación, elegibilidad, disponibilidad en el país y términos de la póliza. Este prototipo no ofrece cobertura ni inscripción.",
      },
      {
        title: "Crédito a corto plazo",
        short: "Un concepto para explorar acceso cuidadosamente definido a fondos a corto plazo.",
        detail: "Cualquier crédito estaría sujeto a un prestamista, garantías, elegibilidad, regulación y evaluación. Esto no es una aprobación ni una oferta de préstamo.",
      },
    ],
    more: "Leer los detalles",
    less: "Ocultar detalles",
  },
};

export default function BenefitPreviews({ language = "en" }) {
  const copy = benefitCopy[language] || benefitCopy.en;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {copy.items.map((item, index) => (
        <article
          key={item.title}
          className="rounded-xl border border-white/10 bg-[#161B26] p-5 transition-colors hover:border-[#a8dc55]/30"
        >
          <div className="flex items-center justify-between gap-3">
              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#a8dc55]/25 bg-[#a8dc55]/[.08] font-mono text-xs text-[#c4e794]">
                0{index + 1}
              </span>
            <span className="shrink-0 rounded-full border border-[#a8dc55]/20 bg-[#a8dc55]/[.07] px-2.5 py-1 text-[10px] uppercase tracking-wide text-[#c4e794]">
              {copy.status}
            </span>
          </div>
          <h3 className="mt-4 text-base font-medium text-white">{item.title}</h3>
          <p className="mt-2 text-sm leading-5 text-white/55">{item.short}</p>
          <details className="benefit-details mt-4 border-t border-white/[.08] pt-3 text-sm text-white/55">
            <summary className="cursor-pointer list-none text-xs text-[#c4e794] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a8dc55]">
              <span className="when-closed">{copy.more}</span>
              <span className="when-open">{copy.less}</span>
            </summary>
            <p className="mt-3 leading-6">{item.detail}</p>
          </details>
        </article>
      ))}
    </div>
  );
}
