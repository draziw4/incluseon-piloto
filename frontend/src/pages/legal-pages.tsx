import { Brain } from "lucide-react"
import { Link } from "react-router-dom"

const privacySections = [
  ["Dados tratados", "Nome, e-mail e os dados que o próprio usuário registra durante o uso da plataforma."],
  ["Finalidade", "Autenticar o acesso, permitir o acompanhamento profissional e receber feedbacks sobre o piloto."],
  ["Google", "O login Google utiliza somente nome, e-mail e identificador da conta. O IncluseON não acessa senha, Gmail, Drive ou agenda."],
  ["Ambiente piloto", "Utilize exclusivamente dados fictícios. O banco gratuito é temporário e não deve armazenar informações pessoais ou clínicas reais."],
]

const termsSections = [
  ["Uso permitido", "O piloto existe para demonstração, testes e validação profissional com dados fictícios."],
  ["Responsabilidade profissional", "Relatórios e sugestões precisam ser revisados por profissional habilitado antes de qualquer aplicação."],
  ["Conta", "O usuário é responsável por proteger sua credencial e comunicar acessos indevidos."],
  ["Disponibilidade", "Por utilizar infraestrutura gratuita, o serviço pode iniciar lentamente e o armazenamento possui prazo limitado."],
]

export function PrivacyPage() {
  return <LegalPage title="Política de Privacidade" intro="Como os dados são tratados no piloto do IncluseON." sections={privacySections} />
}

export function TermsPage() {
  return <LegalPage title="Termos de Uso" intro="Condições para utilizar o ambiente de demonstração." sections={termsSections} />
}

function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: string[][] }) {
  return (
    <div className="min-h-screen bg-slate-50 px-5 py-10 text-slate-800">
      <main className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <Link to="/login" className="inline-flex items-center gap-3 text-blue-700">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Brain size={20} /></span>
          <span className="font-bold">IncluseON</span>
        </Link>
        <h1 className="mt-8 text-3xl font-bold text-blue-950">{title}</h1>
        <p className="mt-2 text-slate-600">{intro}</p>
        <p className="mt-2 text-xs text-slate-400">Atualizado em 13 de agosto de 2026.</p>
        <div className="mt-8 space-y-7">
          {sections.map(([heading, content]) => (
            <section key={heading}>
              <h2 className="text-lg font-semibold text-blue-950">{heading}</h2>
              <p className="mt-2 leading-relaxed text-slate-600">{content}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4 border-t border-slate-100 pt-6 text-sm">
          <Link to="/login" className="font-medium text-blue-600">Voltar ao login</Link>
          <Link to="/register" className="font-medium text-blue-600">Criar conta</Link>
        </div>
      </main>
    </div>
  )
}
