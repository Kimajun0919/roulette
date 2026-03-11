# Figma Strict Import Contract

## Purpose

This document defines the strict subset that design must follow if a Figma-authored map needs to import into the runtime without manual cleanup.

This is the safe contract.

- If design stays inside this contract, the current importer can read the scene deterministically.
- Anything outside this contract may still work, but it is no longer guaranteed.

Use this document when the requirement is:

- "design it in Figma and apply it as-is"
- "handoff should not require engineering cleanup"
- "scene replacement must be repeatable"

## Accepted Delivery Formats

The runtime can consume three input formats.

### 1. Preferred: Figma wrapper JSON

This is the most explicit handoff format.

```json
{
  "sceneId": "brand-season-01",
  "sceneTitle": "Brand Season 01",
  "pxPerUnit": 100,
  "imageUrls": {
    "4b31f2d1f8f7f2be6d5d": "/scenes/assets/logo-badge.png"
  },
  "frame": {
    "id": "1:2",
    "name": "Brand Season 01",
    "type": "FRAME",
    "absoluteBoundingBox": {
      "x": 0,
      "y": 0,
      "width": 2600,
      "height": 5200
    },
    "children": []
  }
}
```

Required fields:

- `frame` or `figmaFrame`
- `sceneId`
- `pxPerUnit`

Recommended fields:

- `sceneTitle`
- `imageUrls`

### 2. Allowed: raw Figma frame JSON

This is a single `FRAME` node exported from Figma.

The root must satisfy:

- `type = "FRAME"`
- `name` exists
- `children` exists

### 3. Allowed: normalized scene JSON

Engineering can still provide a normalized runtime scene directly.

This is not the design handoff format. This is the fallback integration format.

## Fixed Scale Contract

All importable scenes must use the same fixed scale.

- scene width: `2600 px`
- runtime width: `26 world units`
- conversion: `100 px = 1 world unit`

Rules:

- never change scale per scene
- never stretch a copied scene after the base frame is created
- positive `y` points downward
- anchor and gameplay geometry must be authored at final size

## Required Scene Tree

Every importable scene must use exactly this structure:

```text
Scene/<scene-id>
  physics/
  visuals/
  anchors/
```

Rules:

- one map = one top-level frame
- `physics`, `visuals`, `anchors` must be direct children of the root frame
- group names must match exactly after trim and lowercase
- gameplay geometry must not live outside `physics`
- anchor markers must not live outside `anchors`

## Required Anchors

The `anchors` group must contain these exact names:

- `goal-y`
- `zoom-y`
- `spawn-center`

Optional but supported:

- `minimap-bounds`
- `camera-start`

Anchor authoring rules:

- use simple rectangles or circles as markers
- keep them visible during handoff
- do not rename with suffixes or prefixes
- one marker per name

## Guaranteed Physics Contract

If the map must play correctly, treat `physics` as the source of truth.

### Allowed physics node types

- `RECTANGLE`
- `ELLIPSE`
- `LINE`

Allowed with caution:

- `VECTOR`

Not guaranteed:

- `BOOLEAN_OPERATION`
- `FRAME`
- `INSTANCE`
- `COMPONENT`
- `COMPONENT_SET`
- `STAR`
- `POLYGON`
- text
- image fills
- masks

### Physics shape mapping

- `RECTANGLE` -> `box`
- perfect `ELLIPSE` -> `circle`
- `LINE` -> `polyline`
- flattened `VECTOR` with explicit points -> `polyline`

### Physics geometry rules

- rectangle must be axis-aligned in authoring unless rotation is truly required
- ellipse must be a perfect circle if intended as `circle`
- line must have at least 2 points
- vector must already be flattened before export
- physics geometry must not rely on clipping, masking, or boolean appearance

### Physics naming contract

Every physics node name must follow this format:

```text
<name> | body=<static|kinematic> | density=<number> | restitution=<number> | angularVelocity=<number> | life=<number>
```

Example:

```text
peg-01 | body=static | density=1 | restitution=1.2 | angularVelocity=0
rotor-main | body=kinematic | density=1 | restitution=0 | angularVelocity=3.5
wall-left | body=static | density=1 | restitution=0 | angularVelocity=0
```

Rules:

- `body` is required
- `density` is required
- `restitution` is required
- `angularVelocity` is required for moving rotors, otherwise set `0`
- `life` is optional

## Guaranteed Visual Contract

If the goal is "apply the finished Figma design with no cleanup", stay inside this subset.

### Allowed visual node types

- `RECTANGLE`
- `ELLIPSE`
- `LINE`
- `TEXT`
- flattened `VECTOR`
- image-backed `RECTANGLE`
- image-backed `ELLIPSE`

Allowed as containers only:

- `FRAME`

Not guaranteed:

- `INSTANCE`
- `COMPONENT`
- `COMPONENT_SET`
- `BOOLEAN_OPERATION`
- `STAR`
- `POLYGON`
- auto layout as a required behavior
- nested masks with complex interactions

