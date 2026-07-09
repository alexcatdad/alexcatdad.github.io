#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "alex-alexandrescu-vue-frontend-cv.pdf"
RESUME = ROOT / "src" / "content" / "resume" / "alex.json"

PAGE_W, PAGE_H = A4

INK = colors.HexColor("#17202A")
MUTED = colors.HexColor("#5D6673")
LIGHT = colors.HexColor("#E6EAF0")
PANEL = colors.HexColor("#F4F7F8")
VUE = colors.HexColor("#42B883")
VUE_DARK = colors.HexColor("#35495E")
WHITE = colors.white

LEFT = 48
RIGHT = 42
TOP = 42
BOTTOM = 40
RAIL_X = 28


@dataclass(frozen=True)
class TextStyle:
    font: str
    size: float
    leading: float
    color: colors.Color = INK


H1 = TextStyle("Helvetica-Bold", 20, 24, INK)
H2 = TextStyle("Helvetica-Bold", 9.5, 12, INK)
H3 = TextStyle("Helvetica-Bold", 8.7, 10.5, INK)
BODY = TextStyle("Helvetica", 8.3, 10.3, INK)
SMALL = TextStyle("Helvetica", 7.2, 9, MUTED)
CAPTION = TextStyle("Helvetica-Bold", 6.6, 8, VUE_DARK)


