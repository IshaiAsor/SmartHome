# Lattice v2.2 — Database Schema Review

Single source of truth is `prisma/schema.prisma`. **Keep this file in sync with every schema
change** (mermaid ERD + per-table examples). 25 tables, ordered by dependency tier 0 → 6.

| Tier | Theme | Tables |
|------|-------|--------|
| 0 | External catalog | `google_action_types`, `google_device_traits` |
| 1 | Device & ML catalog | `devices`, `device_capabilities`, `device_capability_traits`, `device_capability_pins`, `ml_models` |
| 2 | Identity | `users`, `mqtt_user`, `user_login_audit` |
| 3 | User devices & actions | `user_devices`, `user_action_groups`, `user_device_actions`, `user_device_action_pins` |
| 4 | Automation (rules; emergencies = rules with `is_emergency`) | `user_rules`, `user_rule_conditions`, `user_rule_actions`, `user_rule_events` |
| 5 | Pipelines (ML execution) | `pipelines`, `pipeline_sensors`, `pipeline_stages`, `pipeline_triggers`, `pipeline_runs`, `pipeline_run_stages` |
| 6 | Telemetry | `sensor_history` |

---

## ER Diagram

```mermaid
erDiagram
  %% ── Tier 0: external catalog ──
  GoogleActionType {
    int id PK
    string value UK "action.devices.types.*"
  }
  GoogleDeviceTrait {
    int id PK
    string value UK "action.devices.traits.*"
    json valid_parameters "external Google contract"
  }

  %% ── Tier 1: device & ML catalog ──
  Device {
    int id PK
    string type
    string version
    string default_name UK
  }
  DeviceCapability {
    int id PK
    int device_id FK
    string capability_key "stable per-device key"
    string label
    string implementation_type
    string mqtt_action_type
    string mqtt_action_name
    int min_telemetry_interval_ms
    int google_type_id FK "nullable"
  }
  DeviceCapabilityTrait {
    int id PK
    int capability_id FK
    int google_trait_id FK
  }
  DeviceCapabilityPin {
    int id PK
    int capability_id FK
    string key
    string label
    string mode "INPUT/OUTPUT"
  }
  MlModel {
    int id PK
    string kind "vlm/llm"
    string name
    string version
    string backend "onnx/ollama"
    json classes "model metadata"
    json config "model metadata"
  }

  %% ── Tier 2: identity ──
  User {
    int id PK
    string email UK
    string user_role
    string google_id UK "nullable"
  }
  MqttUser {
    int id PK
    string username UK
    string password_hash
    bool is_superuser
  }
  UserLoginAudit {
    int id PK
    int user_id FK
    datetime login_at
    string ip_address
  }

  %% ── Tier 3: user devices & actions ──
  UserDevice {
    int id PK
    int device_type_id FK "current Device"
    int user_id FK
    string mac_id UK
    string name
    bool online
    int pending_device_type_id FK "nullable"
  }
  UserActionGroup {
    int id PK
    int user_id FK
    string name
    int sort_order "dashboard card position"
  }
  UserDeviceAction {
    int id PK
    int user_device_id FK
    int capability_id FK
    int group_id FK "nullable"
    string action_name
    string mqtt_action_name
    string current_state
    string status "active/staged_*/deprecated"
    int sort_order "position within group"
    int telemetry_interval_ms
  }
  UserDeviceActionPin {
    int id PK
    int user_device_action_id FK
    int capability_pin_id FK "→ device_capability_pins.id"
    int pin_number "assigned GPIO"
  }

  %% ── Tier 4: automation (rules) ──
  UserRule {
    int id PK
    int user_id FK
    string name
    bool enabled
    bool is_emergency "fast-path safety rule"
    string condition_operator "AND/OR"
    int cooldown_seconds
  }
  UserRuleCondition {
    int id PK
    int rule_id FK
    string condition_type "threshold/device_status/schedule/vlm"
    int user_device_action_id FK "threshold, nullable"
    string operator "threshold"
    string threshold_value "threshold"
    int user_device_id FK "device_status, nullable"
    string status_value "online/offline"
    string schedule_time "HH:MM"
    int_array schedule_days "0=Sun..6=Sat"
  }
  UserRuleAction {
    int id PK
    int rule_id FK
    int user_device_action_id FK
    string target_state
    int delay_seconds
  }
  UserRuleEvent {
    int id PK
    int rule_id FK
    string triggered_value
    datetime fired_at
  }

  %% ── Tier 5: pipelines ──
  Pipeline {
    int id PK
    int user_id FK
    string name
    bool enabled
  }
  PipelineSensor {
    int id PK
    int pipeline_id FK
    int user_device_action_id FK
    string group_name
    string min_value
    string max_value
  }
  PipelineStage {
    int id PK
    int pipeline_id FK
    int ordinal
    string kind "infer/sensor_digest/command_exec"
    int ml_model_id FK "nullable"
    int execute_user_device_action_id FK "nullable"
    json config "optional per-stage overrides"
  }
  PipelineTrigger {
    int id PK
    int pipeline_id FK
    string trigger_type "telemetry/schedule/manual"
    int user_device_action_id FK "nullable"
    string operator
    string threshold_value
    string schedule_cron
    int min_interval_sec
  }
  PipelineRun {
    int id PK
    int pipeline_id FK
    string status "pending/running/completed/failed"
    json trigger_payload "ML audit blob"
    datetime started_at
    datetime completed_at
  }
  PipelineRunStage {
    int id PK
    int run_id FK
    int stage_id FK
    string status
    json input "ML audit blob"
    json output "ML audit blob"
  }

  %% ── Tier 6: telemetry ──
  SensorHistory {
    int id PK
    int user_device_action_id FK
    string value "scalar or base64 image"
    datetime recorded_at
  }

  %% ── Relationships ──
  Device                ||--o{ DeviceCapability       : "declares"
  GoogleActionType      |o--o{ DeviceCapability       : "google type"
  DeviceCapability      ||--o{ DeviceCapabilityTrait  : "has"
  GoogleDeviceTrait     ||--o{ DeviceCapabilityTrait  : "google trait"
  DeviceCapability      ||--o{ DeviceCapabilityPin    : "pin slots"
  DeviceCapability      ||--o{ UserDeviceAction       : "instantiated as"

  Device                ||--o{ UserDevice             : "current model"
  Device                |o--o{ UserDevice             : "pending model"
  User                  ||--o{ UserDevice             : "owns"
  User                  ||--o{ UserActionGroup        : "owns"
  User                  ||--o{ UserRule               : "owns"
  User                  ||--o{ Pipeline               : "owns"
  User                  ||--o{ UserLoginAudit         : "logins"

  UserDevice            ||--o{ UserDeviceAction       : "has"
  UserDevice            |o--o{ UserRuleCondition      : "status checked by"
  UserActionGroup       |o--o{ UserDeviceAction       : "groups"
  UserDeviceAction      ||--o{ UserDeviceActionPin    : "pin assignment"

  UserRule              ||--o{ UserRuleCondition      : "when"
  UserRule              ||--o{ UserRuleAction         : "then"
  UserRule              ||--o{ UserRuleEvent          : "fired"
  UserDeviceAction      |o--o{ UserRuleCondition      : "reads"
  UserDeviceAction      ||--o{ UserRuleAction         : "commands"

  MlModel               |o--o{ PipelineStage          : "runs"
  Pipeline              ||--o{ PipelineSensor         : "inputs"
  Pipeline              ||--o{ PipelineStage          : "steps"
  Pipeline              ||--o{ PipelineTrigger        : "fires on"
  Pipeline              ||--o{ PipelineRun            : "executions"
  PipelineRun           ||--o{ PipelineRunStage       : "per-stage record"
  PipelineStage         ||--o{ PipelineRunStage       : "definition of"
  UserDeviceAction      ||--o{ PipelineSensor         : "read by"
  UserDeviceAction      |o--o{ PipelineStage          : "exec target"
  UserDeviceAction      |o--o{ PipelineTrigger        : "triggers"

  UserDeviceAction      ||--o{ SensorHistory          : "readings"
```