### Guaranteed fills and strokes

Guaranteed:

- solid fill
- linear gradient
- radial gradient
- one visible stroke
- image paint with an external image mapping

Allowed but not guaranteed:

- angular gradient
- diamond gradient
- multiple paints layered together

### Guaranteed effects

Guaranteed:

- drop shadow
- layer blur

Supported but not guaranteed to match Figma exactly:

- inner shadow
- background blur

Do not use for guaranteed handoff:

- effect stacks that depend on subtle compositing parity
- background blur on dense overlapping layers
- inner shadow as a gameplay-significant cue

### Guaranteed blend and masking rules

Guaranteed:

- normal blend
- no mask
- no clip dependency

Supported but not guaranteed:

- blend mode subset
- `clipsContent`
- `isMask`

If the scene must import without cleanup:

- do not rely on blend modes
- do not rely on masking
- do not rely on clip-driven composition

## Image Asset Rules

If a visual uses image paint, the handoff must also include a mapping from `imageRef` to a usable URL or asset path.

Required:

- exported image file
- stable file name
- wrapper JSON `imageUrls` mapping

Recommended formats:

- `png`
- `jpg`
- `svg` only for simple branding art

Rules:

- do not hand off image paint without the matching exported asset
- do not assume the runtime can fetch private Figma CDN URLs later
- keep asset names stable across revisions

## Visual Collider Proxy Rules

This exists for prototypes only.

A node inside `visuals` may create a collider proxy if the name includes:

- `body=static` or `body=kinematic`
- optional `collider=box|circle|polyline`

Example:

```text
dummy-card | body=static | collider=box
dummy-ring | body=static | collider=circle
```

Rules:

- do not use this for production gameplay unless agreed explicitly
- keep production collision in `physics`

## What Design Must Never Do

If the goal is deterministic import, avoid all of these:

- change the scale per scene
- rename `physics`, `visuals`, `anchors`
- put gameplay shapes in `visuals`
- put decorative shapes in `physics`
- hide gameplay-critical layers
- use booleans to define required physics
- use auto layout as a gameplay dependency
- rely on unsupported effect parity
- rely on mask behavior for gameplay meaning
- hand off image paint without exported assets

## Safe Example Scene Skeleton

```text
Scene/brand-season-01
  physics/
    wall-left | body=static | density=1 | restitution=0 | angularVelocity=0
    wall-right | body=static | density=1 | restitution=0 | angularVelocity=0
    peg-01 | body=static | density=1 | restitution=1.1 | angularVelocity=0
    rotor-main | body=kinematic | density=1 | restitution=0 | angularVelocity=3.5
  visuals/
    bg-panel
    title-label
    sponsor-logo
    accent-line
  anchors/
    goal-y
    zoom-y
    spawn-center
    minimap-bounds
    camera-start
```

## Safe Visual Naming Recommendations

Visual names do not need a strict schema, but these keys are safe when needed:

```text
<name> | layer=<world|screen> | zIndex=<number> | opacity=<number> | fontSize=<number> | align=<left|center|right> | src=<url>
```

Use these only when the visual needs explicit override behavior.

## Design Handoff Checklist

Before design hands off one scene, confirm all of these:

- [ ] root is one `FRAME`
- [ ] root children include `physics`, `visuals`, `anchors`
- [ ] scale is `2600 px = 26 units`
- [ ] `goal-y`, `zoom-y`, `spawn-center` exist exactly once
- [ ] every physics node uses parseable metadata
- [ ] every required image paint has exported asset + mapping
- [ ] gameplay collision lives in `physics`
- [ ] no scene-critical behavior depends on mask or advanced effect parity

## Engineering Intake Checklist

Before engineering registers a design handoff, confirm all of these:

- [ ] payload is wrapper JSON or raw Figma `FRAME`
- [ ] `sceneId` is stable and slug-safe
- [ ] `pxPerUnit = 100`
- [ ] image URLs are resolvable
- [ ] anchors are present
- [ ] imported scene width resolves to `26`
- [ ] gameplay blockers exist as `entities`

## Copy-Paste Request To Design

```text
Please build this roulette map inside the strict import contract.

Required:
- one top-level FRAME per map
- three direct child groups: physics, visuals, anchors
- fixed scale: 2600 px = 26 world units, 100 px = 1 unit
- exact anchors: goal-y, zoom-y, spawn-center
- physics only uses RECTANGLE, perfect ELLIPSE, or LINE
- every physics node name must include:
  <name> | body=<static|kinematic> | density=<number> | restitution=<number> | angularVelocity=<number> | life=<number>
- visuals only use safe subset: RECTANGLE, ELLIPSE, LINE, TEXT, flattened VECTOR, and image-backed simple shapes
- if image paint is used, also provide exported assets plus imageRef -> URL mapping

Do not rely on:
- booleans for physics
- masks for required behavior
- auto layout as gameplay structure
- per-scene scale changes
- advanced effect parity
```
