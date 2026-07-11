# IPAS Centres Operator Dashboard — Design Requirements Descriptor

> **Source:** `Peppard_IPAS_Dashboard_Design_Requirements_Descriptor_v1.0.docx` — extracted verbatim to markdown. This is the canonical requirements reference for the build team.

**PEPPARD INVESTMENTS | INTERNATIONAL PROTECTION ACCOMMODATION SERVICES**

**IPAS Centres Operator Dashboard**

Design Requirements Descriptor for Origin Care Group

Extension of the connects.health governance dashboard to the IPAS accommodation centres operated by Peppard Investments, incorporating Department of Justice, Home Affairs and Migration contractual reporting, HIQA monitoring against the National Standards, and the revised IPAS Centres KPI Framework.

| **Prepared for** | Origin Care Group — connects.health delivery team |
| --- | --- |
| **Prepared by** | Office of the CEO, Genesis Healthcare Ireland, on behalf of Peppard Investments |
| **Version** | 1.0 — Draft for Origin review and estimation |
| **Date** | July 2026 |
| **Classification** | Confidential — Commercial |

## 1 Purpose and Background

Peppard Investments, the parent company of Genesis Healthcare Ireland, operates a number of International Protection Accommodation Services (IPAS) centres under contract to the Department of Justice, Home Affairs and Migration. The Genesis governance dashboard currently being delivered by Origin Care Group on the connects.health platform **[6]** is to be extended to incorporate an IPAS module covering these centres. This descriptor sets out the design requirements for that extension so that Origin can scope, estimate and sequence the build under the existing Framework Services Agreement.

The IPAS module must serve two distinct regulatory audiences simultaneously, and this dual axis is the single most important design constraint. First, the Department of Justice, Home Affairs and Migration inspects each centre under the International Protection Procurement Services (IPPS) contractual regime, and operators must respond to findings, and submit evidence, within tightly defined timeframes; the inspection report for The Riverside Park Hotel of 24 March 2026 **[2]** is the reference template and defines the metrics the dashboard must capture and return. Second, HIQA monitors IPAS centres against the National Standards for accommodation offered to people in the protection process **[3]**, using a four-point compliance judgement. These are related but not interchangeable frameworks: the Department's regime is contractual, granular and physical (rooms, ratios, registers); HIQA's is standards-based and thematic (governance, workforce, safeguarding, rights). The dashboard must let one dataset feed both without double entry.

The draft IPAS Centres KPI Framework of April 2026 **[1]** has been assessed line by line for this descriptor. Its design intent is sound and is retained; a number of individual KPIs have been reworded, consolidated, removed or added, and the rationale for every change is set out in Section 5 so that Origin builds against a single definitive metric set.

| **DESIGN INTENT — RETAINED FROM THE DRAFT FRAMEWORK [1]**<br>Every standard is measurable. Every risk is visible. Every action is evidenced. The IPAS module extends this principle across both regulatory axes: every Department inspection line and every HIQA standard must map to a data field, an owner, and an auditable evidence trail. |
| --- |

## 2 Scope, Users and Reporting Context

### 2.1 Scope

The module covers all IPAS accommodation centres operated by Peppard Investments, with a data model designed to onboard additional centres without structural change. It sits within the existing connects.health architecture and reuses the platform components already built for Genesis (action tracking, audit scheduling, document evidence repository, board reporting), themed and segregated for Peppard. Nursing home and disability services data remain outside this module; group-level users may hold roles in both.

### 2.2 Users and roles

| **ROLE** | **PRIMARY USE** | **ACCESS** |
| --- | --- | --- |
| Centre Manager | Daily operational entry: registers, incidents, maintenance, occupancy, fire records, complaints | Own centre — read/write |
| Internal Auditor | Audit programme delivery, findings, corrective action verification, unannounced audit capture | All centres — read/write (audit) |
| Designated Officers | Safeguarding, data protection and health & safety leads: referrals, notifications, breach log | Functional records — all centres |
| Group Executives | Cross-centre performance, risk exposure, inspection readiness, Department return sign-off | All centres — read; return approval |
| Board of Directors | Quarterly governance report, RAG profile, escalated risks and trends | Dashboard and report outputs — read |

