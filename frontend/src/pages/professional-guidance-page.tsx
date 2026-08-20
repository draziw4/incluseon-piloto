import {
  Accessibility,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Info,
  RefreshCw,
  School,
  ShieldCheck,
  UsersRound,
  Workflow,
  XCircle,
  type LucideIcon
} from "lucide-react"
import { useState } from "react"

import { useAuth } from "@/features/auth/hooks/use-auth"

type GuidanceSection = "overview" | "flow" | "case-study" | "aee" | "pa" | "team"

type SectionTab = {
  id: GuidanceSection
  label: string
  shortLabel: string
  icon: LucideIcon
}

const sectionTabs: SectionTab[] = [
  { id: "overview", label: "Visão geral", shortLabel: "Geral", icon: BookOpenCheck },
  { id: "flow", label: "Fluxo do AEE", shortLabel: "Fluxo AEE", icon: Workflow },
  { id: "case-study", label: "Estudo de caso e PAEE", shortLabel: "Estudo e PAEE", icon: ClipboardCheck },
  { id: "aee", label: "Profissional do AEE", shortLabel: "AEE", icon: ShieldCheck },
  { id: "pa", label: "Profissional de apoio", shortLabel: "PA", icon: Accessibility },
  { id: "team", label: "Gestão e equipe escolar", shortLabel: "Gestão", icon: School }
]

const caseStudyElements = [
  "Identificação objetiva do estudante e de sua escolarização",
  "Histórico escolar e trajetória educacional",
  "Observação pedagógica na sala comum",
  "Avaliação da funcionalidade no contexto escolar",
  "Identificação das barreiras existentes",
  "Potencialidades e interesses do estudante",
  "Estratégias já utilizadas e seus resultados",
  "Parecer pedagógico conclusivo"
]

const paDoes = [
  "Auxilia em alimentação, higiene, vestuário, locomoção e segurança física quando houver necessidade funcional.",
  "Favorece a autonomia progressiva, evitando fazer pelo estudante aquilo que ele já consegue realizar.",
  "Media comunicação, interação social e organização da rotina conforme as orientações do AEE e da gestão.",
  "Utiliza recursos de comunicação aumentativa e alternativa já definidos para o estudante.",
  "Registra fatos observáveis do cotidiano e compartilha necessidades, avanços e intercorrências com o AEE."
]

const paDoesNot = [
  "Não substitui o professor da sala comum nem o profissional do AEE.",
  "Não se responsabiliza pelo ensino dos conteúdos curriculares.",
  "Não planeja aulas, não cria atividades pedagógicas paralelas e não avalia a aprendizagem.",
  "Não executa procedimentos próprios de profissões regulamentadas.",
  "Não atua com base apenas no diagnóstico: o apoio depende da necessidade funcional registrada no PAEE."
]

function getInitialSection(role?: string): GuidanceSection {
  if (role === "support_professional") return "pa"
  if (role === "aee") return "aee"
  if (role === "school" || role === "supervisor" || role === "admin") return "team"
  return "overview"
}

export function ProfessionalGuidancePage() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState<GuidanceSection>(() => getInitialSection(user?.role))

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-600 p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <BookOpenCheck size={24} />
            </div>
            <p className="text-sm font-semibold text-blue-100">Guia de atuação profissional</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">Orientações para a Educação Especial Inclusiva</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50 md:text-base">
              Consulte responsabilidades, fluxos e critérios para que AEE, profissional de apoio, sala comum e gestão atuem de forma articulada.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm lg:max-w-sm">
            <div className="flex gap-3">
              <Info size={20} className="mt-0.5 shrink-0 text-cyan-100" />
              <p className="text-sm leading-6 text-blue-50">
                O foco é eliminar barreiras, ampliar a participação e desenvolver autonomia. O diagnóstico é complementar e não determina sozinho os apoios.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Seções das orientações" className="rounded-2xl border border-blue-100 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {sectionTabs.map((tab) => {
            const Icon = tab.icon
            const selected = activeSection === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveSection(tab.id)}
                className={[
                  "flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl px-3 py-3 text-center text-xs font-semibold transition sm:text-sm",
                  selected
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                ].join(" ")}
              >
                <Icon size={19} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            )
          })}
        </div>
      </section>

      {activeSection === "overview" && <OverviewSection />}
      {activeSection === "flow" && <AeeFlowSection />}
      {activeSection === "case-study" && <CaseStudySection />}
      {activeSection === "aee" && <AeeProfessionalSection />}
      {activeSection === "pa" && <SupportProfessionalSection />}
      {activeSection === "team" && <SchoolTeamSection />}

      <footer className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs leading-5 text-slate-500">
        Conteúdo informativo organizado a partir do Documento Orientador de Educação Especial Inclusiva de 2026. Consulte os normativos vigentes e os fluxos da sua rede sempre que houver atualização institucional.
      </footer>
    </div>
  )
}

