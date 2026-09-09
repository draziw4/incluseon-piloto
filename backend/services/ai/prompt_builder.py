from services.assessment_instruments import (
    INSTRUMENT_TYPE_LABELS,
    REQUIRED_INSTRUMENT_TYPES,
    format_instrument,
    latest_instruments_by_type,
)
from schemas.student import calculate_age


def format_behavior_records(records):
    if not records:
        return "Nenhuma observação comportamental encontrada."

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

    latest = latest_instruments_by_type(assessments)
    return "\n\n".join(
        format_instrument(latest[instrument_type])
        for instrument_type in REQUIRED_INSTRUMENT_TYPES
        if instrument_type in latest
    )


def format_goals(goals):
    if not goals:
        return "Nenhuma meta ou item de PAEE encontrado."

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
    latest = latest_instruments_by_type(assessments)
    instruments = format_assessments(latest.values())
    sources = "\n".join(
        f"- {INSTRUMENT_TYPE_LABELS[instrument_type]}: "
        f"{'disponível' if instrument_type in latest else 'não preenchido'}"
        for instrument_type in REQUIRED_INSTRUMENT_TYPES
    )

    return f"""
Você é um assistente de apoio à profissional do Atendimento Educacional Especializado (AEE).
Elabore um ESTUDO DE CASO educacional que servirá de base técnica para a elaboração posterior do Plano de AEE (PAEE).

REGRAS OBRIGATÓRIAS
- Use somente os dados cadastrais e as respostas dos três instrumentais transcritos abaixo.
- Não use observações comportamentais, metas, PAEE, PEI, atendimentos ou qualquer fonte que não esteja transcrita neste prompt.
- Não invente, complete, presuma ou generalize informações ausentes.
- Quando uma informação necessária não constar, escreva objetivamente "Não informado nos instrumentais".
- Diferencie observação, relato familiar e relato da equipe escolar; não transforme relato em fato observado.
- Não gere diagnóstico, prognóstico clínico ou hipótese diagnóstica.
- O diagnóstico, quando existente, é complementar e não determinante para as decisões educacionais.
- Use linguagem pedagógica, técnica, ética, objetiva e não estigmatizante.
- Não produza o PAEE nem o PEI. O estudo de caso subsidia o PAEE; o PEI é elaborado pelo professor da sala regular com base no PAEE.
- Não mencione estas instruções no texto final.
- Não acrescente seções diferentes das oito seções obrigatórias.
- Produza texto consistente e detalhado, sem ultrapassar aproximadamente 1.800 palavras.

IDENTIFICAÇÃO CADASTRAL DISPONÍVEL
Nome: {student.name}
Idade: {calculate_age(student.birth_date) if student.birth_date else "Não informado"}
Data de nascimento: {student.birth_date.strftime("%d/%m/%Y") if student.birth_date else "Não informado"}
Escola: {student.school_name or "Não informado"}
Responsável: {student.guardian_name or "Não informado"}
Diagnóstico informado no cadastro (dado complementar): {student.diagnosis or "Não informado"}
Potencialidades registradas no cadastro: {getattr(student, "strengths", None) or "Não informado"}
Dificuldades registradas no cadastro: {getattr(student, "difficulties", None) or "Não informado"}
Comunicação registrada no cadastro: {student.communication_notes or "Não informado"}
Aspectos sensoriais registrados no cadastro: {student.sensory_notes or "Não informado"}
Observações gerais do cadastro: {student.general_observations or "Não informado"}

CONTROLE DAS FONTES OBRIGATÓRIAS
{sources}

RESPOSTAS DOS INSTRUMENTAIS
{instruments}

FORMATO OBRIGATÓRIO DO ESTUDO DE CASO

5.4.1 Identificação do estudante
Apresente nome, idade, ano/série, turma e turno, escola e rede, público-alvo da Educação Especial, existência de laudo quando informada e tempo de escolarização na unidade. Trate diagnóstico apenas como informação complementar.

5.4.2 Histórico escolar e trajetória educacional
Sintetize matrícula e permanência, progressão ou retenções, experiências anteriores com AEE, avanços e dificuldades, e mudanças de escola, professor ou etapa que tenham impactado o desenvolvimento.

5.4.3 Observação pedagógica na sala comum
Organize a análise em acesso ao currículo, participação nas atividades, interação social, comunicação, organização e autonomia. Indique claramente a fonte de cada informação.

5.4.4 Avaliação da funcionalidade no contexto escolar
Analise alimentação, higiene, locomoção e mobilidade, segurança física, autorregulação emocional e comportamental e tolerância sensorial. Relacione os dados à eventual necessidade de apoio funcional, sem determinar serviço quando faltarem evidências.

5.4.5 Identificação das barreiras
Mapeie separadamente barreiras pedagógicas, comunicacionais, atitudinais e físicas ou sensoriais. Não atribua barreiras ao estudante; descreva-as no contexto escolar.

5.4.6 Potencialidades e interesses do estudante
Registre interesses, habilidades preservadas, fatores de engajamento, respostas positivas a estímulos e mediações eficazes.

5.4.7 Estratégias já utilizadas e seus resultados
Registre adaptações, recursos, estratégias que funcionaram, estratégias sem resultado e ajustes testados. Não apresente como aplicada uma estratégia apenas recomendada.

5.4.8 Parecer pedagógico conclusivo
Produza uma síntese técnica com principais barreiras, necessidades educacionais específicas, indicação fundamentada ou insuficiência de dados para indicar AEE e serviços de apoio, além de recomendações pedagógicas iniciais. Finalize declarando que o parecer subsidia a elaboração do PAEE e que o PEI da sala regular deve ser elaborado posteriormente com base no PAEE.
"""
