---
name: enforceSeparationOfConcerns
description: Review code to ensure architectural layers don't mix responsibilities.
argument-hint: The code or file to review for layer separation violations
---
Review the provided code for separation of concerns violations between architectural layers.

## Layer Responsibilities

**Data/API Layer** should only:
- Make HTTP requests and handle responses
- Define data types, interfaces, and error classes
- Transform data formats
- Build URLs and query parameters
- NOT import or use UI components, toasts, alerts, or visual feedback

**UI/Presentation Layer** should only:
- Render components and handle user interactions
- Display error messages, toasts, and loading states
- Call data layer functions and handle their results
- NOT contain business logic or direct API calls

**Business Logic Layer** should only:
- Contain domain-specific rules and validations
- Orchestrate data flow between layers
- NOT directly render UI or make raw HTTP calls

## Task

1. Identify any layer violations in the code (e.g., UI concerns in data layer, data fetching in presentation)
2. Suggest refactoring to properly separate responsibilities
3. Show how error handling should flow: data layer throws typed errors → UI layer catches and displays feedback
4. Ensure imports align with layer boundaries