---

## Table reference + examples

### Tier 0 — External catalog

#### `google_action_types`
| id | name | value |
|----|------|-------|
| 1 | Switch | `action.devices.types.SWITCH` |
| 2 | Sensor | `action.devices.types.SENSOR` |

#### `google_device_traits`
`valid_parameters` is JSON — mirrors Google's external trait contract (freeform by trait).
| id | name | value | valid_parameters |
|----|------|-------|------------------|
| 1 | On / Off | `action.devices.traits.OnOff` | `["on","off"]` |

### Tier 1 — Device & ML catalog

#### `devices` — device models (type + firmware version). Unique `(type, version)`.
| id | type | version | default_name |
|----|------|---------|--------------|
| 1 | env-node | v2.0.0 | Environment Node |
| 2 | env-node | v2.1.0 | Environment Node v2.1 |

#### `device_capabilities` (`DeviceCapability`) — single per-version capability catalog. Unique `(device_id, capability_key)`.
| id | device_id | capability_key | label | implementation_type | mqtt_action_type | mqtt_action_name | min_telemetry_interval_ms | google_type_id |
|----|-----------|----------------|-------|---------------------|------------------|------------------|---------------------------|----------------|
| 10 | 1 | temperature | Temperature | TemperatureSensorAction | telemetry | temperature | 5000 | 2 |
| 11 | 1 | relay1 | Relay 1 | DigitalOutputAction | command | relay1 | NULL | 1 |
| 12 | 1 | cam | Camera | TakePictureHttpAction | telemetry | cam | NULL | NULL |

