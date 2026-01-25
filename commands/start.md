---
description: Intelligent session startup - analyze context and propose next action
alwaysApply: false
version: 1.0
---

# Session Start Command

Analyze the current project state and propose the appropriate next action.

## Overview

This command checks git status, looks for progress files and feature shapes, then proposes what to do next based on the current situation.

<process_flow>

<step number="1" subagent="Explore" name="analyze_project_context">

### Step 1: Analyze Project Context

Gather all relevant context about the current project state.

<analysis_areas>
  <git_status>
    - Current branch name
    - Is repo clean or dirty (uncommitted changes)?
    - Are there untracked files?
  </git_status>
  <progress_tracking>
    - Does docs/PROGRESS.md exist?
    - What phase/step is currently in progress?
    - What checkboxes are checked/unchecked?
  </progress_tracking>
  <feature_shapes>
    - Does docs/features/ directory exist?
    - List all feature shape files (NN-*.md)
    - Which features are complete vs pending?
  </feature_shapes>
  <mvp>
    - Does docs/MVP.md exist?
    - What is the build order?
  </mvp>
  <plans>
    - Are there any implementation plans in ~/.claude/plans/ for this project?
    - Plans are named: {project-name}-{feature-number}-{feature-name}.md
    - Filter by project name to find relevant plans quickly
  </plans>
</analysis_areas>

<instructions>
  ACTION: Check git status, look for docs/PROGRESS.md, docs/features/*.md, docs/MVP.md
  IDENTIFY: Current state of the project
  OUTPUT: Summary of findings for Step 2
</instructions>

</step>

<step number="2" name="assess_and_propose">

### Step 2: Assess Situation and Propose Action

Based on the analysis, determine the appropriate action.

<decision_matrix>

| Situation | Action |
|-----------|--------|
| Repo dirty, no feature in progress | ⚠️ Warn user. Suggest commit or stash before continuing. |
| Repo dirty, feature in progress | Ask if user wants to continue current work or clean up first. |
| Repo clean, no feature in progress | Propose next feature to implement from MVP/Feature Shapes. |
| Repo clean, feature in progress | Summarize progress, propose next step from PROGRESS.md. |
| No MVP.md or Feature Shapes | Suggest creating MVP.md first, or ask what user wants to work on. |

</decision_matrix>

<output_format>
```text
📊 Session Analysis

Git Status: [branch] - [clean/dirty]
Progress: [current phase/step or "no progress file"]
Feature Shapes: [count] found in docs/features/

Current Situation: [description]

🎯 Recommended Action:
[specific recommendation based on situation]

Options:
1. [primary action]
2. [alternative action]
3. Something else?
```
</output_format>

<instructions>
  ACTION: Match current situation to decision matrix
  PROPOSE: Specific next action with clear options
  WAIT: For user confirmation before proceeding
</instructions>

</step>

</process_flow>

## Execution Flow

1. **Always** run Step 1 first to gather context
2. Step 2 uses findings to propose appropriate action
3. **Wait for user confirmation** before taking any action

## Philosophy

> "Understand the context before diving in."

The goal is to help the user pick up where they left off, or start fresh with clear direction. Never assume — always analyze first.
