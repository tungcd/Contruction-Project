# AI Construction Copilot
## Context for Claude — Requirement Feature Review and Co-authoring

> **Purpose of this document**
>
> This file gives Claude enough context to continue participating as an independent reviewer and co-author of the **Requirement feature** without needing to reconstruct the project history from scratch.
>
> Claude is not only reviewing a single Markdown template. Claude is participating in the architectural design of the complete feature and its contracts with downstream modules.

---

# 1. Project Overview

We are building an AI-first product for residential construction and concept design.

The product is intended initially for:

- small and medium residential contractors
- architects and residential design teams
- contractors handling presales, requirement collection, rough estimation, and proposal preparation
- Vietnamese users working mainly with houses, townhouses, villas, and residential interior projects

The product is **not** intended to become a full ERP in the MVP stage.

The MVP should not include:

- accounting
- inventory
- HR
- construction-site management
- procurement management
- enterprise-wide project operations

The product should focus first on the pre-contract workflow:

```text
Customer inquiry
→ Requirement collection
→ Clarification
→ Concept generation
→ Rough estimation
→ Draft BOQ / quotation
→ Proposal
→ Negotiation
→ Contract
```

---

# 2. Founder Context

The founder is currently a solo developer and still has a full-time software job.

Important constraints:

- The system must be realistic for one person to build.
- We cannot depend on a large annotation team or extensive architect interviews before creating the MVP.
- AI will be used heavily for research, knowledge structuring, drafting, review, and prototyping.
- Real architects and contractors will be involved later to validate a working demonstration.
- The founder is the final decision-maker.
- ChatGPT and Claude act as independent senior collaborators.

The expected collaboration model is:

```text
Founder
↔ ChatGPT
↔ Claude
```

No AI has final authority.

---

# 3. Collaboration Roles

## Founder

Responsible for:

- product vision
- business priorities
- MVP scope
- trade-off decisions
- final approval

## ChatGPT

Primary focus:

- system architecture
- product planning
- pipeline design
- module boundaries
- data contracts
- specifications
- long-term consistency

## Claude

Primary focus:

- independent architectural review
- domain review
- blind-spot detection
- edge cases
- hidden assumptions
- document consistency
- scalability risks
- alternative proposals
- co-authoring improvements when useful

Claude should not agree merely for politeness.

Claude should challenge the design when there is a concrete reason.

---

# 4. Language Convention

This convention is now explicit and must be respected.

## AI-to-AI communication

ChatGPT and Claude may communicate in **English** because:

- architectural terminology is clearer
- prompts are usually more precise
- technical references are primarily English
- translation ambiguity is reduced

## Project outputs

All project artifacts must be written in **Vietnamese**, because the project may later include:

- Vietnamese architects
- quantity surveyors
- business analysts
- developers
- testers
- contractors
- domain consultants

Project artifacts include:

- specifications
- requirement documents
- checklists
- decision logs
- acceptance criteria
- business rules
- knowledge base documents
- generated customer-facing outputs

Technical module names may remain in English, for example:

- Requirement
- Constraint Set
- Design Intent Graph
- Geometry
- Descriptor
- Prompt Compiler

However, their explanations and all business-facing content must be in Vietnamese.

When Claude proposes actual text that should be inserted into a project document, that proposed text must be written in Vietnamese.

---

# 5. Current Product Architecture

The current conceptual pipeline is:

```text
Conversation
→ AI Interview
→ Requirement
→ Constraint Set
→ Design Intent Graph
→ Geometry
→ Descriptor
→ Prompt Compiler
→ Exterior Image
→ Interior Image (later)
→ Concept Package
```

The responsibilities of the stages are currently understood as follows.

## Conversation

Raw customer interaction.

May include:

- free-form language
- incomplete information
- contradictory statements
- images
- references
- uncertain preferences

## AI Interview

AI performs:

- requirement extraction
- clarification
- follow-up questioning
- contradiction detection
- unknown identification
- explicit assumption management

## Requirement

Represents the customer's known needs, facts, preferences, exclusions, unknowns, and accepted assumptions.

Requirement must not contain architectural solutions that have not been explicitly requested by the customer.

## Constraint Set

A normalized machine-readable representation of constraints.

The Constraint Set Compiler is intended to be deterministic.

## Design Intent Graph

Represents architectural intent and relationships, including:

- zoning
- privacy
- circulation
- adjacency
- functional relationships
- hierarchy of spaces
- daylight and ventilation intent

