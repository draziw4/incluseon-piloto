from collections.abc import Iterable


REQUIRED_INSTRUMENT_TYPES = (
    "parent_interview",
    "school_interview",
    "student_assessment",
)

INSTRUMENT_TYPE_LABELS = {
    "parent_interview": "Entrevista com pais ou responsáveis",
    "school_interview": "Entrevista com equipe gestora e professores",
    "student_assessment": "Instrumento avaliativo do estudante",
}

FIELD_LABELS = {
    "father_name": "Nome do pai",
    "father_education": "Escolaridade do pai",
    "father_profession": "Profissão do pai",
    "father_age": "Idade do pai",
    "mother_name": "Nome da mãe",
    "mother_education": "Escolaridade da mãe",
    "mother_profession": "Profissão da mãe",
    "mother_age": "Idade da mãe",
    "household_members_count": "Quantidade de pessoas que moram na casa",
    "household_members": "Pessoas que moram na casa",
    "family_workers": "Pessoas da família que trabalham",
    "pregnancy_history": "Histórico da gravidez",
    "childhood_development": "Desenvolvimento na infância",
    "current_health": "Estado de saúde atual",
    "has_health_diagnosis": "Existência de diagnóstico da área da saúde",
    "health_diagnosis_details": "Data e resultado do diagnóstico informado",
    "uses_controlled_medication": "Uso de medicamento controlado",
    "controlled_medication_details": "Medicamentos informados",
    "has_health_recommendation": "Existência de recomendação da área da saúde",
    "health_recommendation_details": "Recomendações da área da saúde",
    "attachment_person": "Pessoa de maior vínculo afetivo",
    "authority_person": "Pessoa que constitui maior referência de autoridade",
    "student_routine": "Rotina do estudante",
    "family_relationship": "Convívio familiar",
    "perceived_behavior_difficulties": "Dificuldades de comportamento percebidas pela família",
    "independent_activities": "Atividades realizadas com autonomia",
    "feeding_autonomy": "Autonomia na alimentação",
    "hygiene_autonomy": "Autonomia na higiene",
    "mobility_autonomy": "Locomoção e mobilidade",
    "safety_and_self_regulation": "Segurança física e autorregulação",
    "sensory_tolerance": "Tolerância a estímulos sensoriais",
    "school_start_age": "Idade em que começou a estudar",
    "school_difficulties": "Dificuldades apresentadas na escola",
    "has_repetition_or_dropout": "Existência de repetência ou abandono",
    "repetition_or_dropout_details": "Detalhes de repetência ou abandono",
    "difficult_subjects": "Disciplinas com maiores dificuldades",
    "family_leisure": "Lazer da família",
    "friendships": "Amizades e brincadeiras com pares",
    "school_engagement": "Interesse pela escola e pelas atividades",
    "informant_name": "Responsável pelas informações",
    "relationship_to_student": "Grau de parentesco com o estudante",
    "aee_teacher_name": "Professor do AEE",
    "school_coordinator_name": "Coordenador da escola",
    "interview_place": "Local do registro",
    "interview_date": "Data do registro",
    "school_name": "Nome da escola",
    "school_address": "Endereço da escola",
    "municipality": "Município",
    "inclusion_principles": "Princípios e valores sobre inclusão",
    "inclusion_practice": "Percepção e prática de inclusão",
    "inclusive_political_pedagogical_project": "Adequação inclusiva do projeto político-pedagógico",
    "physical_accessibility": "Acessibilidade física",
    "class_organization": "Organização das turmas",
    "pedagogical_accessibility_material": "Material pedagógico e de acessibilidade",
    "school_family_relationship": "Relação escola e família",
    "pedagogical_guidance": "Orientação pedagógica e planejamento",
    "continuing_education": "Formação continuada",
    "assessment_procedures": "Procedimentos de avaliação",
    "project_development": "Desenvolvimento de projetos",
    "study_groups": "Grupos de estudos",
    "discipline_and_difficulty_response": "Postura diante de indisciplina e dificuldades",
    "teacher_work_difficulties": "Dificuldades do professor no trabalho com o estudante",
    "identified_learning_and_style": "Aprendizagens e estilo de aprendizagem identificados",
    "inclusive_methodology": "Metodologia para diferentes estilos de aprendizagem",
    "class_and_teacher_interaction": "Interação da turma e do professor com o estudante",
    "school_activity_participation": "Participação nas atividades e espaços da escola",
    "aee_progress_expectations": "Expectativas de avanços com o AEE",
    "pedagogical_barriers": "Barreiras pedagógicas",
    "communication_barriers": "Barreiras comunicacionais",
    "attitudinal_barriers": "Barreiras atitudinais",
    "physical_and_sensory_barriers": "Barreiras físicas e sensoriais",
    "strategies_already_used": "Adaptações, recursos e estratégias já utilizados",
    "successful_strategies": "Estratégias que funcionaram e resultados",
    "unsuccessful_strategies": "Estratégias sem resultado e ajustes testados",
    "responsible_professional": "Profissional responsável pelo registro",
    "student_name": "Nome do estudante",
    "birth_date": "Data de nascimento",
    "school_entry_age": "Idade de ingresso na escola",
    "address": "Endereço do estudante",
    "regular_school": "Escola da classe comum",
    "grade_year": "Série ou ano",
    "class_and_shift": "Turma e turno",
    "school_network": "Rede de ensino",
    "school_entry_date": "Data de ingresso na unidade",
    "special_education_target": "Público-alvo da Educação Especial",
    "other_condition": "Outra condição informada",
    "involved_professionals": "Outros profissionais envolvidos",
    "medical_specialty": "Especialidade médica",
    "other_professional": "Outro profissional",
    "resource_room_school": "Escola que oferece a sala de recursos multifuncionais",
    "weekly_frequency": "Frequência semanal no AEE",
    "weekly_frequency_other": "Outra frequência semanal",
    "service_duration": "Tempo de atendimento",
    "service_duration_other": "Outro tempo de atendimento",
    "service_composition": "Composição do atendimento",
    "aee_teacher": "Professor do AEE",
    "case_description": "Descrição inicial do caso",
    "oral_explanation_comprehension": "Compreensão de explicações orais",
    "required_mediation": "Mediação visual, concreta ou tecnológica necessária",
    "task_initiation_and_completion": "Início e conclusão de atividades",
    "individual_and_group_participation": "Participação individual e coletiva",
    "response_when_requested": "Resposta quando solicitado",
    "attention_duration": "Tempo e condições de manutenção da atenção",
    "peer_interaction": "Interação com colegas",
    "adult_reference": "Busca do adulto como referência",
    "isolation_or_conflicts": "Isolamento ou conflitos frequentes",
    "functional_communication": "Comunicação funcional",
    "command_comprehension": "Compreensão de comandos simples e complexos",
    "materials_and_routines": "Organização de materiais e seguimento de rotinas",
    "constant_task_support": "Necessidade de ajuda constante para iniciar tarefas",
    "school_feeding_autonomy": "Autonomia na alimentação na escola",
    "school_hygiene_autonomy": "Autonomia na higiene na escola",
    "school_mobility": "Locomoção e mobilidade na escola",
    "physical_safety": "Segurança física",
    "emotional_behavioral_regulation": "Autorregulação emocional e comportamental",
    "school_sensory_tolerance": "Tolerância sensorial na escola",
    "communication_system": "Sistema linguístico utilizado na comunicação",
    "resources_already_used": "Recursos ou equipamentos já utilizados",
    "resources_needed": "Recursos ou equipamentos a providenciar",
    "curricular_accessibility_implications": "Implicações para a acessibilidade curricular",
    "student_interests": "Áreas de maior interesse",
    "preserved_skills": "Habilidades preservadas e potencialidades",
    "engagement_factors": "Estratégias e estímulos que favorecem o engajamento",
    "effective_mediation": "Formas eficazes de mediação",
    "initial_support_recommendations": "Necessidades de apoio e recomendações pedagógicas iniciais",
}