#### `device_capability_traits` (`DeviceCapabilityTrait`) — capability ↔ google trait. Unique `(capability_id, google_trait_id)`. `is_default=true` marks the catalog-level default display trait for a capability (at most one per `capability_id`, enforced by the repository — not a DB constraint). Set via `PATCH /api/device-config/capabilities/:id/traits/:traitId/default`.
| id | capability_id | google_trait_id | is_default |
|----|---------------|-----------------|------------|
| 1 | 11 | 1 (OnOff) | false |
| 2 | 11 | 5 (FanSpeed) | true |

#### `device_capability_pins` (`DeviceCapabilityPin`) — declared pin slots. Unique `(capability_id, key)`.
| id | capability_id | key | label | mode |
|----|---------------|-----|-------|------|
| 1 | 11 | out | Output pin | OUTPUT |

#### `ml_models` (`MlModel`) — system ML registry. Unique `(kind, name, version)`. `classes`/`config` JSON = per-model metadata.
| id | kind | name | version | backend | model_file | ollama_model | classes |
|----|------|------|---------|---------|------------|--------------|---------|
| 1 | vlm | yolo | v1 | onnx | `yolo/v1/yolo.onnx` | NULL | `["person","package"]` |
| 2 | llm | qwen | v1 | ollama | NULL | `qwen2.5vl:7b` | NULL |

### Tier 2 — Identity

#### `users` (`User`)
| id | email | user_role | google_id |
|----|-------|-----------|-----------|
| 1 | owner@example.com | admin | NULL |
| 2 | alice@example.com | user | 11522… |

#### `mqtt_user` (`MqttUser`) — broker app auth (standalone, no FK)
| id | username | is_superuser |
|----|----------|--------------|
| 1 | ts_backend_app | true |

#### `user_login_audit` (`UserLoginAudit`)
| id | user_id | login_at | ip_address |
|----|---------|----------|------------|
| 1 | 2 | 2026-06-26T08:00:00Z | 203.0.113.7 |

### Tier 3 — User devices & actions

#### `user_devices` (`UserDevice`) — a physical device a user owns
| id | device_type_id | user_id | mac_id | name | online | current_firmware_version | pending_device_type_id |
|----|----------------|---------|--------|------|--------|--------------------------|------------------------|
| 7 | 1 | 2 | AA:BB:CC:00:11:22 | Garage Node | true | v2.0.0 | NULL |