## Geometry

Represents physical and spatial geometry.

## Descriptor

Converts technical design information into architectural language suitable for image generation and downstream communication.

## Prompt Compiler

Produces model-specific prompts from the Descriptor and other structured data.

---

# 6. Current Sprint Plan

The current roadmap is:

## Sprint 0 — Define the standard

Goal:

- define pipeline responsibilities
- define data contracts
- define representative cases
- define acceptance criteria
- define project vocabulary
- define initial knowledge base structure

Sprint 0 is not intended to build a full production product.

## Sprint 1 — Requirement → Constraint Set

Goal:

- conversational requirement collection
- structured Requirement output
- deterministic Constraint Set compilation

## Sprint 2 — Constraint Set → Design Intent Graph

## Sprint 3 — Design Intent Graph → Geometry

## Sprint 4 — Geometry → Exterior Image

## Sprint 5 — Concept Package MVP

## Sprint 6 — Feedback Loop

The immediate focus is still the **Requirement feature**.

---

# 7. Knowledge Strategy

We are not planning to start by collecting a large number of project briefs.

Instead:

```text
Internet sources
→ AI-assisted research
→ Knowledge draft
→ Founder review
→ Knowledge Base
→ Later domain validation
```

Knowledge confidence levels may include:

- Verified
- AI Consensus
- Hypothesis

Representative initial cases:

- townhouse
- villa
- apartment

However, the first fully completed pipeline should focus on a **new residential townhouse / house project**.

Renovation, apartment, and interior-only projects may be added later.

---

# 8. Requirement Feature — Intended Responsibility

The Requirement feature should answer:

1. Who is the customer?
2. What type of project do they want?
3. What is known about the site or existing property?
4. What functions and spaces do they want?
5. What do they explicitly not want?
6. What hard constraints exist?
7. What priorities and trade-offs matter?
8. What information is unknown?
9. What assumptions have been accepted?
10. Which questions remain unresolved?

Requirement must capture customer intent without prematurely designing the building.

---

# 9. Important Boundary

Requirement may include:

- facts stated by the customer
- preferences stated by the customer
- explicit exclusions
- project scope
- budget information
- schedule expectations
- site facts
- household information
- desired spaces
- preferred style
- preferred roof type, when explicitly stated
- unknown information
- assumptions
- evidence and confidence metadata

Requirement must not invent:

- room dimensions
- detailed room areas
- layout solutions
- room adjacency decisions
- staircase geometry
- structural solutions
- facade composition
- architectural decisions not requested by the customer

Those belong to later stages.

---

# 10. Requirement Is Not a Questionnaire

The Requirement artifact is not the raw form completed by the customer.

The intended workflow is:

```text
Customer conversation
→ AI asks follow-up questions
→ AI produces structured Requirement
→ Human reviews or confirms
```

The customer may interact naturally instead of filling a long traditional form.

The Requirement is a normalized result of the interview process.

---

# 11. Critical Architectural Decision Identified During Claude Review

Claude identified an important contradiction in Requirement Template v1.

The pipeline previously implied:

```text
Requirement.md
→ Deterministic Constraint Set Compiler
```

However, a free-form Markdown document cannot be parsed reliably by deterministic code.

Therefore, the likely architecture should become:

```text
Conversation
→ AI Interview
→ Requirement JSON
    ├→ Requirement.md
    └→ Constraint Set Compiler
```

Proposed interpretation:

- `Requirement JSON` is the machine-readable source of truth.
- `Requirement.md` is a human-readable rendering.
- The Constraint Set Compiler reads the structured Requirement data.
- The Markdown file is not parsed as the canonical input.

This decision is strongly supported but has not yet been formally frozen in a Decision Log.

Claude should review whether this architecture is correct and whether any important alternative is being overlooked.

---

# 12. Requirement Template v1

The first draft contained these sections:

1. Project Overview
2. Chủ đầu tư / Gia đình
3. Khu đất
4. Mục tiêu xây dựng
5. Công năng mong muốn
6. Phong cách
7. Hard Constraints
8. Soft Priorities
9. Unknown Information
10. Assumptions
11. Confidence
12. Open Questions

It also explicitly stated that Requirement should not include:

- diện tích từng phòng
- bố trí mặt bằng
- quan hệ các phòng
- kích thước cầu thang
- giải pháp kiến trúc

---

# 13. Summary of Claude's First Review

Claude identified the following major issues.

## Critical Issue C1 — Source of Truth Ambiguity

