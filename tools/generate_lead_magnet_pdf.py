from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Flowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "the-high-performing-womans-body-recomposition-blueprint.pdf"

OBSIDIAN = colors.HexColor("#111111")
CARBON = colors.HexColor("#1C1C1A")
BONE = colors.HexColor("#F6F2EB")
STONE = colors.HexColor("#E7E0D6")
SAND = colors.HexColor("#C9B8A3")
COPPER = colors.HexColor("#B46C45")
OLIVE = colors.HexColor("#303229")


class Rule(Flowable):
    def __init__(self, color=COPPER, width=1.0):
        super().__init__()
        self.color = color
        self.width = width
        self.height = 8

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.width)
        self.canv.line(0, 4, self.width_available, 4)

    def wrap(self, availWidth, availHeight):
        self.width_available = availWidth
        return availWidth, self.height


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(OLIVE)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(0.72 * inch, 0.45 * inch, "Clinical Physiques")
    canvas.drawRightString(7.78 * inch, 0.45 * inch, f"{doc.page}")
    canvas.restoreState()


def para(text, style):
    return Paragraph(text, style)


def build_pdf():
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName="Times-Bold",
        fontSize=38,
        leading=40,
        textColor=OBSIDIAN,
        alignment=0,
        spaceAfter=18,
    )
    h1 = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontName="Times-Bold",
        fontSize=26,
        leading=29,
        textColor=OBSIDIAN,
        spaceBefore=6,
        spaceAfter=14,
    )
    h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontName="Times-Bold",
        fontSize=18,
        leading=22,
        textColor=OLIVE,
        spaceBefore=14,
        spaceAfter=8,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=16,
        textColor=CARBON,
        spaceAfter=8,
    )
    small = ParagraphStyle(
        "Small",
        parent=body,
        fontSize=8.5,
        leading=12,
        textColor=OLIVE,
    )
    eyebrow = ParagraphStyle(
        "Eyebrow",
        parent=body,
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=COPPER,
        spaceAfter=10,
    )
    callout = ParagraphStyle(
        "Callout",
        parent=body,
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=16,
        textColor=OBSIDIAN,
    )

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=letter,
        rightMargin=0.72 * inch,
        leftMargin=0.72 * inch,
        topMargin=0.72 * inch,
        bottomMargin=0.72 * inch,
        title="The High-Performing Woman's Body Recomposition Blueprint",
        author="Clinical Physiques",
    )

    story = [
        para("CLINICAL PHYSIQUES", eyebrow),
        para("The High-Performing Woman's Body Recomposition Blueprint", title),
        para(
            "A 15-minute framework for ambitious women who already know the basics, but need a system that survives real life.",
            callout,
        ),
        Spacer(1, 0.18 * inch),
        Rule(),
        Spacer(1, 0.22 * inch),
        para("You Already Know What To Do. So Why Do You Keep Starting Over?", h1),
        para(
            "If information was the problem, you would already have the body you want. You know protein matters. You know training consistency matters. You know sleep and recovery matter. The real issue is usually not knowledge. It is implementation under pressure.",
            body,
        ),
        para(
            "This guide will help you identify the gap between what you know and what you are consistently doing, then build a practical minimum standard you can keep when work, family, travel, stress, and life get inconvenient.",
            body,
        ),
        Spacer(1, 0.15 * inch),
        para("Use this guide with honesty, not judgement.", callout),
        para(
            "The goal is not to create a perfect week. The goal is to build evidence that you are the kind of woman who follows through.",
            body,
        ),
        PageBreak(),
        para("01", eyebrow),
        para("The Four Pillars Of Body Recomposition", h1),
        para(
            "Body recomposition is not one behaviour. It is the alignment of training, nutrition, recovery, and identity. When one pillar is ignored, progress becomes inconsistent.",
            body,
        ),
    ]

    pillar_rows = [
        ["Pillar", "Minimum standard to review this week"],
        ["Training", "Complete the planned sessions and record performance with intent."],
        ["Nutrition", "Hit protein, manage energy intake, and plan the meals that usually fall apart."],
        ["Recovery", "Protect sleep, steps, hydration, digestion, and stress management basics."],
        ["Identity", "Act like the woman who keeps standards before she feels motivated."],
    ]
    table = Table(pillar_rows, colWidths=[1.45 * inch, 4.85 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), OLIVE),
                ("TEXTCOLOR", (0, 0), (-1, 0), BONE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.6, STONE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story += [
        table,
        Spacer(1, 0.22 * inch),
        para("02", eyebrow),
        para("The Minimum Standards Framework", h1),
        para(
            "Motivation is a bonus, not the system. Your minimum standards are the behaviours you can execute even when the week is not ideal.",
            body,
        ),
        para("Choose one minimum standard for each area:", h2),
        para("Training: What is the smallest version of consistency you will not negotiate?", body),
        para("Nutrition: What are the two food decisions that make the biggest difference for you?", body),
        para("Recovery: What protects tomorrow's decision-making?", body),
        para("Environment: What needs to be prepared before the week gets busy?", body),
        PageBreak(),
        para("03", eyebrow),
        para("The Weekly Review Process", h1),
        para(
            "High-performing women often review progress emotionally: the scale is up, the week was busy, confidence drops, and the plan gets rewritten. A better review separates data from emotion.",
            body,
        ),
        para("Review these five questions each week:", h2),
        para("1. What did I say I would do?", body),
        para("2. What did I actually do?", body),
        para("3. What result or feedback did that create?", body),
        para("4. What was the real bottleneck?", body),
        para("5. What is the smallest adjustment that improves next week?", body),
        Spacer(1, 0.18 * inch),
        para("04", eyebrow),
        para("The Self-Trust Framework", h1),
        para(
            "Confidence is built through evidence, not positive thinking. Every time you keep a standard when life is inconvenient, you build proof that you can rely on yourself.",
            body,
        ),
        para(
            "Start tracking kept promises. Not perfect days. Kept promises. That is the evidence your identity needs.",
            body,
        ),
        Spacer(1, 0.18 * inch),
        para("05", eyebrow),
        para("The Real Goal", h1),
        para(
            "The real goal is not only a leaner body. It is becoming the woman who follows through on her word while still living a full, ambitious life.",
            body,
        ),
        para(
            "Data first. Emotion second. Build a body that lasts.",
            callout,
        ),
        Spacer(1, 0.25 * inch),
        Rule(SAND),
        Spacer(1, 0.15 * inch),
        para(
            "Next step: choose one minimum standard you can keep this week and review it seven days from now.",
            small,
        ),
    ]

    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT)
