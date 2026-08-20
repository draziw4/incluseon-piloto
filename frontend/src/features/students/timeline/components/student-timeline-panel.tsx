import { Clock3 } from "lucide-react";

import { useStudentTimeline } from "../hooks/use-student-timeline";
import { TimelineItemCard } from "./timeline-item-card";

type Props = {
  studentId: string;
};

export function StudentTimelinePanel({ studentId }: Props) {
  const { data: timeline, isLoading, isError } = useStudentTimeline(studentId);

  const items = timeline ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-blue-950">Timeline do aluno</h2>

        <p className="text-sm text-zinc-500">
          Visualize avaliações, relatórios, observações comportamentais e eventos importantes em ordem
          cronológica.
        </p>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm text-zinc-500">
          Carregando timeline...
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
          Não foi possível carregar a timeline.
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="relative space-y-4">
          <div className="absolute `left-[21px]` top-4 h-[calc(100%-2rem)] w-px bg-blue-100" />

          {items.map((item, index) => (
            <div
              key={`${item.type}-${item.created_at}-${index}`}
              className="relative"
            >
              <TimelineItemCard item={item} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Clock3 size={28} />
          </div>

          <h3 className="text-lg font-bold text-blue-950">
            Nenhum evento na timeline
          </h3>

          <p className="mt-1 max-w-md text-sm text-zinc-500">
            A timeline será preenchida automaticamente quando forem cadastrados
            relatórios, observações comportamentais, entrevistas e avaliações.
          </p>
        </div>
      )}
    </div>
  );
}