function OverviewSection() {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm xl:col-span-2">
        <SectionHeading
          icon={BookOpenCheck}
          eyebrow="Fundamentos"
          title="Princípios que orientam a prática"
          description="A inclusão é responsabilidade coletiva e deve atravessar planejamento, currículo, avaliação, gestão e rotina escolar."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <PrincipleCard title="Direito, não concessão" text="A Educação Especial é transversal e integra o ensino regular. Não constitui sistema paralelo ou substitutivo." />
          <PrincipleCard title="Barreiras, não rótulos" text="As decisões devem considerar barreiras pedagógicas, comunicacionais, atitudinais, físicas, sensoriais e institucionais." />
          <PrincipleCard title="Participação e autonomia" text="Recursos e apoios devem ampliar acesso, comunicação, participação e independência no cotidiano escolar." />
          <PrincipleCard title="Trabalho colaborativo" text="Gestão, sala comum, AEE, profissional de apoio, família e rede atuam de forma articulada e com registros compartilhados." />
        </div>
      </section>

      <aside className="space-y-4">
        <InfoCard
          icon={UsersRound}
          title="Público-alvo"
          items={["Pessoas com deficiência", "Pessoas com Transtorno do Espectro Autista", "Pessoas com altas habilidades ou superdotação"]}
        />
        <InfoCard
          icon={ShieldCheck}
          title="Pontos essenciais"
          items={["AEE complementa ou suplementa o ensino comum", "AEE não é reforço escolar nem atendimento clínico", "Apoio funcional não é automático por diagnóstico"]}
        />
      </aside>
    </div>
  )
}

