# RBAC Matrix (Role-Based Access Control)

## Administrative Control
All user provisioning is handled strictly by the Administrator via a separate admin portal/CLI. The system relies on Firebase Custom Claims to inject the authorized `role` directly into the user's secure token.

## The 16 System Roles

| Role ID | Title | Domain / Purpose |
|---|---|---|
| `site-supervisor` | Site Supervisor | Civil/Structural Initiation (PTW-001 to 05, PTW-008) |
| `electrician` | Permittee Electrician | Electrical Initiation (PTW-006) |
| `blasting-incharge` | Blasting/Drilling In-charge | Explosives/Drilling Initiation (PTW-007) |
| `lifting-supervisor` | Lifting Supervisor | Rigging/Crane Initiation (PTW-009A/B) |
| `night-supervisor` | Night Site Supervisor | Takes over PTW-010 operations after 20:30 IST |
| `site-engineer` | Site Engineer | Step 2 Technical Verification / Physical Checks |
| `mep-engineer` | MEP Engineer | Step 3 Utilities Clearance |
| `pm-engineer` | P&M Engineer | Step 3 Plant & Machinery / Batching Plant Clearance |
| `it-engineer` | IT Engineer | Step 3 Data/Fibre Clearance (Excavation) |
| `quality-engineer` | Quality Engineer | Step 3 QA Clearance (Batching Plant) |
| `excavation-head` | Excavation Head | Step 4 Section Head (PTW-001) |
| `tower-incharge` | Tower Incharge | Step 4 Section Head (General Construction) |
| `project-manager` | Project Manager | Executive Review (PTW-009B Critical Lift Plans) |
| `ehs-manager` | EHS Manager | Step 5/6 Final Safety Endorsement |
| `ehs-officer` | EHS Officer | Step 5/6 Final Safety Endorsement |
| `admin` | System Administrator | Project Geofencing / Auth Provisioning |

## Core Operational Permissions

| Capability | Site Sup. | Site Eng. | Section Head | Proj. Mgr | EHS |
|---|:---:|:---:|:---:|:---:|:---:|
| Initiate Permit | ✅ | ❌ | ❌ | ❌ | ❌ |
| Acknowledge (Step 2) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Domain Clearance (Step 3) | ❌ | ❌ | (Domain Eng) | ❌ | ❌ |
| Approve (Step 4) | ❌ | ❌ | ✅ | ❌ | ❌ |
| Exec Review (Step 5) | ❌ | ❌ | ❌ | ✅ | ❌ |
| Final Endorse (Step 6) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Stop Work / Cancel | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Project Permits | Self | Assigned | Assigned | Assigned | All |
| Generate PDFs | ❌ | ❌ | ❌ | ❌ | ✅ |

*Note: For the exhaustive matrix covering every specific permit type's routing, refer to `SPECIFICATION.md` Section 4.2.*