### 2.3 The dual regulatory axis

| **AXIS** | **DEPARTMENT (IPPS CONTRACT)** | **HIQA (NATIONAL STANDARDS)** |
| --- | --- | --- |
| Basis | Contracted provision of International Protection Accommodation Services; IPPS inspection regime [2] | National Standards for accommodation offered to people in the protection process (2019) [3] |
| Instrument | Centre inspection report with section-by-section checks, room-level measurements and RAG summary | Monitoring inspection against 40 standards across ten themes, in two dimensions |
| Judgement | RED / AMBER / GREEN priority per issue; evidence of resolution required, typically within 14 days | Compliant / Substantially Compliant / Partially Compliant / Not Compliant per standard |
| Operator obligation | Corrective action and documentary/photographic evidence returned to the Department within the stated timeframe | Compliance plan responses; continuous inspection readiness; quality improvement |

A material point of accuracy that the dashboard design must respect: IPAS centres are not registered designated centres, and there is **no statutory notification schedule to HIQA** of the kind that applies in nursing homes or disability services. Reporting obligations run to the Department under contract, and to Tusla under Children First.

## 3 Module One — Department of Justice, Home Affairs and Migration Returns

This module digitises the IPPS inspection report structure evidenced in the Riverside Park Hotel report **[2]**, so that the data the Department inspects and requests is held current at all times, and so that post-inspection returns are generated from the system rather than assembled manually. Every field in the Department's template must exist as a structured, dated, owned record. The report sections below define the data model.

### 3.1 Centre master record

Accommodation ID, contractor entity, centre name and address, accommodation type, centre profile (families, single females, etc.), catering model (self-catering / fully catered / mixed), contract capacity, confirmed provider capacity, manager on duty roster, and report contact. Occupancy is recorded daily and displayed against contract capacity, at centre and room level.

### 3.2 Administration registers (Report Section 1)

| **REGISTER** | **REQUIRED CONTENT AND BEHAVIOUR** |
| --- | --- |
| Resident register | Current register available on demand; room allocation linked to the room-level register in 3.4; profile flags for specific requirements (health, disability, sexual orientation, gender identity) driving room allocation rules |
| Staff register | Full staff list with roles, duties, FT/PT status, Garda vetting status and dates, training records (first aid, fire safety, DLP), designated liaison persons for child protection listed separately |
| Child protection | Child Safeguarding Statement with centre risk assessment, display status, Appendix 2 visitor declaration log, Appendix 5 childminding arrangements, DLP Children First (Tusla-approved) training currency |
| Safety and security | 24-hour supervision and PSA-licensed security rosters, security contractor record, CCTV adequacy, bedroom lock/key issue log, visitor sign-in with CSS declaration, emergency numbers list, first aid kit locations, restock owner and spot-check dates (with product expiry capture) |
| Resident comfort and wellbeing | Heating type and control, disability access, bulky storage, 24/7 tea/coffee/water/snacks, free-of-charge items checklist (feminine hygiene, baby consumables, toiletries), TV/Wi-Fi provision, dedicated rooms inventory, late-arrival meal arrangements |
| Transport | Service description, timetable (publishable — Riverside was required to submit its timetable within 14 days), public transport proximity |
| Cleaning and maintenance | Cleaning materials issue log, room inspection schedule with notice-to-resident records, maintenance issue log with report date, action date and closure within the 48–72 hour expectation |

### 3.3 Visual inspection readiness (Report Section 2)