It was unclear whether Requirement.md was:

- the real machine input, or
- only a human-readable view

Claude recommended that structured Requirement data should be the real input.

## Critical Issue C2 — Missing Construction Scope

The Requirement lacked explicit scope such as:

- chỉ thiết kế
- khoán nhân công
- xây thô
- hoàn thiện
- trọn gói
- trọn gói kèm nội thất
- chỉ nội thất

This is considered valid Requirement information.

## Critical Issue C3 — Missing Controlled Roof Preference

The Requirement lacked an explicit place for roof preference.

Current interpretation:

- Roof type should be optional.
- It becomes a Requirement only if the customer explicitly states it.
- If not stated, roof type may remain unknown or be decided downstream.
- It should not be silently assumed as a customer requirement.

## Critical Issue C4 — Positive vs Negative Requirements

The template did not distinguish:

- customer explicitly wants a garage
- customer explicitly does not want a garage
- customer never mentioned a garage

This distinction is essential.

A likely representation is tri-state:

```text
required
excluded
unspecified
```

This must be preserved from Requirement into downstream constraints.

## Important Suggestion I1 — Repeated Metadata

The sections:

- Hard Constraints
- Unknown Information
- Confidence

may repeat data already present in earlier sections.

Claude suggested either:

- attach metadata directly to each field, or
- store references instead of duplicating values

This issue remains open.

## Important Suggestion I2 — Unknown vs Open Question

The boundary between unknown information and open questions was unclear.

Possible distinction:

- Unknown = missing fact
- Open Question = actionable question required to resolve that fact

However, they may be different views of the same underlying object.

## Important Suggestion I3 — Reference Images

Reference images are valid Requirement inputs for style and preference.

However, Requirement should not infer layout solutions from those images.

## Important Suggestion I4 — Location Granularity

A single free-text location may be insufficient.

Possible structured fields:

- tỉnh / thành phố
- quận / huyện
- phường / xã
- địa chỉ chi tiết

## Important Suggestion I5 — Household Structure

A free-form household table is human-readable but may be inconsistent for machine processing.

Possible structured representation should support:

- total people
- adults
- children
- elderly people
- people with accessibility needs
- household members and relationships

## Nice-to-Have N3 — MVP Scope

The v1 template is oriented toward new-build houses.

It does not yet fully support:

- renovations
- apartment projects
- interior-only projects

This may be acceptable if explicitly documented as an MVP boundary.

---

# 14. ChatGPT's Initial Response to Claude's Review

The initial assessment was:

## Accepted

- C1 — Structured Requirement source of truth
- C2 — Construction Scope
- C4 — Explicit inclusion / exclusion / unspecified state
- I2 — Clarify Unknown vs Open Question
- I3 — Limit interpretation of reference images
- I4 — Structured location
- N3 — Explicitly document MVP scope

## Partially Accepted

- C3 — Roof type should be optional and only recorded as Requirement when explicitly stated

## Not Yet Accepted

- I1 — Moving all metadata directly into each human-readable field

Reason:

- Requirement.md should remain readable for humans
- structured metadata can exist in Requirement JSON
- the Markdown rendering does not need to expose all normalization details

This may lead to a two-layer representation:

```text
Requirement JSON = normalized machine model
Requirement.md = readable business document
```

## Open

- Best representation of household information
- Exact relationship between Unknown, Assumption, Confidence, and Open Question
- Whether evidence / source references should be stored per field
- Exact schema of Requirement JSON
- Whether Markdown is generated automatically from JSON
- Versioning and confirmation workflow

---

# 15. Working Principles for the Requirement Data Model

Claude should evaluate these proposed principles.

## Principle 1 — One canonical structured source

There should be exactly one canonical machine-readable Requirement representation.

## Principle 2 — Human views are generated

Markdown, UI summaries, and proposal text should be renderings from the canonical data.

## Principle 3 — No silent guessing

Unknown information must remain unknown unless:

- the customer provides it, or
- an explicit assumption is created and accepted

## Principle 4 — Explicit negative intent

Explicit exclusions must be represented separately from omitted information.

## Principle 5 — Provenance matters

Important values may need to store:

- source
- speaker
- conversation message
- timestamp
- confidence
- confirmation status

The MVP may implement only part of this, but the data model should not block it.

## Principle 6 — Requirement is not design

The system must not convert preferences into architectural decisions too early.

## Principle 7 — Deterministic downstream compiler

The Constraint Set Compiler should not need to interpret free-form prose.

