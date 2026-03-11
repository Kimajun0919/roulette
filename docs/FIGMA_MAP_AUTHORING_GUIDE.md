# Figma Map Authoring Guide

## Purpose

This document defines how map scenes should be authored in Figma so they can later be imported into the roulette runtime.

The immediate goal is to make both of these workflows possible:

- Replace a full map scene.
- Replace or update only part of a map scene.

This guide is intentionally stricter than a normal design handoff. The runtime needs predictable structure, coordinates, and naming.

## Current Runtime Constraints

The current codebase already assumes a few things about maps:

- The runtime map shape data lives in `src/maps/stages.ts`.
- Physics entities use `box`, `circle`, and `polyline` only.
- A stage requires at least `title`, `goalY`, `zoomY`, and `entities`.
- The minimap uses the same entity data that the physics layer uses.
- The minimap currently assumes a stage width of `26` world units.

Relevant files:

- `src/maps/stages.ts`
- `src/engine-core/types/MapEntity.type.ts`
- `src/engine-core/physics-box2d.ts`
- `src/components/MinimapCard.tsx`

## Authoring Model

Each map in Figma should be treated as one scene.

Each scene must be a single top-level frame with this internal structure:

```text
Scene/<scene-id>
  physics/
  visuals/
  anchors/
```

Required groups:

- `physics`: objects that define actual collision and gameplay.
- `visuals`: decorative or branded elements only.
- `anchors`: named reference markers used by the importer.

Do not mix decorative shapes into `physics`.

## Coordinate System

Use one fixed conversion rule across all scenes.

Recommended baseline:

- Scene width: `2600 px`
- Runtime width: `26 world units`
- Conversion: `100 px = 1 world unit`

Rules:

- Keep the same scale for every map.
- Positive `y` goes downward.
- Keep the map centered and aligned to the same scene frame origin policy.
- If the scale ever changes, it must change globally for every scene and importer.

## Required Anchors

The `anchors` group must contain these named markers:

- `goal-y`
- `zoom-y`
- `spawn-center`

Recommended optional markers:

- `minimap-bounds`
- `camera-start`

Anchor meaning:

- `goal-y`: the y position that decides winner completion.
- `zoom-y`: the y position where the camera begins tighter focus logic.
- `spawn-center`: the initial center point used for marble spawn composition.

Until the importer is implemented, simple shapes or points are acceptable as anchor markers as long as the names are exact.

## Physics Shape Rules

Only these mappings are allowed in the `physics` group:

- Rectangle -> `box`
- Ellipse -> `circle`
- Line or flattened vector path -> `polyline`

Restrictions:

- `box` must be a plain rectangle.
- `circle` must be a perfect circle, not an ellipse.
- `polyline` must be an open path or a deliberately repeated-point path.
- Boolean groups, masks, text, images, and component instances must not be used as physics objects.
- If a vector is used for physics, it must be flattened before handoff.

Important runtime detail:

- In the runtime schema, `box.width` and `box.height` are half extents.
- In Figma, a rectangle is authored as full width and full height.
- The importer will need to convert `px -> world units -> half extents`.

## Physics Naming Contract

Each object inside `physics` must use a parseable layer name.

Recommended format:

```text
<name> | shape=<box|circle|polyline> | body=<static|kinematic> | density=<number> | restitution=<number> | angularVelocity=<number> | life=<number>
```

Example:

```text
peg-01 | shape=circle | body=static | density=1 | restitution=1.2 | angularVelocity=0
rotor-main | shape=box | body=kinematic | density=1 | restitution=0 | angularVelocity=3.5
wall-left | shape=polyline | body=static | density=1 | restitution=0 | angularVelocity=0
```

Notes:

- `shape` can be inferred from the Figma node type, but keeping it in the name makes debugging easier.
- `life` is optional. If omitted, treat it as persistent.
- If plugin data becomes available later, metadata can move out of layer names.

## Visual Layer Rules

