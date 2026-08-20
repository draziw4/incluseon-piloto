export const instrumentTypes = [
  "parent_interview",
  "school_interview",
  "student_assessment",
] as const

export type InstrumentType = (typeof instrumentTypes)[number]

export type InstrumentAnswer = string | string[]

type InstrumentOption = {
  label: string
  value: string
}

export type InstrumentField = {
  name: string
  label: string
  type: "text" | "textarea" | "date" | "number" | "select" | "checkbox-group"
  placeholder?: string
  options?: InstrumentOption[]
  helpText?: string
  showWhen?: {
    field: string
    equals?: string
    includes?: string
  }
}

export type InstrumentSection = {
  title: string
  description?: string
  fields: InstrumentField[]
}

export type InstrumentDefinition = {
  type: InstrumentType
  label: string
  defaultTitle: string
  description: string
  sections: InstrumentSection[]
}

const yesNoOptions: InstrumentOption[] = [
  { label: "Sim", value: "sim" },
  { label: "Não", value: "nao" },
  { label: "Não informado", value: "nao_informado" },
]

const profileFields = (prefix: string, label: string): InstrumentField[] => [
  {
    name: `${prefix}_strengths`,
    label: `${label} — habilidades observadas`,
    type: "textarea",
  },
  {
    name: `${prefix}_difficulties`,
    label: `${label} — dificuldades observadas`,
    type: "textarea",
  },
]

