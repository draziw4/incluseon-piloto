def format_behavior_records(records):
    if not records:
        return "Nenhum registro ABA encontrado."

    lines = []

    for record in records:
        lines.append(
            f"""
- Data: {record.created_at.strftime("%d/%m/%Y")}
  Profissional responsável pelo registro: {record.created_by.name if record.created_by else "Não identificado (registro anterior)"}
  Ambiente: {record.environment or "Não informado"}
  Antecedente: {record.antecedent}
  Comportamento: {record.behavior}
  Consequência: {record.consequence}
  Intensidade: {record.intensity or "Não informada"}
  Estratégia usada: {record.strategy_used or "Não informada"}
  Funcionou: {format_boolean(record.strategy_effective)}
"""
        )

    return "\n".join(lines)


def format_assessments(assessments):
    if not assessments:
        return "Nenhuma avaliação ou entrevista encontrada."

    lines = []

    for assessment in assessments:
        data = assessment.assessment_data or {}

        lines.append(
            f"""
- Data: {assessment.created_at.strftime("%d/%m/%Y")}
  Profissional responsável: {assessment.psychologist.name if assessment.psychologist else "Não identificado"}
  Título: {assessment.title}
  Tipo: {assessment.assessment_type}
  Histórico: {data.get("student_history", "Não informado")}
  Contexto familiar: {data.get("family_context", "Não informado")}
  Contexto escolar: {data.get("school_context", "Não informado")}
  Dificuldades: {data.get("difficulties", "Não informado")}
  Potencialidades: {data.get("strengths", "Não informado")}
  Apoios recomendados: {data.get("recommended_supports", "Não informado")}
"""
        )

    return "\n".join(lines)


def format_goals(goals):
    if not goals:
        return "Nenhuma meta ou item de PEI encontrado."

    return "\n".join(
        f"""
- Meta: {goal.title}
  Área: {goal.area}
  Status: {goal.status.value}
  Progresso: {goal.progress}%
  Evidências: {goal.evidence_notes or "Não informadas"}
  Profissional responsável: {goal.created_by.name if goal.created_by else "Não identificado"}
"""
        for goal in goals
    )


def format_appointments(appointments):
    if not appointments:
        return "Nenhum atendimento encontrado."

    return "\n".join(
        f"""
- Data: {appointment.scheduled_at.strftime("%d/%m/%Y")}
  Tipo: {appointment.appointment_type.value}
  Status: {appointment.status.value}
  Objetivo: {appointment.objective or "Não informado"}
  Síntese: {appointment.summary or "Não informada"}
  Observações: {appointment.observations or "Não informadas"}
  Próximos passos: {appointment.next_steps or "Não informados"}
  Profissional responsável: {appointment.professional.name if appointment.professional else "Não identificado"}
"""
        for appointment in appointments
    )


def format_boolean(value):
    if value is True:
        return "Sim"

    if value is False:
        return "Não"

    return "Não informado"


def build_case_study_prompt(
    student,
    assessments,
    behavior_records,
    goals,
    appointments,
    analytics,
):
    recent_behavior_records = behavior_records[:10]
    recent_assessments = assessments[:3]

    return f"""
Você é um assistente de apoio à elaboração de estudos de caso educacionais e comportamentais.

Regras importantes:
- Não gere diagnóstico.
- Não substitua avaliação profissional.
- Use linguagem técnica, ética e objetiva.
- Baseie-se apenas nos dados fornecidos.
- Quando não houver dados suficientes, diga que há dados insuficientes.
- Evite conclusões absolutas.

Dados do aluno:
Nome: {student.name}
Idade: {student.age}
Diagnóstico informado: {student.diagnosis or "Não informado"}
Escola: {student.school_name or "Não informado"}
Responsável: {student.guardian_name or "Não informado"}

Observações gerais:
Comunicação: {student.communication_notes or "Não informado"}
Sensorial: {student.sensory_notes or "Não informado"}
Observações: {student.general_observations or "Não informado"}

Resumo analítico dos registros ABA:
Total de registros: {analytics["records_count"]}
Intensidade média: {analytics["average_intensity"]}
Ambiente mais recorrente: {analytics["most_common_environment"]}
Estratégia mais eficaz registrada: {analytics["most_effective_strategy"]}

Últimos registros ABA relevantes:
{format_behavior_records(recent_behavior_records)}

Últimas avaliações e entrevistas:
{format_assessments(recent_assessments)}

Metas e itens de PEI:
{format_goals(goals)}

Atendimentos registrados pela equipe vinculada:
{format_appointments(appointments)}

Gere um estudo de caso com as seções:

1. Resumo do perfil do aluno
2. Contexto familiar e escolar
3. Padrões comportamentais observados
4. Possíveis hipóteses funcionais, sem diagnóstico
5. Estratégias que parecem favorecer o manejo
6. Pontos de atenção
7. Evolução das metas e do acompanhamento multiprofissional
8. Recomendações iniciais para acompanhamento
9. Próximos passos sugeridos

Limite o relatório a aproximadamente 900 palavras.
"""
