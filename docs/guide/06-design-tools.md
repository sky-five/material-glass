---
title: Design tools and platforms
description: Figma, Penpot and Tokens Studio exports, plus Swift, Compose and Flutter tokens.
---

# Design tools and platforms

`npm run build` exports the tokens in formats design tools and other platforms can use. The files are published in the npm package and in the repository under `dist/tokens` and `dist/platforms`.

## Figma

Figma imports W3C Design Tokens (DTCG) as variables.

1. Open the Variables panel and choose **Import**.
2. Create a collection called **Material Glass**.
3. Import `dist/tokens/dtcg/color.<theme>.<mode>.tokens.json` once per mode you want. Each file becomes one mode, such as "Sea Glass Dark".
4. Import `base.tokens.json` (shape, type, motion and state) and `palette.tokens.json` into their own collections.

Effect styles can't be variables, so `dist/tokens/figma-effects.json` gives the recipe for each glass tier per theme and mode. A tier is a frame with:

- a linear-gradient fill of the glass base colour (opacity from the tier, ±8%),
- a solid tint fill,
- a background blur,
- a 1px inner shadow for the top highlight,
- a drop shadow,
- a white inside stroke at the rim opacity.

## Tokens Studio

`dist/tokens/tokens-studio.json` loads as is. It has a `base` set and one set per theme and mode, with a `$themes` entry for each, so you can switch themes in the plugin.

## Penpot

Penpot reads the same DTCG files. Use **Tokens → Import** and choose the `dtcg` folder or single files.

## iOS, Android and Flutter

Style Dictionary builds colour tokens for every theme and mode:

| Platform | File |
| --- | --- |
| iOS (UIKit) | `dist/platforms/ios/MaterialGlassSeaGlassDark.swift` |
| Android (Compose) | `dist/platforms/android/MaterialGlassSeaGlassDark.kt` |
| Flutter | `dist/platforms/flutter/material_glass_sea_glass_dark.dart` |

### SwiftUI glass

On iOS 26 and later, use the system's Liquid Glass and tint it with the theme. On earlier versions, use a material.

```swift
extension View {
  @ViewBuilder
  func mgGlass(tier: Int = 2, tint: Color = Color(MaterialGlassSeaGlassDark.colorPrimaryPrimaryContainer)) -> some View {
    if #available(iOS 26.0, *) {
      self.glassEffect(.regular.tint(tint.opacity(0.16)), in: .rect(cornerRadius: 24))
    } else {
      self.background(tier >= 3 ? .thickMaterial : .regularMaterial, in: .rect(cornerRadius: 24))
    }
  }
}
```

### Jetpack Compose glass

```kotlin
fun Modifier.mgGlass(tier: Int = 2, shape: Shape = RoundedCornerShape(24.dp)): Modifier {
  val alpha = listOf(0.34f, 0.46f, 0.58f, 0.68f, 0.78f)[tier]
  return this
    .clip(shape)
    .background(MaterialGlassSeaGlassDark.colorSurfaceSurfaceContainerLow.copy(alpha = alpha))
    .border(1.dp, Color.White.copy(alpha = 0.13f), shape)
}
// For a real backdrop blur on Android 12+, combine with RenderEffect.createBlurEffect on the content behind.
```
