from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum
from pydantic import BaseModel,ConfigDict


# =====================================
# BASE
# =====================================

class SchoolEnvironment(str, Enum):
    CLASSROOM = "Sala de aula"
    RESOURCE_ROOM = "Sala de recursos"
    COURTYARD = "Pátio"
    CAFETERIA = "Refeitório"
    LIBRARY = "Biblioteca"
    SPORTS_COURT = "Quadra"
    HALLWAY = "Corredor"
    BATHROOM = "Banheiro"
    SCHOOL_ENTRANCE = "Entrada da escola"
    SCHOOL_EXIT = "Saída da escola"
    SCHOOL_TRANSPORT = "Transporte escolar"
    INDIVIDUAL_SERVICE = "Atendimento individual"
    EXTERNAL_ACTIVITY = "Atividade externa"
    OTHER = "Outro"


class BehaviorRecordBase(BaseModel):

    antecedent: str
    behavior: str
    consequence: str

    strategy_used: str | None = None
    strategy_effective: bool | None = None

    environment: SchoolEnvironment | None = None
    people_present: str | None = None

    intensity: int | None = Field(default=None, ge=1, le=10)
    duration_minutes: int | None = Field(default=None, ge=0)

    function_hypothesis: str | None = None

    observations: str | None = None


# =====================================
# CREATE
# =====================================

class BehaviorRecordCreate(
    BehaviorRecordBase
):
    pass


# =====================================
# UPDATE
# =====================================

class BehaviorRecordUpdate(
    BaseModel
):

    antecedent: str | None = None
    behavior: str | None = None
    consequence: str | None = None

    strategy_used: str | None = None
    strategy_effective: bool | None = None

    environment: str | None = None
    people_present: str | None = None

    intensity: int | None = Field(default=None, ge=1, le=10)
    duration_minutes: int | None = Field(default=None, ge=0)

    function_hypothesis: str | None = None

    observations: str | None = None


# =====================================
# RESPONSE
# =====================================

class BehaviorRecordResponse(
    BehaviorRecordBase
):
    model_config = ConfigDict(from_attributes=True)
    id: int
    student_id: int
    created_at: datetime


from enum import Enum