function AeeFlowSection() {
  const steps = [
    ["1", "Identificação na sala comum", "O professor observa dificuldades persistentes de acesso ao currículo e participação, registrando evidências pedagógicas."],
    ["2", "Encaminhamento pela gestão", "A gestão analisa os registros, articula a equipe e formaliza o encaminhamento para avaliação pedagógica especializada."],
    ["3", "Estudo de caso", "A equipe identifica potencialidades, barreiras, funcionalidade e necessidades educacionais no contexto escolar."],
    ["4", "Elaboração do PAEE", "O AEE define objetivos, estratégias, recursos, frequência, articulação com a sala comum e critérios de reavaliação."],
    ["5", "Atendimento especializado", "O serviço desenvolve habilidades de acesso ao currículo e ensina o uso de recursos e tecnologias assistivas."],
    ["6", "Acompanhamento e reavaliação", "A equipe mantém registros sistemáticos, reúne-se periodicamente e revê o plano ao menos semestralmente ou quando necessário."]
  ]

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm md:p-8">
      <SectionHeading
        icon={Workflow}
        eyebrow="Fluxo institucional"
        title="Do primeiro registro à reavaliação"
        description="O encaminhamento é institucional, documentado e colaborativo. Nenhuma etapa deve depender de uma decisão isolada."
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {steps.map(([number, title, text]) => (
          <article key={number} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{number}</span>
            <div>
              <h3 className="font-bold text-blue-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex gap-3 rounded-2xl bg-emerald-50 p-5 text-emerald-950">
        <RefreshCw size={21} className="mt-0.5 shrink-0 text-emerald-700" />
        <p className="text-sm leading-6">
          A reavaliação permite ajustar estratégias, redefinir objetivos e verificar a permanência ou retirada de serviços de apoio, sempre priorizando a autonomia do estudante.
        </p>
      </div>
    </section>
  )
}

function CaseStudySection() {
  const mappings = [
    ["Barreiras identificadas", "Objetivos do AEE"],
    ["Potencialidades", "Estratégias pedagógicas"],
    ["Avaliação funcional", "Recursos e apoios"],
    ["Observações da sala comum", "Articulação pedagógica"],
    ["Parecer conclusivo", "Cronograma e avaliação"]
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm md:p-8">
        <SectionHeading
          icon={ClipboardCheck}
          eyebrow="Base para o planejamento"
          title="Estudo de caso pedagógico"
          description="É um procedimento coletivo, contextualizado e funcional. Seu objetivo é fundamentar decisões educacionais com evidências do cotidiano escolar."
        />

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {caseStudyElements.map((item, index) => (
            <div key={item} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">{index + 1}</span>
              <p className="text-sm font-medium leading-5 text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-blue-950">Como o estudo fundamenta o PAEE</h2>
          <div className="mt-5 space-y-3">
            {mappings.map(([source, result]) => (
              <div key={source} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                <span className="font-medium text-slate-700">{source}</span>
                <ArrowRight size={16} className="text-blue-500" />
                <span className="font-semibold text-blue-800">{result}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-bold text-blue-950">Sequência de documentos na plataforma</h2>
          <div className="mt-5 space-y-4">
            <DocumentStep number="1" title="Estudo de caso" text="Reúne dados das entrevistas, avaliação do estudante e observações escolares." />
            <DocumentStep number="2" title="PAEE" text="É elaborado pelo profissional do AEE a partir das barreiras, potencialidades e necessidades identificadas." />
            <DocumentStep number="3" title="PEI" text="É produzido pelo professor da sala regular com base nas orientações e estratégias definidas no PAEE." />
          </div>
        </div>
      </section>
    </div>
  )
}

function AeeProfessionalSection() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <SectionHeading
          icon={ShieldCheck}
          eyebrow="Atuação especializada"
          title="Responsabilidades do profissional do AEE"
          description="O AEE organiza recursos e estratégias para eliminar barreiras e ampliar o acesso ao currículo comum."
        />
        <Checklist
          className="mt-6"
          items={[
            "Conduzir e sistematizar o estudo de caso em colaboração com a equipe e a família.",
            "Elaborar, registrar e revisar periodicamente o PAEE.",
            "Definir objetivos, recursos de acessibilidade, tecnologias assistivas e estratégias individualizadas.",
            "Orientar a sala comum, a gestão, a família e o profissional de apoio.",
            "Produzir relatórios próprios, detalhados e baseados em evidências observáveis.",
            "Avaliar os relatórios diários do PA, registrar devolutivas e solicitar ajustes quando necessário."
          ]}
        />
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-bold text-amber-950">O AEE não deve ser confundido com</h2>
        <div className="mt-5 space-y-3">
          {["Reforço escolar ou repetição das atividades da sala comum", "Atendimento clínico, terapêutico ou diagnóstico", "Substituição da matrícula e da participação na classe comum", "Responsabilidade isolada pela inclusão escolar"].map((item) => (
            <div key={item} className="flex gap-3 rounded-xl bg-white/70 p-4 text-sm leading-5 text-amber-950">
              <XCircle size={18} className="mt-0.5 shrink-0 text-amber-700" />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SupportProfessionalSection() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm md:p-8">
        <SectionHeading
          icon={Accessibility}
          eyebrow="Apoio funcional"
          title="Atuação do profissional de apoio (PA)"
          description="O PA auxilia nas atividades em que o estudante ainda não possui autonomia, sob orientação da gestão e do AEE."
        />

        <div className="mt-7 grid gap-6 xl:grid-cols-2">
          <GuidanceList title="O que faz" tone="positive" items={paDoes} />
          <GuidanceList title="O que não faz" tone="negative" items={paDoesNot} />
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-6">
        <h2 className="text-lg font-bold text-cyan-950">Como produzir o relatório diário do PA</h2>
        <p className="mt-2 text-sm leading-6 text-cyan-900">Registre fatos observáveis, de forma objetiva e sem emitir diagnóstico ou avaliação pedagógica.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {["Apoios realizados", "Resposta do estudante", "Nível de autonomia", "Intercorrências e comunicação ao AEE"].map((item, index) => (
            <div key={item} className="rounded-xl bg-white p-4 shadow-sm">
              <span className="text-xs font-bold text-cyan-700">0{index + 1}</span>
              <p className="mt-2 text-sm font-semibold text-cyan-950">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SchoolTeamSection() {
  const responsibilities = [
    ["Gestão escolar", "Lidera a cultura inclusiva, formaliza fluxos, organiza o AEE, acompanha o PA e documenta as decisões institucionais."],
    ["Professor da sala comum", "Observa, registra e garante o acesso ao currículo, planejando e avaliando a aprendizagem de todos os estudantes."],
    ["Coordenação pedagógica", "Articula os profissionais, acompanha os registros e apoia a adaptação das práticas e avaliações."],
    ["Família ou responsável", "Compartilha informações relevantes, participa do estudo de caso e acompanha a evolução da autonomia e dos apoios."],
    ["Equipe multiprofissional", "Contribui quando necessário, respeitando a natureza pedagógica das decisões escolares e os limites de cada atuação."]
  ]

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm md:p-8">
      <SectionHeading
        icon={School}
        eyebrow="Responsabilidade coletiva"
        title="Gestão, sala comum, família e rede"
        description="A inclusão se concretiza por decisões institucionais, planejamento conjunto, clareza de papéis e acompanhamento contínuo."
      />

      <div className="mt-7 grid gap-4 lg:grid-cols-2">
        {responsibilities.map(([role, description]) => (
          <article key={role} className="rounded-2xl border border-slate-200 p-5 last:lg:col-span-2">
            <h3 className="font-bold text-blue-950">{role}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-blue-50 p-5">
        <h3 className="font-bold text-blue-950">Decisões sobre o profissional de apoio</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          A solicitação, manutenção ou retirada do apoio deve resultar de avaliação funcional, estudo de caso, registro no PAEE e reavaliação coletiva. O objetivo final é ampliar a independência do estudante.
        </p>
      </div>
    </section>
  )
}

function SectionHeading({ icon: Icon, eyebrow, title, description }: { icon: LucideIcon; eyebrow: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
        <Icon size={21} />
      </div>
      <div>
        <p className="text-sm font-semibold text-blue-600">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-bold text-blue-950">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  )
}

function PrincipleCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 p-5">
      <CheckCircle2 size={20} className="text-emerald-600" />
      <h3 className="mt-3 font-bold text-blue-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </article>
  )
}

function InfoCard({ icon: Icon, title, items }: { icon: LucideIcon; title: string; items: string[] }) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-blue-600" />
        <h2 className="font-bold text-blue-950">{title}</h2>
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-5 text-slate-600">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

function DocumentStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{number}</span>
      <div>
        <h3 className="font-bold text-blue-950">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-600">{text}</p>
      </div>
    </div>
  )
}

function Checklist({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <ul className={["space-y-3", className].join(" ")}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
          <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-600" />
          {item}
        </li>
      ))}
    </ul>
  )
}

function GuidanceList({ title, tone, items }: { title: string; tone: "positive" | "negative"; items: string[] }) {
  const Icon = tone === "positive" ? CheckCircle2 : XCircle
  const styles = tone === "positive"
    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
    : "border-rose-200 bg-rose-50 text-rose-950"

  return (
    <div className={["rounded-2xl border p-5", styles].join(" ")}>
      <h2 className="text-lg font-bold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6">
            <Icon size={18} className="mt-1 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