The `visuals` group is free-form compared to `physics`, but it still needs discipline.

Allowed:

- backgrounds
- labels
- logos
- glows
- decorative frames
- non-interactive ornaments

Not allowed:

- collision-defining geometry
- hidden shapes that gameplay depends on
- anything that must stay frame-perfect with physics unless a matching physics object exists

Recommendation:

- Treat `visuals` as replaceable skin data.
- Treat `physics` as the gameplay contract.

## Scene-Level Metadata To Request From Design

For each scene, design should provide:

- scene id
- scene title
- scene version
- scene width scale confirmation
- a short note if any moving part exists

If possible, keep this in a note layer near the scene root or in a shared table outside the map frames.

## What Design Must Deliver

Minimum acceptable handoff for one scene:

- one top-level frame
- `physics`, `visuals`, `anchors` groups
- valid `goal-y`, `zoom-y`, `spawn-center`
- parseable names on every physics object
- fixed scale matching the team convention

Recommended handoff:

- scene id and version
- screenshot of intended final look
- note listing moving parts such as wheels or rotors
- note listing any intentionally fragile gameplay section

## What Design Must Avoid

Avoid these if the scene is meant to be importable:

- auto layout as gameplay structure
- unnamed layers in `physics`
- mixed decorative and collision content in one group
- arbitrary scale changes between scenes
- ellipses used where the runtime expects a circle
- complex vectors when a polyline would do
- hidden gameplay-critical shapes

## Importer Mapping Reference

Recommended importer behavior:

- Frame root -> scene
- `physics` group -> `MapEntity[]`
- `visuals` group -> optional visual schema
- `anchors/goal-y` -> `goalY`
- `anchors/zoom-y` -> `zoomY`
- `anchors/spawn-center` -> spawn metadata

Shape conversion reference:

```text
Figma Rect     -> { type: 'box', width, height, rotation }
Figma Ellipse  -> { type: 'circle', radius }
Figma Line/Vec -> { type: 'polyline', points, rotation }
```

Physics conversion reference:

```text
body=static    -> static
body=kinematic -> kinematic
```

## Copy-Paste Request For Figma

Use the following request when asking for map production:

```text
Please author each roulette map as one top-level Figma frame.
Inside each scene frame, create exactly three groups: physics, visuals, anchors.

physics:
- Only simple shapes allowed: Rect, perfect Ellipse, flattened Line/Vector
- No text, masks, booleans, components, or decorative items
- Every physics layer must use parseable naming:
  <name> | shape=<box|circle|polyline> | body=<static|kinematic> | density=<number> | restitution=<number> | angularVelocity=<number> | life=<number>

anchors:
- Include exact names: goal-y, zoom-y, spawn-center

visuals:
- Decorative only
- Keep visuals separate from physics

Use a fixed scene scale for all maps:
- 2600 px width = 26 runtime world units
- 100 px = 1 world unit
```

## Engineering Follow-Up

This guide is only the design contract. The codebase still needs these changes to fully support it:

- move from hardcoded stage arrays to a scene loader
- introduce scene ids instead of index-only map selection
- add a Figma importer that converts frames into runtime scene data
- separate gameplay physics from optional visual overlays

Until that work lands, this guide should be treated as the target authoring contract, not as a fully wired pipeline.

## Current Integration Status

The app now has the first importer-facing structure in place:

- runtime scenes are identified by scene id, not only by array index
- a scene loader can merge legacy scenes with external scene URLs
- external scene registration starts in `src/maps/externalSceneManifest.ts`
- a Figma frame importer skeleton exists in `src/maps/importers/figmaSceneImporter.ts`

Current expected external inputs:

- normalized scene JSON that already matches `SceneDef`
- raw Figma frame JSON with `physics`, `visuals`, `anchors` groups

This is still a skeleton. Before production use, the importer should be hardened for:

- stricter validation
- richer vector parsing
- plugin data support
- scene versioning rules