A standing self-inspection checklist mirroring the Department's visual inspection: external areas; the full mandatory public notices list (DLP details, parental supervision, HSE breastfeeding, house rules, IPAS house rules, complaint forms, incident procedures, IOM voluntary return, anti-trafficking, violence and harassment, emergency numbers including Garda, hospital, fire, duty social work, out-of-hours GP, and the IPAS email address); fire safety registers (Section 3.5); communal areas; laundry with washer and dryer counts against the 2-per-25-residents ratio; kitchen and self-catering provision against the 1-station-per-15-residents ratio with the per-station equipment checklist; food hall/shop where applicable including HACCP evidence; and sanitary ratios (WC 1:8, wash-hand basins 1:6, showers 1:12). Each checklist line carries a compliant/non-compliant state, date last verified, verifying user and photographic evidence attachment.

### 3.4 Room-level register (Report Section 3)

The Department inspects and records **every bedroom individually**: bed configuration, current occupancy, room length, width and total dimensions, ceiling-height qualification, the derived suitable occupancy at not less than 4.65 m² per person, and issues noted (prohibited electrical items, mould and damp, food in rooms, knives, fixtures requiring repair). The dashboard must hold this as a live room register, compute suitable occupancy automatically, flag any room where current occupancy exceeds suitable occupancy, and track per-room issues to closure with photographic evidence. This is a significant data-model addition relative to the Genesis build and is called out for estimation in Section 9.

### 3.5 Fire safety registers

Discrete, dated service and check registers matching the inspection template: emergency lighting checks, fire alarm panel / detection system service, firefighting equipment service, fire exit and means-of-escape inspections, fire drill log capturing date, staff on duty, residents evacuated and evacuation time, and staff fire safety instruction and training records with provider, duration and delivery mode. Each register displays days-since-last-entry against its required frequency and turns amber, then red, as currency lapses.

### 3.6 Findings, RAG and the 14-day evidence loop

Inspection findings are logged against the Department's Summary Details structure: issue, action required, priority (RED — contractual breach or high risk requiring immediate corrective action; AMBER — medium risk with resolution within the agreed 14-day timeframe; GREEN — low operational concern, monitored), expected resolution date, evidence attached, and contractor comment. The module must generate the operator's return to the Department directly, tracking the 14-day clock per finding, and must escalate any finding approaching breach of timeframe to group executives automatically. RED findings escalate on creation.

## 4 Module Two — HIQA Compliance Against the National Standards

This module holds a standards register of the 40 standards across the ten themes of the National Standards **[3]**, organised under the two dimensions used by HIQA in inspection: Capacity and Capability (Themes 1–3) and Quality and Safety (Themes 4–10).

| **THEME** | **TITLE** | **STANDARDS** |
| --- | --- | --- |
| 1 | Governance, Accountability and Leadership | 1.1 – 1.5 |
| 2 | Responsive Workforce | 2.1 – 2.4 |
| 3 | Contingency Planning and Emergency Preparedness | 3.1 |
| 4 | Accommodation | 4.1 – 4.9 |
| 5 | Food, Catering and Cooking Facilities | 5.1 – 5.2 |
| 6 | Person Centred Care and Support | 6.1 – 6.4 |
| 7 | Individual, Family and Community Life | 7.1 – 7.4 |
| 8 | Safeguarding and Protection | 8.1 – 8.3 |
| 9 | Health, Wellbeing and Development | 9.1 – 9.3 |
| 10 | Identification, Assessment and Response to Special Needs | 10.1 – 10.5 |

### 4.1 Standards register and self-assessment

Each standard carries: the standard text and its indicators; a current self-assessed judgement on HIQA's four-point scale (Compliant, Substantially Compliant, Partially Compliant, Not Compliant); linked evidence drawn from Module One registers and the KPI framework; the most recent HIQA inspection judgement where one exists; the compliance plan actions arising; and a named owner and review date. Self-assessment follows the audit checklist and governance framework in the HIQA-Aligned Audit and Governance Pack [4], and the internal audit programme (quarterly thematic audits plus a minimum of one unannounced audit per quarter) writes its findings directly into the register.

### 4.2 Sector benchmarking

