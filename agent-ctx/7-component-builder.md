# Task: Create DERHAN AutoDiag v2026.3 View Components

## Task ID: 7-component-builder

## Summary
Created two 'use client' React view components with the dark military/cyberpunk theme for the DERHAN AutoDiag v2026.3 platform.

## Files Created

### 1. `/home/z/my-project/src/components/ecu/digital-twin-view.tsx`
- **Component**: `DigitalTwinView` (named export)
- **Features**:
  - Header with fleet sync stats (twin count, avg health, pending OTA, faults)
  - Left panel: Twin selector with VIN search, 5 twin cards with health score bars, sync buttons, fault/update counts
  - Right panel: Selected twin detail with:
    - State card: Health gauge (SVG ring), VIN, SDV/SOVD badges, metadata grid (last sync, mileage, last service, pending OTA)
    - ECU Software Map: Expandable table with ECU, SW version, FW version, pending update badges
    - Active Faults: DTC code list with critical/warning severity badges
    - Failure Predictions: Component cards with days-to-failure, confidence bars, urgency coloring
    - OTA Pre-Validation: Quick-pick pending updates, manual ECU/version input, simulate OTA button with loading state, result panel showing compatibility, risk level, health delta, warnings
    - Force sync button with animated indicator

### 2. `/home/z/my-project/src/components/ecu/idps-view.tsx`
- **Component**: `IdpsView` (named export)
- **Features**:
  - Header: "IDPS Monitor" with ACTIVE status badge, model version, active rules count, uptime
  - Model Metrics row: Precision, Recall, False Positive Rate, Blocked Frames as HUD stat cards with progress bars
  - Alert Stream: Scrollable list with severity filtering (all/critical/high/medium/low/info), search, severity/response badges, vehicle info, acknowledge button with loading state
  - Threat Stats: Mini bar charts for alerts by severity and by category
  - Rule Editor: 14 rules with custom toggle switches, category/severity/response badges, condition text, 24h hit count
  - Custom styled toggle switch for rule enable/disable

## Design Compliance
- HUD card wrapper pattern with cyan corner brackets
- Color system: #0f1923 (base), #151d2b (surface), #0c1219 (dark), #00d4ff (cyan accent), #10b981 (green), #f59e0b (amber), #ef4444 (red), #8b5cf6 (violet)
- Font-mono for live data values
- Only verified lucide-react icons used
- No `any` types
- Named exports
- shadcn/ui components: Badge, Button, Input, Progress
- cn() from @/lib/utils for conditional classes

## Lint Results
Both files pass ESLint with 0 errors and 0 warnings.

## Dependencies Used
- `@/lib/digital-twin-engine`: digitalTwinEngine, DigitalTwinState, OTASimulationResult
- `@/lib/idps-monitor`: idpsMonitor, IDPSAlert, IDPSRule, IDPSStats
- Both libraries already existed with full mock data and API fallback patterns
