# 2. Ship CSS in cascade layers

**Status:** accepted (v0.2)

## Context

As the library grew to around 60 components with customization presets and accessibility overrides, specificity fights became likely. That's true inside the library, and between the library and users' CSS or Tailwind.

## Decision

All output sits in `@layer mg.tokens, mg.base, mg.components, mg.customize, mg.a11y`. Accessibility fallbacks and behaviour guards (closed dialogs stay closed, `[hidden]` hides) live in the last layer. `@property` rules are hoisted out of layers. An unlayered build is shipped as well.

## Consequences

- Any unlayered user rule beats the library without `!important`.
- Unlayered resets such as `a { color: inherit }` also beat component colours. Sites with such resets should use `dist/material-glass.unlayered.css`, or put their reset in a layer declared first.
- Rules in an earlier layer can't override a later layer by specificity. Guards that must win belong in `mg.a11y`.