PROFILE_LABELS = {
    "perception": "Percepção",
    "attention": "Atenção",
    "memory": "Memória",
    "language": "Linguagem",
    "logical_reasoning": "Raciocínio lógico",
    "posture_mobility": "Postura, locomoção e manipulação de objetos",
    "laterality": "Lateralidade",
    "balance": "Equilíbrio",
    "spatiotemporal_orientation": "Orientação espaço-temporal",
    "motor_coordination": "Coordenação motora",
    "emotional_area": "Área emocional",
    "affective_area": "Área afetiva",
    "interpersonal_relationship": "Relacionamento interpessoal",
}

ANSWER_LABELS = {
    "sim": "Sim",
    "nao": "Não",
    "nao_informado": "Não informado",
    "deficiencia_visual": "Deficiência visual",
    "deficiencia_auditiva": "Deficiência auditiva",
    "deficiencia_intelectual": "Deficiência intelectual",
    "tea": "Transtorno do Espectro Autista (TEA)",
    "deficiencia_fisica": "Deficiência física",
    "altas_habilidades": "Altas habilidades/Superdotação",
    "outra_condicao": "Outra condição informada",
    "fonoaudiologo": "Fonoaudiólogo",
    "psicologo": "Psicólogo",
    "fisioterapeuta": "Fisioterapeuta",
    "psicopedagogo": "Psicopedagogo",
    "area_medica": "Área médica",
    "outro": "Outro",
    "2_vezes": "2 vezes por semana",
    "3_vezes": "3 vezes por semana",
    "outra": "Outra",
    "1_hora": "1 hora",
    "1h30": "1 hora e 30 minutos",
    "individual": "Atendimento individual",
    "grupo": "Atendimento em grupo",
    "sala_comum": "Atendimento na sala comum com a turma",
}