export const instrumentDefinitions: Record<InstrumentType, InstrumentDefinition> = {
  parent_interview: {
    type: "parent_interview",
    label: "Entrevista com pais ou responsáveis",
    defaultTitle: "Entrevista com pais ou responsáveis",
    description: "Histórico familiar, desenvolvimento, saúde, autonomia e trajetória escolar.",
    sections: [
      {
        title: "Identificação familiar",
        fields: [
          { name: "father_name", label: "Nome do pai", type: "text" },
          { name: "father_education", label: "Escolaridade do pai", type: "text" },
          { name: "father_profession", label: "Profissão do pai", type: "text" },
          { name: "father_age", label: "Idade do pai", type: "number" },
          { name: "mother_name", label: "Nome da mãe", type: "text" },
          { name: "mother_education", label: "Escolaridade da mãe", type: "text" },
          { name: "mother_profession", label: "Profissão da mãe", type: "text" },
          { name: "mother_age", label: "Idade da mãe", type: "number" },
          { name: "household_members_count", label: "Quantas pessoas moram na casa?", type: "number" },
          { name: "household_members", label: "Quem são elas?", type: "textarea" },
          { name: "family_workers", label: "Quem trabalha na família?", type: "textarea" },
        ],
      },
      {
        title: "Desenvolvimento e saúde",
        fields: [
          { name: "pregnancy_history", label: "Como foi a gravidez?", type: "textarea" },
          { name: "childhood_development", label: "Como foi o desenvolvimento na infância?", type: "textarea" },
          { name: "current_health", label: "Qual é o estado de saúde atual?", type: "textarea" },
          { name: "has_health_diagnosis", label: "Há diagnóstico da área da saúde?", type: "select", options: yesNoOptions },
          {
            name: "health_diagnosis_details",
            label: "Data e resultado do diagnóstico informado",
            type: "textarea",
            helpText: "O diagnóstico é complementar e não determina, por si só, as necessidades educacionais.",
            showWhen: { field: "has_health_diagnosis", equals: "sim" },
          },
          { name: "uses_controlled_medication", label: "Faz uso de medicamento controlado?", type: "select", options: yesNoOptions },
          {
            name: "controlled_medication_details",
            label: "Quais medicamentos?",
            type: "textarea",
            showWhen: { field: "uses_controlled_medication", equals: "sim" },
          },
          { name: "has_health_recommendation", label: "Há recomendação da área da saúde?", type: "select", options: yesNoOptions },
          {
            name: "health_recommendation_details",
            label: "Quais recomendações?",
            type: "textarea",
            showWhen: { field: "has_health_recommendation", equals: "sim" },
          },
        ],
      },
      {
        title: "Rotina, vínculos e autonomia",
        fields: [
          { name: "attachment_person", label: "Por quem o estudante tem maior carinho?", type: "textarea" },
          { name: "authority_person", label: "A quem ele mais obedece?", type: "textarea" },
          { name: "student_routine", label: "Como é a rotina e o dia a dia do estudante?", type: "textarea" },
          { name: "family_relationship", label: "Como é o convívio familiar? Há dificuldades?", type: "textarea" },
          { name: "perceived_behavior_difficulties", label: "Quais dificuldades de comportamento a família percebe?", type: "textarea" },
          { name: "independent_activities", label: "Quais atividades realiza sozinho(a)?", type: "textarea" },
          { name: "feeding_autonomy", label: "Autonomia na alimentação", type: "textarea" },
          { name: "hygiene_autonomy", label: "Autonomia na higiene", type: "textarea" },
          { name: "mobility_autonomy", label: "Locomoção e mobilidade", type: "textarea" },
          { name: "safety_and_self_regulation", label: "Segurança física e autorregulação", type: "textarea" },
          { name: "sensory_tolerance", label: "Tolerância a ruídos, luz, toque e outros estímulos", type: "textarea" },
        ],
      },
      {
        title: "Trajetória escolar e participação social",
        fields: [
          { name: "school_start_age", label: "Com quantos anos começou a estudar?", type: "number" },
          { name: "school_difficulties", label: "Quais dificuldades apresentou na escola?", type: "textarea" },
          { name: "has_repetition_or_dropout", label: "Houve repetência ou abandono?", type: "select", options: yesNoOptions },
          {
            name: "repetition_or_dropout_details",
            label: "Especifique a repetência ou o abandono",
            type: "textarea",
            showWhen: { field: "has_repetition_or_dropout", equals: "sim" },
          },
          { name: "difficult_subjects", label: "Quais disciplinas apresentam maiores dificuldades?", type: "textarea" },
          { name: "family_leisure", label: "Como acontece o lazer da família?", type: "textarea" },
          { name: "friendships", label: "O estudante tem amigos e brinca com eles?", type: "textarea" },
          { name: "school_engagement", label: "Gosta de ir à escola e de fazer as atividades escolares?", type: "textarea" },
        ],
      },
      {
        title: "Responsáveis pelo registro",
        fields: [
          { name: "informant_name", label: "Responsável pelas informações", type: "text" },
          { name: "relationship_to_student", label: "Grau de parentesco com o estudante", type: "text" },
          { name: "aee_teacher_name", label: "Professor(a) do AEE", type: "text" },
          { name: "school_coordinator_name", label: "Coordenador(a) da escola", type: "text" },
          { name: "interview_place", label: "Local", type: "text" },
          { name: "interview_date", label: "Data", type: "date" },
        ],
      },
    ],
  },
  school_interview: {
    type: "school_interview",
    label: "Entrevista com equipe gestora e professores",
    defaultTitle: "Entrevista com equipe gestora e professores",
    description: "Inclusão, barreiras, práticas pedagógicas, interação e expectativas da escola.",
    sections: [
      {
        title: "Identificação da escola",
        fields: [
          { name: "school_name", label: "Nome da escola", type: "text" },
          { name: "school_address", label: "Endereço", type: "text" },
          { name: "municipality", label: "Município", type: "text" },
        ],
      },
      {
        title: "Política inclusiva e organização",
        fields: [
          { name: "inclusion_principles", label: "Quais princípios e valores a escola defende em relação à inclusão?", type: "textarea" },
          { name: "inclusion_practice", label: "Como a escola percebe e trabalha a inclusão do estudante?", type: "textarea" },
          { name: "inclusive_political_pedagogical_project", label: "O projeto político-pedagógico está adequado à realidade inclusiva?", type: "textarea" },
          { name: "physical_accessibility", label: "Acessibilidade física", type: "textarea" },
          { name: "class_organization", label: "Organização das turmas", type: "textarea" },
          { name: "pedagogical_accessibility_material", label: "Material pedagógico e de acessibilidade", type: "textarea" },
          { name: "school_family_relationship", label: "Relação escola e família", type: "textarea" },
          { name: "pedagogical_guidance", label: "Orientação pedagógica e planejamento", type: "textarea" },
          { name: "continuing_education", label: "Formação continuada", type: "textarea" },
          { name: "assessment_procedures", label: "Procedimentos de avaliação", type: "textarea" },
          { name: "project_development", label: "Desenvolvimento de projetos", type: "textarea" },
          { name: "study_groups", label: "Grupos de estudos", type: "textarea" },
        ],
      },
      {
        title: "Prática pedagógica e participação do estudante",
        fields: [
          { name: "discipline_and_difficulty_response", label: "Como a escola enfrenta indisciplina e dificuldades dos estudantes?", type: "textarea" },
          { name: "teacher_work_difficulties", label: "Quais dificuldades o professor encontra no trabalho com o estudante?", type: "textarea" },
          { name: "identified_learning_and_style", label: "Quais aprendizagens e estilo de aprendizagem foram identificados?", type: "textarea" },
          { name: "inclusive_methodology", label: "Como o planejamento contempla diferentes estilos de aprendizagem?", type: "textarea" },
          { name: "class_and_teacher_interaction", label: "Como ocorre a interação da turma e do professor com o estudante?", type: "textarea" },
          { name: "school_activity_participation", label: "Como o estudante participa de biblioteca, recreio, informática, cultura e projetos?", type: "textarea" },
          { name: "aee_progress_expectations", label: "Quais avanços a escola espera com a participação no AEE?", type: "textarea" },
        ],
      },
      {
        title: "Barreiras e estratégias já utilizadas",
        description: "Complemento necessário para o estudo de caso e para a elaboração posterior do PAEE.",
        fields: [
          { name: "pedagogical_barriers", label: "Barreiras pedagógicas identificadas", type: "textarea" },
          { name: "communication_barriers", label: "Barreiras comunicacionais identificadas", type: "textarea" },
          { name: "attitudinal_barriers", label: "Barreiras atitudinais identificadas", type: "textarea" },
          { name: "physical_and_sensory_barriers", label: "Barreiras físicas e sensoriais identificadas", type: "textarea" },
          { name: "strategies_already_used", label: "Adaptações, recursos e estratégias já utilizados", type: "textarea" },
          { name: "successful_strategies", label: "O que funcionou e quais resultados foram observados?", type: "textarea" },
          { name: "unsuccessful_strategies", label: "O que não produziu resultado e quais ajustes já foram testados?", type: "textarea" },
        ],
      },
      {
        title: "Responsável pelo registro",
        fields: [
          { name: "responsible_professional", label: "Profissional responsável", type: "text" },
          { name: "interview_place", label: "Local", type: "text" },
          { name: "interview_date", label: "Data", type: "date" },
        ],
      },
    ],
  },
  student_assessment: {
    type: "student_assessment",
    label: "Instrumento avaliativo do estudante",
    defaultTitle: "Instrumento avaliativo do estudante",
    description: "Perfil funcional, acesso ao currículo, participação, comunicação, autonomia e necessidades educacionais.",
    sections: [
      {
        title: "Identificação do estudante e do AEE",
        fields: [
          { name: "student_name", label: "Nome do estudante", type: "text" },
          { name: "birth_date", label: "Data de nascimento", type: "date" },
          { name: "school_entry_age", label: "Idade em que entrou na escola", type: "number" },
          { name: "address", label: "Endereço", type: "text" },
          { name: "regular_school", label: "Escola da classe comum", type: "text" },
          { name: "grade_year", label: "Série/Ano", type: "text" },
          { name: "class_and_shift", label: "Turma e turno", type: "text" },
          { name: "school_network", label: "Rede de ensino", type: "text" },
          { name: "school_entry_date", label: "Data de ingresso na unidade", type: "date" },
          {
            name: "special_education_target",
            label: "Público-alvo da Educação Especial",
            type: "checkbox-group",
            options: [
              { value: "deficiencia_visual", label: "Deficiência visual" },
              { value: "deficiencia_auditiva", label: "Deficiência auditiva" },
              { value: "deficiencia_intelectual", label: "Deficiência intelectual" },
              { value: "tea", label: "Transtorno do Espectro Autista (TEA)" },
              { value: "deficiencia_fisica", label: "Deficiência física" },
              { value: "altas_habilidades", label: "Altas habilidades/Superdotação" },
              { value: "outra_condicao", label: "Outra condição informada" },
            ],
          },
          {
            name: "other_condition",
            label: "Outra condição informada",
            type: "text",
            showWhen: { field: "special_education_target", includes: "outra_condicao" },
          },
          {
            name: "involved_professionals",
            label: "Outros profissionais envolvidos",
            type: "checkbox-group",
            options: [
              { value: "fonoaudiologo", label: "Fonoaudiólogo" },
              { value: "psicologo", label: "Psicólogo" },
              { value: "fisioterapeuta", label: "Fisioterapeuta" },
              { value: "psicopedagogo", label: "Psicopedagogo" },
              { value: "area_medica", label: "Área médica" },
              { value: "outro", label: "Outro" },
            ],
          },
          { name: "medical_specialty", label: "Especialidade médica", type: "text", showWhen: { field: "involved_professionals", includes: "area_medica" } },
          { name: "other_professional", label: "Outro profissional", type: "text", showWhen: { field: "involved_professionals", includes: "outro" } },
          { name: "resource_room_school", label: "Escola que oferece a sala de recursos multifuncionais", type: "text" },
          {
            name: "weekly_frequency",
            label: "Frequência semanal",
            type: "select",
            options: [
              { value: "2_vezes", label: "2 vezes por semana" },
              { value: "3_vezes", label: "3 vezes por semana" },
              { value: "outra", label: "Outra" },
            ],
          },
          { name: "weekly_frequency_other", label: "Outra frequência", type: "text", showWhen: { field: "weekly_frequency", equals: "outra" } },
          {
            name: "service_duration",
            label: "Tempo de atendimento",
            type: "select",
            options: [
              { value: "1_hora", label: "1 hora" },
              { value: "1h30", label: "1 hora e 30 minutos" },
              { value: "outro", label: "Outro" },
            ],
          },
          { name: "service_duration_other", label: "Outro tempo de atendimento", type: "text", showWhen: { field: "service_duration", equals: "outro" } },
          {
            name: "service_composition",
            label: "Composição do atendimento",
            type: "checkbox-group",
            options: [
              { value: "individual", label: "Atendimento individual" },
              { value: "grupo", label: "Atendimento em grupo" },
              { value: "sala_comum", label: "Atendimento na sala comum com a turma" },
            ],
          },
          { name: "aee_teacher", label: "Professor(a) do AEE", type: "text" },
          { name: "case_description", label: "Descrição inicial do caso", type: "textarea" },
        ],
      },
      {
        title: "Perfil cognitivo",
        description: "Registre habilidades e dificuldades separadamente, com base em observações.",
        fields: [
          ...profileFields("perception", "Percepção"),
          ...profileFields("attention", "Atenção"),
          ...profileFields("memory", "Memória"),
          ...profileFields("language", "Linguagem"),
          ...profileFields("logical_reasoning", "Raciocínio lógico"),
        ],
      },
      {
        title: "Perfil psicomotor e pessoal/social",
        fields: [
          ...profileFields("posture_mobility", "Postura, locomoção e manipulação de objetos"),
          ...profileFields("laterality", "Lateralidade"),
          ...profileFields("balance", "Equilíbrio"),
          ...profileFields("spatiotemporal_orientation", "Orientação espaço-temporal"),
          ...profileFields("motor_coordination", "Coordenação motora"),
          ...profileFields("emotional_area", "Área emocional"),
          ...profileFields("affective_area", "Área afetiva"),
          ...profileFields("interpersonal_relationship", "Relacionamento interpessoal"),
        ],
      },
      {
        title: "Observação pedagógica na sala comum",
        description: "Dados necessários para as seções 5.4.3 e 5.4.4 do estudo de caso.",
        fields: [
          { name: "oral_explanation_comprehension", label: "Como compreende explicações orais?", type: "textarea" },
          { name: "required_mediation", label: "Necessita de mediação visual, concreta ou tecnológica?", type: "textarea" },
          { name: "task_initiation_and_completion", label: "Como inicia e conclui atividades?", type: "textarea" },
          { name: "individual_and_group_participation", label: "Como participa de atividades individuais e coletivas?", type: "textarea" },
          { name: "response_when_requested", label: "Como responde quando solicitado?", type: "textarea" },
          { name: "attention_duration", label: "Por quanto tempo mantém a atenção e em quais condições?", type: "textarea" },
          { name: "peer_interaction", label: "Como interage com colegas?", type: "textarea" },
          { name: "adult_reference", label: "Busca o adulto como referência?", type: "textarea" },
          { name: "isolation_or_conflicts", label: "Há isolamento ou conflitos frequentes?", type: "textarea" },
          { name: "functional_communication", label: "Como ocorre a comunicação funcional (oral, gestos, imagens ou símbolos)?", type: "textarea" },
          { name: "command_comprehension", label: "Como compreende comandos simples e complexos?", type: "textarea" },
          { name: "materials_and_routines", label: "Como organiza materiais e segue rotinas?", type: "textarea" },
          { name: "constant_task_support", label: "Necessita de ajuda constante para iniciar tarefas?", type: "textarea" },
          { name: "school_feeding_autonomy", label: "Autonomia na alimentação no ambiente escolar", type: "textarea" },
          { name: "school_hygiene_autonomy", label: "Autonomia na higiene no ambiente escolar", type: "textarea" },
          { name: "school_mobility", label: "Locomoção e mobilidade no ambiente escolar", type: "textarea" },
          { name: "physical_safety", label: "Segurança física", type: "textarea" },
          { name: "emotional_behavioral_regulation", label: "Autorregulação emocional e comportamental", type: "textarea" },
          { name: "school_sensory_tolerance", label: "Tolerância a ruídos, luz, toque e outros estímulos", type: "textarea" },
        ],
      },
      {
        title: "Necessidades, potencialidades e acessibilidade curricular",
        fields: [
          { name: "communication_system", label: "Sistema linguístico utilizado na comunicação", type: "textarea" },
          { name: "resources_already_used", label: "Recursos ou equipamentos já utilizados", type: "textarea" },
          { name: "resources_needed", label: "Recursos ou equipamentos a providenciar", type: "textarea" },
          { name: "curricular_accessibility_implications", label: "Implicações para a acessibilidade curricular", type: "textarea" },
          { name: "student_interests", label: "Áreas de maior interesse", type: "textarea" },
          { name: "preserved_skills", label: "Habilidades preservadas e potencialidades", type: "textarea" },
          { name: "engagement_factors", label: "Estratégias e estímulos que favorecem o engajamento", type: "textarea" },
          { name: "effective_mediation", label: "Formas eficazes de mediação já observadas", type: "textarea" },
          { name: "initial_support_recommendations", label: "Necessidades de apoio e recomendações pedagógicas iniciais", type: "textarea" },
        ],
      },
    ],
  },
}

export function getInstrumentDefinition(type?: string) {
  if (!type || !instrumentTypes.includes(type as InstrumentType)) return null
  return instrumentDefinitions[type as InstrumentType]
}

export function getInstrumentField(type: string, fieldName: string) {
  const definition = getInstrumentDefinition(type)
  return definition?.sections.flatMap((section) => section.fields).find((field) => field.name === fieldName)
}

export function formatInstrumentAnswer(field: InstrumentField, answer: unknown) {
  if (Array.isArray(answer)) {
    return answer
      .map((value) => field.options?.find((option) => option.value === value)?.label ?? String(value))
      .join(", ")
  }

  if (typeof answer !== "string" || !answer.trim()) return "Não informado"
  return field.options?.find((option) => option.value === answer)?.label ?? answer
}
