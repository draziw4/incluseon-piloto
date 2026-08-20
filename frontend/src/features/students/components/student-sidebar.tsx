import {

  Brain,

  FileText,

  Activity,

  BarChart3

} from "lucide-react"


export function StudentSidebar() {

  return (

    <aside
      className="

      bg-white

      rounded-2xl

      p-4

      border

      border-blue-100

      space-y-2
    "
    >

      <button
        className="

        w-full

        flex
        items-center
        gap-3

        px-4
        py-3

        rounded-xl

        bg-blue-50

        text-blue-700

        font-medium
      "
      >

        <Brain size={20} />

        Visão Geral

      </button>

      <button
        className="

        w-full

        flex
        items-center
        gap-3

        px-4
        py-3

        rounded-xl

        hover:bg-blue-50
      "
      >

        <Activity size={20} />

        Histórico de acompanhamento

      </button>

      <button
        className="

        w-full

        flex
        items-center
        gap-3

        px-4
        py-3

        rounded-xl

        hover:bg-blue-50
      "
      >

        <FileText size={20} />

        Avaliações

      </button>

      <button
        className="

        w-full

        flex
        items-center
        gap-3

        px-4
        py-3

        rounded-xl

        hover:bg-blue-50
      "
      >

        <BarChart3 size={20} />

        Analytics

      </button>

    </aside>
  )
}