def instrument_field_label(field_name: str) -> str:
    direct_label = FIELD_LABELS.get(field_name)
    if direct_label:
        return direct_label

    for suffix, suffix_label in (
        ("_strengths", "habilidades observadas"),
        ("_difficulties", "dificuldades observadas"),
    ):
        if field_name.endswith(suffix):
            prefix = field_name.removesuffix(suffix)
            profile_label = PROFILE_LABELS.get(prefix)
            if profile_label:
                return f"{profile_label} - {suffix_label}"

    return field_name.replace("_", " ").capitalize()


def format_answer(value) -> str:
    if isinstance(value, list):
        return ", ".join(ANSWER_LABELS.get(str(item), str(item)) for item in value)
    return ANSWER_LABELS.get(str(value), str(value))


def has_meaningful_answers(data: dict | None) -> bool:
    if not data:
        return False
    return any(
        bool(value) if isinstance(value, list) else bool(str(value).strip())
        for value in data.values()
        if value is not None
    )


def latest_instruments_by_type(assessments: Iterable) -> dict[str, object]:
    latest = {}
    for assessment in assessments:
        if assessment.assessment_type in REQUIRED_INSTRUMENT_TYPES:
            latest.setdefault(assessment.assessment_type, assessment)
    return latest


def missing_required_instruments(assessments: Iterable) -> list[str]:
    latest = latest_instruments_by_type(assessments)
    return [item for item in REQUIRED_INSTRUMENT_TYPES if item not in latest]


def format_instrument(assessment) -> str:
    data = assessment.assessment_data or {}
    answers = [
        f"  - {instrument_field_label(field_name)}: {format_answer(value)}"
        for field_name, value in data.items()
        if value is not None and (value if isinstance(value, list) else str(value).strip())
    ]
    professional = assessment.psychologist.name if assessment.psychologist else "Não identificado"
    return "\n".join(
        [
            f"Instrumental: {INSTRUMENT_TYPE_LABELS.get(assessment.assessment_type, assessment.assessment_type)}",
            f"Data do registro: {assessment.created_at.strftime('%d/%m/%Y')}",
            f"Profissional responsável: {professional}",
            *answers,
        ]
    )
