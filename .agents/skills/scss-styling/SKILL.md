---
name: scss-styling
description: Nexty SCSS Modules conventions — BEM, em/rem/color helpers, fluid mixins, CSS custom property tokens. Use for any .module.scss, clsx className logic, or color/spacing/typography value.
---

# SCSS Styling Conventions

## Base import
Every module starts with `@use "@/shared/styles/base" as *;` — forwards `_variables.scss`, `_functions.scss`, `_mixins.scss`, `_animations.scss`.

## Naming — BEM (kebab-case) and Conditional/multiple classNames — always via clsx
```tsx
export const Block = ({mod = 'default'}: Props) => {
   const redListItemClass = clsx(
      styles['block__list-item'],
      styles['block__list-item_red'],
      {
         [styles[`block__list-item_${mod}`]]: mod !== 'default',
      },
   );

   return (
      <Section className={styles.block}>
         <Container className={styles.block__body}>
            <ul className={styles.block__list}>
               <li className={styles['block__list-item']}></li>
               <li className={redListItemClass}></li>
            </ul>
         </Container>
      </Section>
   );
};
```
Use `&__element` and `&_modifier` for nesting inside the block's own SCSS rule.


## Sizing — no px, no inline styles, no Tailwind
- `em(20)` for component-internal sizing (scales with local font-size)
- `to-rem(20)` for layout spacing (independent of local font-size)
- Global font scales 20px desktop → 16px mobile via `dc()`/`font-size()`; em values follow automatically — avoid overriding font-size per breakpoint.

## Colors — CSS vars only
Reference via `var(--text)`, `var(--primary)`, etc. Verify the variable exists in `_variables.scss` first.

Color/unit utilities (`_functions.scss`):
```scss
darken(--primary, 20%)
lighten(--primary, 20%)
transparentize(--primary, 20%)
mix($one, $two, $amount)
```

## Responsive
Breakpoint vars live in `_variables.scss` (`$md1`…`$md4`). Use the `md()` function inside a media query:
```scss
@media (#{md($md2)}) {
   // styles
}
```

## Animations
Reusable keyframe mixins live in `_animations.scss`. Use instead of writing new `@keyframes` for common transitions.