HIQA publishes its IPAS monitoring inspection reports, and Peppard has compiled the sector's judgements by standard across inspected centres **[5]**. The pattern is stark: the weakest standards nationally include 3.1 (risk analysis and risk register — 37 partially and 15 not compliant of the centres judged), 1.2 (leadership and governance — 30 partially and 10 not compliant), 2.3 (staff support and supervision) and 2.1 (safe recruitment, where 14 centres were judged not compliant). The dashboard should ingest this dataset and refresh it as new reports publish, so each Peppard centre's self-assessment is displayed against the sector distribution per standard. Strong performance on precisely the standards where the sector fails is a strategic differentiator for Peppard in contract retention and procurement, and the Board view should present it that way.

### 4.3 Inspection readiness pack

One-click generation of an inspection readiness pack per centre: current judgements with evidence index, open compliance plan actions, audit results, fire register currency, room register summary, and the mandatory notices checklist. Target state is that an unannounced HIQA or Department inspection finds nothing the dashboard has not already found.

## 5 Module Three — The Revised KPI Framework

The April 2026 draft framework **[1]** proposed 55 KPIs across ten domains. Assessment against the two regulatory instruments produced four findings. First, the draft is strong on governance process (meetings, audits, action closure) and this is retained largely intact. Second, it contains two KPIs that misstate the regulatory relationship with HIQA and one that imports a concept from designated health and social care settings that does not apply in IPAS accommodation. Third, it duplicates several KPIs across domains and splits complaints measurement across two domains. Fourth — and most significantly — it has no coverage at all of fire safety, food and catering, or the Department's physical and occupancy metrics, which between them constitute the bulk of what is actually inspected at a centre, as the Riverside report demonstrates. The revised framework below resolves all four findings: 13 domains, 74 KPIs, each mapped to an assurance source that exists as a register in Modules One and Two.

### 5.1 KPI framework — Domains 1 to 13

Assurance sources refer to Module One and Two registers. **↓** denotes a reducing trend target.

**Domain 1 — Governance, Management and Oversight**

*Objective: Demonstrate control, accountability and regulatory compliance*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| Governance meetings held | % of scheduled meetings completed with minutes | 100% | Monthly | Minutes log |
| Centre manager reporting | Formal written reports submitted | 100% | Weekly | Report tracker |
| Action closure rate | % actions closed within timeframe | >90% | Monthly | Action tracker |
| Regulatory and contractual returns compliance | % returns/notifications to the Department and IPAS within required timeframe | 100% | Monthly | Returns log |
| Board governance report issued | Quarterly consolidated report to the Board | 100% | Quarterly | Board pack |

**Domain 2 — Risk Management and Incident Control**