def clean(text: str) -> str:
    replacements = {
        "\u2013": "-",
        "\u2014": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u00a0": " ",
        "\u2022": "-",
        "\u2192": "->",
        "\u00d7": "x",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return re.sub(r"\s+", " ", text).strip()


def wrap(text: str, width: float, font: str, size: float) -> list[str]:
    words = clean(text).split()
    lines: list[str] = []
    line = ""
    for word in words:
        trial = word if not line else f"{line} {word}"
        if stringWidth(trial, font, size) <= width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def draw_text(c: canvas.Canvas, text: str, x: float, y: float, style: TextStyle) -> float:
    c.setFont(style.font, style.size)
    c.setFillColor(style.color)
    c.drawString(x, y, clean(text))
    return y - style.leading


def draw_wrapped(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    width: float,
    style: TextStyle = BODY,
    max_lines: int | None = None,
) -> float:
    lines = wrap(text, width, style.font, style.size)
    if max_lines is not None:
        lines = lines[:max_lines]
    c.setFont(style.font, style.size)
    c.setFillColor(style.color)
    for line in lines:
        c.drawString(x, y, line)
        y -= style.leading
    return y


def draw_rule(c: canvas.Canvas, x: float, y: float, w: float, color: colors.Color = LIGHT) -> None:
    c.setStrokeColor(color)
    c.setLineWidth(0.6)
    c.line(x, y, x + w, y)


def draw_section(c: canvas.Canvas, title: str, x: float, y: float, w: float) -> float:
    c.setFont("Helvetica-Bold", 8.2)
    c.setFillColor(VUE_DARK)
    c.drawString(x, y, clean(title.upper()))
    draw_rule(c, x, y - 3.4, w)
    return y - 15


def draw_bullets(
    c: canvas.Canvas,
    bullets: Sequence[str],
    x: float,
    y: float,
    width: float,
    style: TextStyle = BODY,
    gap: float = 2.4,
) -> float:
    for bullet in bullets:
        c.setFillColor(VUE_DARK)
        c.circle(x + 1.5, y + 2.4, 1.2, stroke=0, fill=1)
        y = draw_wrapped(c, bullet, x + 8, y, width - 8, style)
        y -= gap
    return y


def draw_chip(c: canvas.Canvas, label: str, x: float, y: float) -> tuple[float, float]:
    label = clean(label)
    w = stringWidth(label, "Helvetica", 7.2) + 10
    h = 13
    c.setFillColor(WHITE)
    c.setStrokeColor(colors.HexColor("#D2D9E2"))
    c.roundRect(x, y - h + 2, w, h, 5, stroke=1, fill=1)
    c.setFillColor(INK)
    c.setFont("Helvetica", 7.2)
    c.drawString(x + 5, y - 8, label)
    return w, h


def draw_chips(c: canvas.Canvas, labels: Iterable[str], x: float, y: float, width: float) -> float:
    cx = x
    cy = y
    for label in labels:
        chip_w = stringWidth(clean(label), "Helvetica", 7.2) + 10
        if cx + chip_w > x + width:
            cx = x
            cy -= 16
        draw_chip(c, label, cx, cy)
        cx += chip_w + 5
    return cy - 17


def draw_header(c: canvas.Canvas, data: dict, page: int, title: str) -> None:
    basics = data["basics"]
    c.setFillColor(VUE)
    c.rect(RAIL_X, BOTTOM, 4, PAGE_H - BOTTOM - 22, stroke=0, fill=1)
    c.setFillColor(WHITE)
    for y in [PAGE_H - 112, PAGE_H - 276, PAGE_H - 440]:
        c.circle(RAIL_X + 2, y, 2.6, stroke=0, fill=1)

    if page == 1:
        y = PAGE_H - TOP
        draw_text(c, basics["name"], LEFT, y, H1)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(VUE_DARK)
        c.drawString(LEFT, y - 25, title)
        contact = "Bucharest, RO | alex@escu.dev | github.com/alexcatdad | linkedin.com/in/alexalexandrescu"
        c.setFont("Helvetica", 7.3)
        c.setFillColor(MUTED)
        c.drawString(LEFT, y - 39, contact)
        draw_rule(c, LEFT, y - 51, PAGE_W - LEFT - RIGHT, colors.HexColor("#CBD5DF"))
    else:
        y = PAGE_H - 34
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(INK)
        c.drawString(LEFT, y, basics["name"])
        c.setFont("Helvetica", 7)
        c.setFillColor(MUTED)
        c.drawRightString(PAGE_W - RIGHT, y, f"{title} | page {page}")
        draw_rule(c, LEFT, y - 9, PAGE_W - LEFT - RIGHT, colors.HexColor("#CBD5DF"))


def draw_contract_card(c: canvas.Canvas, x: float, y: float, width: float) -> float:
    height = 76
    c.setFillColor(PANEL)
    c.roundRect(x, y - height, width, height, 7, stroke=0, fill=1)
    c.setStrokeColor(colors.HexColor("#D8DEE6"))
    c.setLineWidth(0.6)
    c.roundRect(x, y - height, width, height, 7, stroke=1, fill=0)

    c.setFont("Helvetica-Bold", 7.4)
    c.setFillColor(VUE_DARK)
    c.drawString(x + 10, y - 14, "FRONTEND CONTRACT")

    rows = [
        ("ui", "components, a11y, layout"),
        ("state", "typed data flow"),
        ("quality", "tests, review, CI"),
    ]
    row_y = y - 29
    for key, value in rows:
        c.setFont("Courier-Bold", 6.8)
        c.setFillColor(VUE)
        c.drawString(x + 10, row_y, key)
        c.setFont("Helvetica", 7.2)
        c.setFillColor(INK)
        c.drawString(x + 48, row_y, value)
        row_y -= 14

    return y - height - 12


def draw_job(
    c: canvas.Canvas,
    x: float,
    y: float,
    width: float,
    role: str,
    company: str,
    dates: str,
    summary: str,
    bullets: Sequence[str],
) -> float:
    c.setFont("Helvetica-Bold", 8.8)
    c.setFillColor(INK)
    c.drawString(x, y, clean(role))
    c.setFont("Helvetica", 7.2)
    c.setFillColor(MUTED)
    c.drawRightString(x + width, y, clean(dates))
    y -= 10
    c.setFont("Helvetica-Bold", 7.6)
    c.setFillColor(VUE_DARK)
    c.drawString(x, y, clean(company))
    y -= 9
    y = draw_wrapped(c, summary, x, y, width, SMALL, max_lines=3)
    y -= 3
    y = draw_bullets(c, bullets, x, y, width, SMALL, gap=1.4)
    return y - 5


def draw_project(
    c: canvas.Canvas,
    x: float,
    y: float,
    width: float,
    name: str,
    meta: str,
    body: str,
) -> float:
    c.setFillColor(PANEL)
    c.roundRect(x, y - 44, width, 50, 6, stroke=0, fill=1)
    c.setFont("Helvetica-Bold", 8.4)
    c.setFillColor(INK)
    c.drawString(x + 9, y - 9, clean(name))
    c.setFont("Helvetica-Bold", 6.4)
    c.setFillColor(VUE_DARK)
    c.drawString(x + 9, y - 19, clean(meta.upper()))
    draw_wrapped(c, body, x + 9, y - 30, width - 18, SMALL, max_lines=2)
    return y - 58


def build_pdf() -> None:
    data = json.loads(RESUME.read_text(encoding="utf-8"))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    title = "Frontend Engineer - Vue / TypeScript"
    c = canvas.Canvas(str(OUTPUT), pagesize=A4)
    c.setTitle("Alex Alexandrescu - Vue Frontend CV")
    c.setAuthor("Alex Alexandrescu")

    # Page 1
    draw_header(c, data, 1, title)
    left_x = LEFT
    left_w = 320
    right_x = 392
    right_w = PAGE_W - right_x - RIGHT
    y = PAGE_H - 112

    y = draw_section(c, "Frontend profile", left_x, y, left_w)
    summary = (
        "Frontend-focused engineer with 15+ years shipping production web interfaces across "
        "TypeScript, JavaScript, React, SvelteKit, Astro, Angular and design systems. Practical "
        "focus on component architecture, typed state, accessible UI, product workflows, responsive "
        "layouts and testable delivery."
    )
    y = draw_wrapped(c, summary, left_x, y, left_w, BODY)
    y -= 8
    y = draw_bullets(
        c,
        [
            "Vue 3 / Composition API: component boundaries, reusable UI primitives, typed props and predictable state flow.",
            "Hands-on product UI: workflow editors, review screens, data tables, dashboard surfaces, export/print flows and responsive layouts.",
            "Corporate delivery habits: clear requirements, polished UI states, CI-friendly checks, Playwright coverage and maintainable TypeScript.",
        ],
        left_x,
        y,
        left_w,
    )

    y = draw_section(c, "Selected frontend experience", left_x, y - 3, left_w)
    y = draw_job(
        c,
        left_x,
        y,
        left_w,
        "Full-Stack Developer",
        "Jouncetech - asource",
        "Jan 2026 - Present",
        "TypeScript workflow platform for regulated finance, legal, procurement and compliance operations.",
        [
            "Built across React/React Flow frontend surfaces, Elysia API contracts, PostgreSQL data and Temporal-backed workflow runtime.",
            "Shipped tenant-scoped review flows for document intake, contract checks, notifications and operational auditability.",
            "Improved dev and delivery loops with Bun, Turborepo, managed local stack, Playwright, GitHub Actions and Woodpecker CI.",
        ],
    )
    y = draw_job(
        c,
        left_x,
        y,
        left_w,
        "Software Architect & Engineering Consultant",
        "Conversy",
        "Jan 2023 - Nov 2025",
        "ML platform for speaker identification with full vertical ownership from schema to production UI.",
        [
            "Built the first production frontend for the ML platform with TypeScript, componentized UI and review interfaces.",
            "Designed API contracts, authentication and backend foundations that let frontend workflows stay predictable.",
            "Shipped a human-in-the-loop agent pipeline and review flow for structured AI output.",
        ],
    )
    y = draw_job(
        c,
        left_x,
        y,
        left_w,
        "Senior Software Engineer",
        "RCKT",
        "Nov 2021 - Jul 2022",
        "Contract frontend engagement through Technically Correct for a Berlin agency project.",
        [
            "Rebuilt oetker.com with modern TypeScript frontend architecture, Tailwind CSS and CI/CD delivery.",
            "Worked in a client delivery context with quality gates, brand constraints and production expectations.",
        ],
    )

    side_y = PAGE_H - 112
    side_y = draw_contract_card(c, right_x, side_y + 3, right_w)
    side_y = draw_section(c, "Core stack", right_x, side_y, right_w)
    side_y = draw_chips(
        c,
        [
            "Vue 3",
            "Composition API",
            "TypeScript",
            "JavaScript",
            "Component systems",
            "Accessibility",
            "Tailwind CSS",
            "Design systems",
            "Responsive UI",
            "CSS",
        ],
        right_x,
        side_y,
        right_w,
    )

    side_y = draw_section(c, "Production evidence", right_x, side_y - 4, right_w)
    side_y = draw_bullets(
        c,
        [
            "Public repos show TypeScript-heavy product UI, Astro/Tailwind frontends, Svelte/Convex apps and browser-only tools.",
            "Recent role work includes workflow designers, review screens, data-heavy operational UI and Playwright-backed flows.",
            "Comfortable owning the full path from API contract to polished, testable interface.",
        ],
        right_x,
        side_y,
        right_w,
        SMALL,
        gap=2,
    )

    side_y = draw_section(c, "Quality practices", right_x, side_y - 2, right_w)
    side_y = draw_chips(
        c,
        [
            "Playwright",
            "Biome",
            "GitHub Actions",
            "Woodpecker",
            "Bun",
            "Turborepo",
            "Code review",
            "User-facing copy",
        ],
        right_x,
        side_y,
        right_w,
    )

    side_y = draw_section(c, "Availability", right_x, side_y - 4, right_w)
    side_y = draw_bullets(
        c,
        [
            "Full-time frontend position.",
            "Remote or hybrid across the EEA.",
            "Preference for product teams with clear ownership, maintainable components and quality standards.",
        ],
        right_x,
        side_y,
        right_w,
        SMALL,
        gap=2,
    )

    c.showPage()

    # Page 2
    draw_header(c, data, 2, title)
    y = PAGE_H - 72
    y = draw_section(c, "Additional relevant experience", LEFT, y, PAGE_W - LEFT - RIGHT)
    col_gap = 18
    col_w = (PAGE_W - LEFT - RIGHT - col_gap) / 2
    y1 = y
    y2 = y
    y1 = draw_job(
        c,
        LEFT,
        y1,
        col_w,
        "Technical Lead",
        "MVP Factory",
        "Aug 2017 - May 2019",
        "Built and scaled distributed JavaScript teams for client product delivery.",
        [
            "Led frontend implementation patterns and quality standards across remote product teams.",
            "Balanced direct coding with mentoring, reviews and client-facing technical decisions.",
        ],
    )
    y1 = draw_job(
        c,
        LEFT,
        y1,
        col_w,
        "JavaScript Tech Lead",
        "Stefanini EMEA",
        "Oct 2016 - Aug 2017",
        "Global IT services company with varied outsourcing engagements.",
        [
            "Led JavaScript delivery across multiple codebases and stakeholder contexts.",
            "Kept implementation pragmatic under shifting requirements and legacy constraints.",
        ],
    )
    y2 = draw_job(
        c,
        LEFT + col_w + col_gap,
        y2,
        col_w,
        "Angular 2 Developer",
        "Talkbe",
        "May 2016 - Oct 2016",
        "Pre-LLM conversational AI startup.",
        [
            "Built analytics dashboard UI for chatbot campaign performance.",
            "Worked with early reactive frontend patterns in a startup product environment.",
        ],
    )
    y2 = draw_job(
        c,
        LEFT + col_w + col_gap,
        y2,
        col_w,
        "Rich Media Engineer",
        "Teads Studio",
        "Jul 2014 - May 2016",
        "Ad tech company focused on interactive video and performance-sensitive creative engineering.",
        [
            "Built interactive video, canvas games and dynamic creative units under strict runtime constraints.",
            "Developed strong browser performance instincts and cross-device frontend discipline.",
        ],
    )

    y = min(y1, y2) - 2
    y = draw_section(c, "Selected public projects", LEFT, y, PAGE_W - LEFT - RIGHT)
    y_left = y
    y_right = y
    y_left = draw_project(
        c,
        LEFT,
        y_left,
        col_w,
        "alexcatdad.github.io",
        "Astro, React islands, Tailwind CSS",
        "Personal GitHub Pages site with static build, resume data, role filters, PDF/print paths and cached repo activity.",
    )
    y_left = draw_project(
        c,
        LEFT,
        y_left,
        col_w,
        "frontend-styles-showcase",
        "Astro, Tailwind CSS",
        "A visual-system exercise: 19 styles, 7 pages and 2 languages rendered for one content domain.",
    )
    y_right = draw_project(
        c,
        LEFT + col_w + col_gap,
        y_right,
        col_w,
        "scrouge",
        "TypeScript, SvelteKit, Convex",
        "Subscription tracker with smart notifications, product state and practical recurring-use flows.",
    )
    y_right = draw_project(
        c,
        LEFT + col_w + col_gap,
        y_right,
        col_w,
        "copycat",
        "TypeScript, browser-only document UI",
        "Client-side OCR utility for turning scanned documents into editable DOCX and searchable PDF outputs.",
    )

    y = min(y_left, y_right) - 3
    y = draw_section(c, "Education and languages", LEFT, y, PAGE_W - LEFT - RIGHT)
    c.setFillColor(PANEL)
    c.roundRect(LEFT, y - 92, PAGE_W - LEFT - RIGHT, 100, 6, stroke=0, fill=1)
    box_x = LEFT + 12
    box_y = y - 10
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(INK)
    c.drawString(box_x, box_y, "Education")
    draw_wrapped(c, "Engineer degree track in Computer Science, Titu Maiorescu University. Mathematics and Computer Science high school background.", box_x, box_y - 12, 250, SMALL)
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(INK)
    c.drawString(box_x + 276, box_y, "Languages")
    draw_wrapped(c, "Romanian native. English fluent. Comfortable in remote, async and cross-time-zone teams.", box_x + 276, box_y - 12, 205, SMALL)
    c.setFont("Helvetica-Bold", 8.5)
    c.setFillColor(INK)
    c.drawString(box_x, box_y - 48, "Frontend keywords")
    draw_chips(
        c,
        [
            "Vue",
            "Vue 3",
            "Composition API",
            "TypeScript",
            "Frontend",
            "Components",
            "Accessibility",
            "Playwright",
            "Responsive UI",
            "Design systems",
            "CI/CD",
        ],
        box_x,
        box_y - 60,
        PAGE_W - LEFT - RIGHT - 24,
    )

    c.setFont("Helvetica", 6.7)
    c.setFillColor(MUTED)
    c.drawString(LEFT, BOTTOM - 14, "Contact: alex@escu.dev | github.com/alexcatdad | linkedin.com/in/alexalexandrescu")
    c.save()


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT)
