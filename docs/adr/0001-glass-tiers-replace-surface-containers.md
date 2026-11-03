# 1. Glass tiers replace surface containers

**Status:** accepted (v0.1)

## Context

Material 3 expresses elevation with five surface-container colours, from lowest to highest. A glass system needs depth too, but tinting translucent surfaces by elevation makes them muddy, and shadows alone read poorly on glass.

## Decision

There are five glass tiers, `mg-glass-0` to `mg-glass-4`, mapped one to one to the surface-container levels. Each tier raises blur, opacity, specular highlight and shadow together. Each tier's solid fallback is exactly its matching surface container.

## Consequences

- Elevation reasoning from Material 3 carries over unchanged.
- Reduced transparency, high contrast, forced colours and unsupported browsers get a faithful Material layout for free.
- Contrast can be tested per tier, at the thinnest point of the gradient, over each theme backdrop.