*Objective: Proactive identification, escalation and mitigation of risk (Standard 3.1 — the sector's weakest standard)*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| Risk register completeness | % risks fully defined (cause, impact, controls) | 100% | Monthly | Risk register |
| Risk review frequency | Weekly review completed | 100% | Weekly | Risk register |
| Incident reporting compliance | % incidents recorded | 100% | Monthly | Incident log |
| Incident escalation compliance | % escalated appropriately | 100% | Monthly | Incident log |
| Incident trend analysis | Monthly trend report completed | 100% | Monthly | Trend report |
| Repeat incident rate | Reduction month-on-month | ↓ | Monthly | Incident log |

**Domain 3 — Safeguarding and Protection**

*Objective: Full compliance with safeguarding legislation, Children First and HIQA expectations (Theme 8)*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| Safeguarding incidents recorded | % documented | 100% | Monthly | Safeguarding log |
| Tusla referrals | % made appropriately and on time | 100% | Monthly | Referral log |
| Safeguarding plans in place | % of cases with plans | 100% | Monthly | Case records |
| Statutory and contractual safeguarding notifications | % compliant | 100% | Monthly | Notification log |
| Staff safeguarding training | % completed and current | 100% | Monthly | Training matrix |
| DLP Children First training | % of DLPs with current Tusla-approved training | 100% | Quarterly | Training matrix |
| Child Safeguarding Statement | Risk-assessed, current and publicly displayed | Yes | Quarterly | CSS register |
| Safeguarding audit score | % compliance | >95% | Quarterly | Audit report |

**Domain 4 — Resident Experience and Rights**

*Objective: Person-centred, rights-based service delivery (Themes 6 and 7)*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| Resident satisfaction score | Survey outcome | >85% | Quarterly | Survey |
| Resident meeting attendance | % participation | Rising | Monthly | Meeting records |
| Residents' committee | Committee constituted and active (met in period) | Yes | Monthly | Committee minutes |
| Evidence of consultation | Engagement activities held | Monthly | Monthly | Engagement log |
| Rights and charter information | Residents' charter and mandatory notices displayed and current | 100% | Monthly | Notices checklist |

**Domain 5 — Complaints Management**

*Objective: Transparent, effective and auditable complaints handling*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| Complaints logged | % recorded centrally | 100% | Monthly | Complaints log |
| Complaints categorised correctly | % accuracy | >95% | Monthly | Complaints log |
| Complaints awareness | % residents aware of process | >90% | Quarterly | Survey |
| Complaints resolution time | Average days to resolution | <10 days | Monthly | Complaints log |
| Complaints closed | % resolved | >95% | Monthly | Complaints log |
| Satisfaction with outcome | % satisfied | >85% | Quarterly | Survey |
| Complaint trend reports | Monthly analysis completed | 100% | Monthly | Trend report |

**Domain 6 — Workforce and Staffing**

*Objective: Safe, competent and supported workforce (Theme 2)*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| Staffing levels vs required | % compliance with agreed rosters incl. 24-hour cover | 100% | Weekly | Roster records |
| Garda vetting | % staff (and security) vetted and current | 100% | Monthly | Staff register |
| Mandatory training completion | % staff compliant | 100% | Monthly | Training matrix |
| Training needs analysis | Completed | Yes | Annual | TNA report |
| Supervision completion | % completed | >95% | Monthly | Supervision records |
| Time to recruit | Days to fill | <30 days | Monthly | HR tracker |
| Staff turnover rate | % | ↓ | Quarterly | HR tracker |

**Domain 7 — Accommodation and Environment**

*Objective: Safe, dignified and appropriate living conditions (Theme 4)*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| Maintenance response time | Average hours to action (contractual threshold 48–72 hrs) | <48 hrs | Monthly | Maintenance log |
| Accommodation standards compliance | % checklist items meeting standard | 100% | Monthly | Self-inspection |
| Privacy and room-entry compliance | % inspections with required notice and protocol | 100% | Monthly | Inspection log |
| Storage adequacy issues | Number reported | ↓ | Monthly | Maintenance log |
| Mould and damp cases | Open cases; closure within 14 days with evidence | 0 open >14 days | Monthly | Room register |
| Prohibited items in rooms | Findings per 100 rooms at self-inspection | ↓ | Monthly | Room register |
| Facility accessibility | Laundry/shop hours aligned to need; disability access confirmed | Reviewed monthly | Monthly | Self-inspection |

**Domain 8 — Fire and Environmental Safety (new)**

*Objective: Continuous fire safety compliance evidenced by current registers*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| Fire register currency | % required checks in date (lighting, panel, equipment, exits) | 100% | Weekly | Fire registers |
| Fire drills | Drills at required frequency; evacuation time trend | 100% / ↓ | Per schedule | Drill log |
| Staff fire safety training | % staff with current instruction | 100% | Monthly | Training matrix |
| Exits and notices compliance | % spot checks fully compliant (clear, unlocked, posted, doors closed) | 100% | Weekly | Self-inspection |
| Detection and equipment servicing | % serviced within schedule | 100% | Monthly | Service records |

**Domain 9 — Food, Catering and Cooking Facilities (new)**

*Objective: Catering that meets residents' needs, autonomy and cultural requirements (Theme 5)*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| HACCP system | Implemented with FSAI Safe Catering evidence | Yes | Quarterly | HACCP records |
| Kitchen cleaning records | % daily cleaning and periodic deep-clean records complete | 100% | Monthly | Cleaning records |
| Cooking station ratio | Stations per residents (min. 1:15) and per-station equipment complete | 100% | Monthly | Self-inspection |
| Menu and dietary consultation | Resident consultation held; cultural, religious, medical needs met | Monthly / 100% | Monthly | Consultation log |
| Food provision checks | Variety, infant foods, Ramadan and special provision confirmed | 100% | Monthly | Self-inspection |

**Domain 10 — Health, Wellbeing and Support Services**

*Objective: Holistic support for residents (Themes 9 and 10)*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| Vulnerability assessments completed | % residents assessed; special reception needs incorporated | 100% | Monthly | Assessment records |
| Support referrals followed up | % tracked to outcome | 100% | Monthly | Referral log |
| Access to external services | Engagements facilitated | Monthly | Monthly | Engagement log |
| Child development supports | % children accessing education supports | 100% | Monthly | Education log |
| Wellbeing activities delivered | Number per month | Rising | Monthly | Activity log |

**Domain 11 — Occupancy and Inspection Performance**

*Objective: The metrics on which the Department directly judges the operator*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| Occupancy vs contract capacity | Daily occupancy within confirmed contract capacity | 100% | Daily | Occupancy record |
| Room-level suitable occupancy | % rooms within computed suitable occupancy (≥4.65 m²/person) | 100% | Daily | Room register |
| Sanitary and laundry ratios | WC 1:8, WHB 1:6, showers 1:12, washers/dryers 2:25 | 100% | Monthly | Self-inspection |
| Inspection findings closed on time | % Department findings closed within 14 days with evidence | 100% | Per inspection | Findings tracker |
| Open RED findings | Contractual breach / high-risk findings open | 0 | Continuous | Findings tracker |

**Domain 12 — Information Governance and Data**

*Objective: Accurate, centralised and auditable records*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| Data completeness | % records complete | 100% | Monthly | System report |
| GDPR compliance | % compliance; breaches logged and addressed | 100% | Monthly | Breach log |
| Single-system integration | Incidents, complaints and registers in one system | Yes | Continuous | System audit |
| Reporting accuracy | % validated | >95% | Monthly | Validation report |

**Domain 13 — Quality Improvement and Audit**

*Objective: Continuous improvement and inspection readiness*

| **KPI** | **MEASURE** | **TARGET** | **FREQUENCY** | **ASSURANCE SOURCE** |
| --- | --- | --- | --- | --- |
| Internal audit completion | % of annual audit plan delivered (incl. unannounced) | 100% | Quarterly | Audit plan [4] |
| Repeat findings | % reduction in repeat audit findings | ↓ | Quarterly | Audit reports |
| Quality improvement plan | Active and tracked | Yes | Quarterly | QIP |
| Annual review completed | Service annual review | Yes | Annual | Annual report |
| National Standards self-assessment score | % standards Compliant or Substantially Compliant (Module Two) | >95% | Quarterly | Standards register |

## 6 Data Architecture and Integration Requirements

- **Single source of truth.** Every KPI computes from a register; no KPI is a manually keyed number. The framework's assurance sources map one-to-one to Module One and Two registers.
- **Cross-module mapping.** Each register and KPI is tagged to the National Standards (theme and standard) and to the Department report section it evidences, so one data entry serves both regulatory axes and the inspection readiness packs assemble automatically.
- **Evidence repository.** Dated, attributed document and photographic evidence attachable to any register entry, finding or action; immutable once attached to a submitted return.
- **Room register as first-class entity.** Rooms carry dimensions, derived suitable occupancy, current allocation and an issues history. Occupancy warnings compute in real time.
- **Platform reuse.** Action tracking, audit scheduling, RAG logic, escalation and board reporting reuse the Genesis connects.health components; the IPAS module is a themed configuration and data-model extension, not a parallel product.
- **Segregation.** Peppard IPAS data is logically segregated from Genesis clinical data with role-based access across both for group users.
- **Benchmark ingestion.** Periodic ingestion of published HIQA IPAS judgements [5] to maintain the sector distribution per standard.

## 7 Dashboard Views and Outputs

| **VIEW** | **CONTENT** |
| --- | --- |
| Centre operations (daily) | Occupancy vs capacity, room flags, fire register currency, open maintenance and mould/damp cases, incidents and complaints today, notices checklist state |
| Compliance (centre and group) | KPI framework RAG by domain, National Standards register with sector benchmark overlay, open findings by priority and days remaining on the 14-day clock |
| Audit and assurance | Annual audit plan delivery, findings and corrective actions, repeat-finding trend, unannounced audit results |
| Board report (quarterly) | Generated pack: cross-centre RAG profile, standards self-assessment vs sector, escalated risks, inspection outcomes and closure performance, QIP status |
| Department return generator | Per-inspection response document with findings, actions, evidence and contractor comment, exportable in the Department's structure |
| Inspection readiness pack | Per-centre, one click, as defined in Section 4.3 |

## 8 Branding and Visual Design Requirements

The IPAS module is branded to Peppard Investments, not Genesis. The design approach follows the established Genesis document and dashboard design system in structure, typography and restraint, re-coloured to the Peppard identity drawn from the Peppard Investments logo.

| **ELEMENT** | **VALUE** | **USAGE** |
| --- | --- | --- |
| Peppard Red | #E01E1F | Primary accent: rules, kickers, active states, RED priority |
| Deep Red | #A81516 | Secondary headings, links, emphasis text |
| Charcoal Ink | #26262A | Primary headings, dark panels and headers (white text) |
| Body | #2B2B2F | Body text |
| Greys | #5C5C62 / #8E8E94 | Secondary text, captions, disabled states |
| Warm Light | #F8F4F2 | Panel and table fills |
| Pale Red Tint | #FBEDED | Highlight fills, warning backgrounds |
| Border | #E8E0DC | Rules and table borders |

- Typography follows the Genesis system: Cambria (or platform serif equivalent) for headings, Calibri (or platform sans equivalent) for body and data.
- The Peppard Investments logo appears in the module header and on all generated documents; the Genesis rising-sun identity does not appear in the IPAS module.
- RAG semantics: the Department's RED aligns naturally with Peppard Red; AMBER and GREEN follow the existing connects.health palette. Care must be taken that Peppard Red as a brand accent remains visually distinct from RED-priority alerting — accent red is used structurally (rules, headers), alert red only on status chips and escalations.
- Generated documents (returns, board packs, readiness packs) follow the Peppard document standard used in this descriptor: light editorial covers with a red rule, charcoal headings, warm light fills, and the footer format below.

## 9 Delivery, Assumptions and Commercial Note

- This descriptor is issued for scoping and estimation under the existing Framework Services Agreement and change-control arrangements between the parties [6]; it does not of itself authorise expenditure.
- The room-level register (Section 3.4) and the Department return generator (Section 3.6) are the two most significant additions relative to the Genesis build and should be estimated as discrete work packages.
- Suggested sequencing: Phase 1 — centre master data, room register, fire registers and the findings/14-day loop (the areas of live contractual exposure); Phase 2 — full KPI framework and standards register with benchmarking; Phase 3 — generated outputs (board pack, readiness pack, return generator).
- Origin is asked to respond with an estimate, proposed data model and any challenge to the requirements — including where existing connects.health components can meet a requirement in a different way at lower cost.

---

*Document footer: © Peppard Investments 2026 | Confidential*

*Note on citations: the source document cites references [1]–[6] inline (draft KPI Framework April 2026; Riverside Park Hotel IPPS inspection report 24 March 2026; HIQA National Standards 2019; HIQA-Aligned Audit and Governance Pack; compiled sector judgements dataset; Framework Services Agreement / connects.health platform) but contains no separate bibliography section.*
