from pathlib import Path
from html import escape

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer
)

from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle
)
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from config import settings
from services.storage_service import delete_report, read_report, store_report


def generate_case_study_pdf(

    student_name: str,

    report_content: str,

    task_id: str
):

    # =====================================
    # CREATE DIRECTORY
    # =====================================

    reports_directory = Path(settings.reports_directory)
    reports_directory.mkdir(parents=True, exist_ok=True)

    # =====================================
    # FILE PATH
    # =====================================

    pdf_path = str(reports_directory / f"{task_id}.pdf")

    # =====================================
    # PDF CONFIG
    # =====================================

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=54,
        leftMargin=54,
        topMargin=64,
        bottomMargin=54,
        title=f"Estudo de caso - {student_name}",
        author="IncluseON"
    )

    styles = getSampleStyleSheet()

    elements = []

    # =====================================
    # TITLE
    # =====================================

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        textColor=colors.HexColor("#172554"),
        fontSize=20,
        leading=26,
        alignment=TA_CENTER,
        spaceAfter=10
    )
    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["BodyText"],
        textColor=colors.HexColor("#27272a"),
        fontSize=10.5,
        leading=16,
        spaceAfter=8
    )

    title = Paragraph(
        f"Estudo de Caso<br/><font size='12'>Aluno: {escape(student_name)}</font>",
        title_style
    )

    elements.append(title)

    elements.append(
        Spacer(1, 20)
    )

    # =====================================
    # REPORT CONTENT
    # =====================================

    paragraphs = report_content.split("\n\n")

    for paragraph in paragraphs:
        safe_content = escape(paragraph).replace("\n", "<br/>")
        elements.append(Paragraph(safe_content or " ", body_style))

    # =====================================
    # BUILD PDF
    # =====================================

    doc.build(elements, onFirstPage=_draw_page, onLaterPages=_draw_page)

    stored_reference = store_report(Path(pdf_path))
    if settings.storage_backend != "local":
        Path(pdf_path).unlink(missing_ok=True)
    return stored_reference


def _draw_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#dbeafe"))
    canvas.line(54, 38, A4[0] - 54, 38)
    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.setFont("Helvetica", 8)
    canvas.drawString(54, 24, "IncluseON - Documento de apoio profissional")
    canvas.drawRightString(A4[0] - 54, 24, f"Página {doc.page}")
    canvas.restoreState()


def resolve_generated_report_path(
    pdf_path: str,
    reports_directory: Path | None = None
) -> Path | None:
    reports_root = (
        reports_directory or Path(settings.reports_directory)
    ).resolve()
    candidate = Path(pdf_path)

    if not candidate.is_absolute():
        candidate = Path.cwd() / candidate

    candidate = candidate.resolve()

    if not candidate.is_relative_to(reports_root):
        return None

    if candidate.suffix.lower() != ".pdf":
        return None

    return candidate


def delete_generated_report(
    pdf_path: str,
    reports_directory: Path | None = None
) -> bool:
    if reports_directory is not None:
        candidate = resolve_generated_report_path(pdf_path, reports_directory)
        if candidate is None:
            return False
        try:
            candidate.unlink(missing_ok=True)
        except OSError:
            return False
        return True
    return delete_report(pdf_path)


def read_generated_report(pdf_path: str) -> bytes | None:
    return read_report(pdf_path)