#### `user_action_groups` (`UserActionGroup`) — dashboard grouping. Unique `(user_id, name)`. `sort_order` = card position.
| id | user_id | name | sort_order |
|----|---------|------|------------|
| 1 | 2 | Garage | 0 |

#### `user_device_actions` (`UserDeviceAction`) — an activated capability instance. Index `(user_device_id, mqtt_action_name)`. `sort_order` = position within group. `default_trait_id` (nullable FK → `google_device_traits`) = the user's chosen display trait; overrides the capability-level `is_default` when set. Resolution order: `default_trait_id` → catalog `is_default` trait → first trait.
| id | user_device_id | capability_id | group_id | default_trait_id | action_name | mqtt_action_name | current_state | status | sort_order |
|----|----------------|---------------|----------|-----------------|-------------|------------------|---------------|--------|------------|
| 100 | 7 | 10 | 1 | NULL | Garage Temp | temperature | "23.4" | active | 0 |
| 101 | 7 | 11 | 1 | 1 | Door Relay | relay1 | "OFF" | active | 1 |
| 102 | 7 | 12 | 1 | NULL | Garage Cam | cam | NULL | active | 2 |

#### `user_device_action_pins` (`UserDeviceActionPin`) — per-instance GPIO assignment. `capability_pin_id` FK to the catalog slot (mode is read from there). Unique `(user_device_action_id, capability_pin_id)`.
| id | user_device_action_id | key | pin_number |
|----|-----------------------|-----|------------|
| 1 | 101 | out | 5 |

### Tier 4 — Automation (rules; emergencies = `is_emergency` rules)

#### `user_rules` (`UserRule`) — `is_emergency=true` marks fast-path safety rules.
| id | user_id | name | enabled | is_emergency | condition_operator | cooldown_seconds |
|----|---------|------|---------|--------------|--------------------|--------------------|
| 50 | 2 | Hot garage → open vent | true | false | AND | 60 |
| 51 | 2 | Overheat cutoff | true | true | AND | 30 |

#### `user_rule_conditions` (`UserRuleCondition`) — typed columns per `condition_type` (no JSON)
| id | rule_id | condition_type | user_device_action_id | operator | threshold_value | user_device_id | status_value | schedule_time | schedule_days |
|----|---------|----------------|-----------------------|----------|-----------------|----------------|--------------|---------------|---------------|
| 80 | 50 | threshold | 100 | > | 30 | NULL | NULL | NULL | `{}` |
| 81 | 50 | schedule | NULL | NULL | NULL | NULL | NULL | 08:00 | `{1,2,3,4,5}` |
| 82 | 51 | threshold | 100 | > | 45 | NULL | NULL | NULL | `{}` |
| 83 | 50 | device_status | NULL | NULL | NULL | 7 | online | NULL | `{}` |

#### `user_rule_actions` (`UserRuleAction`) — the "then"
| id | rule_id | user_device_action_id | target_state | delay_seconds |
|----|---------|-----------------------|--------------|---------------|
| 90 | 50 | 101 | ON | 0 |
| 91 | 51 | 101 | OFF | 0 |

#### `user_rule_events` (`UserRuleEvent`) — fire audit (replaces the old `emergency_events`; works for any rule). Index `(rule_id, fired_at)`.
| id | rule_id | triggered_value | fired_at |
|----|---------|-----------------|----------|
| 1 | 51 | "46.2" | 2026-06-26T14:40:00Z |

### Tier 5 — Pipelines (ML execution: trigger → sensors → stages → decision)

#### `pipelines` (`Pipeline`)
| id | user_id | name | enabled |
|----|---------|------|---------|
| 40 | 2 | Garage AI watch | true |

#### `pipeline_sensors` (`PipelineSensor`) — grouped read inputs + ranges. Unique `(pipeline_id, user_device_action_id)`.
| id | pipeline_id | group_name | user_device_action_id | min_value | max_value |
|----|-------------|------------|-----------------------|-----------|-----------|
| 1 | 40 | climate | 100 | 18 | 27 |
| 2 | 40 | vision | 102 | NULL | NULL |

