# State Machine Test Cases

## Overview
The PTW system's core integrity relies on an un-bypassable finite-state machine. These test cases ensure that permits cannot skip required statutory safety gates.

## Core Flow Tests (PTW-001 Excavation)

| Test ID | Condition | Expected Result |
|---|---|---|
| `SM-001` | Site Supervisor initiates PTW-001 | Status becomes `PENDING_ACK`, Stage = 1. Assigned to `site-engineer`. |
| `SM-002` | EHS Manager attempts to approve PTW-001 at Stage 1 | **FAIL**. Action rejected. EHS Manager does not possess authority for Stage 1. |
| `SM-003` | Site Engineer acknowledges PTW-001 | Status becomes `PENDING_PARALLEL`, Stage = 2. Assigned to `mep`, `pm`, `it`. |
| `SM-004` | MEP Engineer approves | State remains `PENDING_PARALLEL`. Wait for P&M and IT. |
| `SM-005` | IT Engineer approves | State remains `PENDING_PARALLEL`. Wait for P&M. |
| `SM-006` | P&M Engineer approves | Status advances to `PENDING_APPROVAL`, Stage = 3. Assigned to `excavation-head`. |

## Critical Lifesaving Rules (PTW-009B)

| Test ID | Condition | Expected Result |
|---|---|---|
| `SM-007` | PTW-009A created with load = 6.0 MT | System intercepts payload, mutates type to `PTW-009B` (Critical Lift), adds Project Manager to flow. |
| `SM-008` | PTW-009B reaches Stage 4 (Tower Incharge) | Tower Incharge approves, flow advances to `project-manager` (Stage 5), not EHS. |

## Night Shift Integrity (PTW-010)

| Test ID | Condition | Expected Result |
|---|---|---|
| `SM-009` | PTW-010 initiated at 14:00 IST for Confined Space | **FAIL**. UI prevents selection. Server rejects payload if bypassed. |
| `SM-010` | PTW-010 approved by Day Approvers at 18:00 IST | Status becomes `PENDING_NIGHT_HANDOVER`. Paused until 20:30 IST. |
| `SM-011` | Night Site Supervisor attempts handover at 19:00 IST | **FAIL**. Handover strictly gated to $\ge 20:30$. |

## Expiry & Escalation

| Test ID | Condition | Expected Result |
|---|---|---|
| `SM-012` | Permit active, validUntil time passes | Escalation Engine cron job detects expiry, moves status to `CLOSED_EXPIRED`. |
| `SM-013` | PTW-010 reaches 21:00 IST without Night Handover | Escalation Engine detects missed SLA, auto-cancels permit to prevent unsafe unstaffed operations. |
