# CSS Framework to Raw CSS Migration Plan

## Overview

Migrate the Glyph Potluck web application from using Tailwind CSS utility classes to a custom raw CSS architecture organized in `src/styles/` directory.

## Baseline Knowledge

### Current State Analysis

- **Framework**: Currently using Tailwind CSS utility classes extensively throughout components
- **Existing CSS**:
  - `src/index.css` - Contains comprehensive CSS custom properties, utility classes, and component styles (628 lines)
  - `src/fonts.css` - Contains GeistMono font-face declarations (63 lines)
- **Styling Patterns**: Heavy reliance on utility classes like `className="bg-white rounded-lg shadow-sm border p-6"`
- **Components**: 19+ React components using Tailwind classes extensively

### Key Files Requiring Updates

- All components in `src/components/` (19+ files)
- `src/App.tsx`
- `src/main.tsx` (import statements)
- `src/index.css` (refactor existing styles)
- `src/fonts.css` (move to new structure)

### Dependencies

- No external CSS framework dependencies in `package.json`
- Vite build system for CSS processing
- React components using `className` prop extensively

## Type Definitions

### New CSS Architecture

```typescript
// src/styles/index.css - Main entry point
// src/styles/base.css - CSS reset, typography, base styles
// src/styles/components.css - Component-specific styles
// src/styles/layout.css - Layout utilities and grid systems
// src/styles/utilities.css - Utility classes (spacing, colors, etc.)
// src/styles/fonts.css - Font declarations
// src/styles/variables.css - CSS custom properties
```

### Component Class Naming Convention

```typescript
// BEM methodology for component classes
// .component-name
// .component-name__element
// .component-name--modifier
// .component-name__element--modifier
```

## Implementation Order

### Phase 1: CSS Architecture Setup

1. **Create `src/styles/` directory structure**

   - Create base CSS files with proper organization
   - Move existing CSS custom properties to `variables.css`
   - Move font declarations to `fonts.css`

2. **Extract and organize existing styles**
   - Convert utility classes from `index.css` to organized modules
   - Create component-specific styles from existing patterns
   - Maintain all existing visual design and functionality

### Phase 2: Component Migration

3. **Update main entry points**

   - Update `src/main.tsx` to import new CSS structure
   - Update `src/App.tsx` if needed

4. **Migrate core layout components**

   - `MainInterface.tsx` - Main layout and header
   - `FontCreationInterface.tsx` - Primary interface layout
   - `CharacterUploadGrid.tsx` - Grid layout and character tiles

5. **Migrate UI components**

   - `CharacterTile.tsx` - Character tile styling and states
   - `FileDropzone.tsx` - Dropzone styling and interactions
   - `FontSettingsPanel.tsx` - Form styling and tabs
   - `FontPreview.tsx` - Preview panel styling

6. **Migrate remaining components**
   - All other components in `src/components/`
   - Ensure consistent styling patterns

### Phase 3: Cleanup and Optimization

7. **Remove Tailwind dependencies**

   - Remove any Tailwind-specific imports
   - Clean up unused CSS
   - Optimize CSS file sizes

8. **Testing and validation**
   - Verify all components render correctly
   - Test responsive behavior
   - Validate accessibility features

## Integration Points

### CSS Import Structure

```typescript
// src/main.tsx
import './styles/index.css'

// src/styles/index.css
@import './variables.css';
@import './fonts.css';
@import './base.css';
@import './layout.css';
@import './components.css';
@import './utilities.css';
```

### Component Class Mapping

```typescript
// Before (Tailwind)
className = "bg-white rounded-lg shadow-sm border p-6";

// After (Custom CSS)
className = "card";
```

### Responsive Design

- Maintain existing responsive breakpoints
- Convert Tailwind responsive prefixes to CSS media queries
- Ensure mobile-first approach is preserved

### State-based Styling

- Convert Tailwind state classes (`hover:`, `focus:`, etc.) to CSS pseudo-classes
- Maintain all interactive states and animations
- Preserve loading states and transitions

## Success Criteria

### Functionality

- [ ] All components render identically to current design
- [ ] All interactive states work (hover, focus, active, disabled)
- [ ] All animations and transitions function correctly
- [ ] Responsive design works across all breakpoints
- [ ] Loading states and progress indicators display properly

### Performance

- [ ] CSS bundle size is optimized (target: <50KB gzipped)
- [ ] No unused CSS rules remain
- [ ] CSS loads efficiently without blocking render

### Maintainability

- [ ] CSS is well-organized and documented
- [ ] Component styles are modular and reusable
- [ ] CSS follows consistent naming conventions
- [ ] Easy to add new components following established patterns

### Accessibility

- [ ] Focus states are preserved and visible
- [ ] Color contrast ratios are maintained
- [ ] Screen reader compatibility is preserved
- [ ] Keyboard navigation works correctly

## Risk & Rollback

### Risks

1. **Visual regressions** - Components may not render identically
2. **Performance impact** - CSS bundle size could increase
3. **Maintenance overhead** - Custom CSS requires more maintenance than utility classes
4. **Development velocity** - Slower initial development without utility classes

### Mitigation Strategies

1. **Incremental migration** - Migrate one component at a time
2. **Visual testing** - Compare before/after screenshots
3. **CSS optimization** - Use tools to remove unused styles
4. **Documentation** - Create style guide for future development

### Rollback Plan

1. **Git branches** - Keep current implementation in separate branch
2. **Component-level rollback** - Can revert individual components if needed
3. **CSS fallback** - Keep original `index.css` as backup during migration
4. **Quick revert** - Single commit to restore Tailwind approach if needed

## Implementation Timeline

### Week 1: Foundation

- Day 1-2: Create CSS architecture and move existing styles
- Day 3-4: Migrate 3-4 core components
- Day 5: Testing and refinement

### Week 2: Core Components

- Day 1-3: Migrate remaining UI components
- Day 4-5: Responsive design and state management

### Week 3: Polish and Optimization

- Day 1-2: Performance optimization and cleanup
- Day 3-4: Testing and bug fixes
- Day 5: Documentation and final review

## Notes

### Design System Preservation

- Maintain exact visual appearance of current design
- Preserve all color schemes, typography, and spacing
- Keep all animations and micro-interactions
- Maintain accessibility standards

### Future Considerations

- Consider CSS-in-JS alternatives for component-specific styles
- Evaluate CSS modules for better encapsulation
- Plan for design system evolution and maintenance
- Consider CSS custom properties for theming capabilities