#### `pipeline_stages` (`PipelineStage`) — ordered steps. `infer`→`ml_model_id`; `command_exec`→`execute_user_device_action_id` (value from preceding LLM structured output). Unique `(pipeline_id, ordinal)`.
| id | pipeline_id | ordinal | kind | ml_model_id | execute_user_device_action_id | config |
|----|-------------|---------|------|-------------|-------------------------------|--------|
| 70 | 40 | 1 | infer | 1 (yolo/vlm) | NULL | NULL |
| 71 | 40 | 2 | sensor_digest | NULL | NULL | NULL |
| 72 | 40 | 3 | infer | 2 (qwen/llm) | NULL | NULL |
| 73 | 40 | 4 | command_exec | NULL | 101 | NULL |

#### `pipeline_triggers` (`PipelineTrigger`) — many per pipeline (telemetry / schedule / manual)
| id | pipeline_id | trigger_type | user_device_action_id | operator | threshold_value | schedule_cron | min_interval_sec |
|----|-------------|--------------|-----------------------|----------|-----------------|---------------|------------------|
| 60 | 40 | telemetry | 102 | NULL | NULL | NULL | 30 |
| 61 | 40 | telemetry | 100 | > | 30 | NULL | 30 |

#### `pipeline_runs` (`PipelineRun`) — one execution. `trigger_payload` JSON = ML audit blob.
| id | pipeline_id | status | started_at | completed_at |
|----|-------------|--------|------------|--------------|
| 500 | 40 | completed | 2026-06-26T14:32:00Z | 2026-06-26T14:32:09Z |

#### `pipeline_run_stages` (`PipelineRunStage`) — per-stage audit trail (`input`/`output` JSON = ML blobs). Unique `(run_id, stage_id)`. Replaced the old `vlm_analysis_logs`.
| id | run_id | stage_id | status | input | output |
|----|--------|----------|--------|-------|--------|
| 1 | 500 | 70 | completed | `{"frame":"<hash>"}` | `{"detections":[{"class":"person","conf":0.94}]}` |
| 3 | 500 | 72 | completed | `{"prompt":"…"}` | `{"value":"ON","reason":"person + high temp"}` |

### Tier 6 — Telemetry

#### `sensor_history` (`SensorHistory`) — time series. `value` TEXT (scalars + base64 frames). Index `(user_device_action_id, recorded_at)`.
| id | user_device_action_id | value | recorded_at |
|----|-----------------------|-------|-------------|
| 9001 | 100 | "23.4" | 2026-06-26T14:31:55Z |
| 9002 | 102 | "/9j/4AAQSk…" (jpeg) | 2026-06-26T14:32:00Z |

---

## Notes / invariants

- **JSON is used only for genuinely freeform data**: ML audit blobs (`pipeline_runs.trigger_payload`,
  `pipeline_run_stages.input`/`output`), per-model metadata (`ml_models.classes`/`config`),
  optional per-stage overrides (`pipeline_stages.config`), and Google's external trait contract
  (`google_device_traits.valid_parameters`). All stable-shape domain data is normalized:
  instance pins → `user_device_action_pins`; rule condition params → typed columns.
- **Catalog vs instance:** `DeviceCapability` (catalog, per device model) is abstract; a user
  activates it as a `UserDeviceAction` (instance, with assigned pins + live state).
- **Rules vs pipelines:** rules are deterministic + synchronous (no ML); pipelines are the single
  ML path (async). **Emergencies are rules** with `is_emergency=true` (fast-path safety + alert),
  fired events logged in `user_rule_events` — no separate emergency tables.
- **`PipelineRun` + `PipelineRunStage` are the ML audit trail** (replaced `device_vlm_configs` +
  `vlm_analysis_logs`); a single-model analysis is a 1-stage pipeline.
- **Abstract capability-based blueprints + derive** (exportable templates) are **deferred to F10**.
- **Camera/image** is not a special table: a `UserDeviceAction` whose capability has an image
  `implementation_type`; frames flow through `sensor_history` and pipeline `infer(vlm)`.
```