## Principle 8 — Progressive completion

A Requirement may remain incomplete.

The model should support:

- draft
- needs clarification
- ready for confirmation
- confirmed
- superseded

## Principle 9 — Vietnamese project output

All generated business documents and official specifications must be Vietnamese.

---

# 16. Questions Claude Should Review Now

Claude is asked to participate as a reviewer and co-author of the Requirement feature, not merely the Markdown template.

Please review the following.

## A. Canonical architecture

Is this correct?

```text
Conversation
→ AI Interview
→ Requirement JSON
    ├→ Requirement.md
    └→ Deterministic Constraint Set Compiler
```

Identify any hidden coupling or missing stage.

For example, should there be:

- Requirement Draft
- Requirement Validation
- Human Confirmation
- Requirement Snapshot

before the Constraint Set Compiler?

## B. Requirement data model boundaries

Which data belongs in Requirement?

Which data belongs in:

- interview state
- validation result
- Constraint Set
- Design Intent Graph
- project metadata

## C. Tri-state and exclusion model

Is this sufficient?

```text
required
excluded
unspecified
```

Or do we also need:

- preferred
- optional
- undecided
- not_applicable

Please propose a model that remains understandable and does not become over-engineered.

## D. Unknown / Assumption / Open Question / Confidence

Define precise meanings and relationships for:

- unknown
- assumption
- open question
- confidence
- confirmation status

Avoid duplicate sources of truth.

## E. Human-readable Requirement.md

What should the Markdown document show?

What machine metadata should remain hidden?

How should it remain readable for contractors and architects?

## F. Construction Scope

Propose a scalable but MVP-friendly model for project scope.

Consider:

- thiết kế
- xây thô
- hoàn thiện
- trọn gói
- nội thất
- cải tạo

Do not assume all categories are mutually exclusive.

## G. Household and user needs

Propose a model that supports:

- normal family composition
- elderly people
- children
- accessibility needs
- future family changes
- domestic staff
- guests

Keep it suitable for an MVP.

## H. Reference images and attachments

How should Requirement store:

- image references
- what the customer likes
- what the customer dislikes
- confidence in interpretation
- restrictions against inferring layout

## I. MVP boundary

Should Requirement v1 explicitly support only:

- new-build townhouse
- new-build detached house / villa

Or should the schema be generalized immediately for:

- apartments
- renovations
- interior-only projects

Recommend the lowest-risk approach for a solo founder.

## J. Versioning and confirmation

Do we need fields such as:

- version
- status
- createdAt
- updatedAt
- confirmedAt
- confirmedBy
- supersedesVersion

Which are necessary in Sprint 0, and which should be deferred?

---

# 17. Requested Output Format

Claude may write the review in English.

However:

- all proposed project document text must be Vietnamese
- all suggested field labels for Requirement.md must be Vietnamese
- technical schema keys may remain English if justified

Please return the response in this structure:

## 1. Executive Assessment

Briefly state whether the current direction is sound.

## 2. Critical Architecture Decisions

For each decision:

- Issue
- Recommendation
- Reason
- Risk if ignored

## 3. Proposed Requirement Feature Model

Describe the components and boundaries.

Do not write a complete final schema yet unless necessary.

## 4. Resolution of Open Questions

Cover sections A–J above.

## 5. Proposed Decision Log Entries

For each entry:

```text
Decision ID
Title
Status: Accept / Reject / Defer / Needs Discussion
Decision
Reason
Consequences
```

The proposed decision content itself should be in Vietnamese because it may be copied into the project Decision Log.

## 6. Changes Recommended for Requirement Template v2

Provide a precise change list.

Do not rewrite the entire template unless the existing structure is fundamentally unsalvageable.

## 7. Risks and Deferred Topics

Separate:

- MVP risks
- future scalability risks
- issues that should deliberately be postponed

## 8. Final Recommendation

State what the team should do next before drafting Requirement Template v2.

---

# 18. Review Behavior

Please follow these rules:

- Do not agree merely because ChatGPT proposed something.
- Do not redesign the entire product unnecessarily.
- Prioritize a realistic solo-founder MVP.
- Identify over-engineering explicitly.
- Identify hidden future migration costs explicitly.
- Preserve deterministic boundaries where appropriate.
- Preserve Requirement as customer intent, not architectural solution.
- Treat the existing pipeline as a strong draft, not an untouchable decision.
- Explain disagreements clearly.
- Make proposals actionable.
