# Global Collapsible Card Sub-Header System Implementation Plan

## Overview

This document outlines the implementation of a global collapsible card sub-header system. Cards can have an optional collapsible section that contains secondary content, triggered by a chevron icon button in the card header. This improves space efficiency and visual hierarchy by allowing users to expand/collapse detailed controls and information.

## Current State Analysis

### Card Structure Patterns

1. **Card Header Usage:**
   - Most cards use `.card-header` with flex justify-between layout
   - Headers contain titles and sometimes action buttons
   - No existing collapsible functionality

2. **Content Organization:**
   - Cards have primary content immediately visible
   - Some cards have secondary controls/filters that could benefit from collapsing
   - Character Set card has multiple control sections that clutter the interface

3. **Character Set Card Specifics:**
   - **Character Set Selector**: Dropdown for choosing character sets
   - **Character Progress Container**: Upload stats and progress bar
   - **Character Grid Filters**: Category buttons (All, Uppercase, Lowercase, etc.)
   - **Character Grid**: The actual grid of character tiles

### Problems Identified

1. **Visual Clutter**: Character Set card has many controls competing for attention
2. **Poor Space Utilization**: Secondary controls take up space even when not actively used
3. **Inconsistent Interaction Patterns**: No standard way to hide/show secondary content
4. **Missing Global Icon System**: No reusable chevron/collapse icons

## Proposed Design System

### Global Chevron Icon System

```css
/* Chevron Icon Base Classes */
.chevron-icon {
  width: 1rem;
  height: 1rem;
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.chevron-icon--down {
  transform: rotate(0deg);
}

.chevron-icon--up {
  transform: rotate(180deg);
}

.chevron-icon--right {
  transform: rotate(-90deg);
}

.chevron-icon--left {
  transform: rotate(90deg);
}

/* Icon Button for Collapse Triggers */
.collapse-trigger {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  transition: all var(--transition-fast);
}

.collapse-trigger:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}

.collapse-trigger:focus {
  outline: 2px solid var(--accent-color-base);
  outline-offset: 2px;
}
```

### Collapsible Sub-Header System

```css
/* Collapsible Sub-Header Container */
.card-subheader {
  border-bottom: 1px solid var(--gray-200);
  background: var(--gray-50);
  overflow: hidden;
  transition: all var(--transition-normal);
}

.card-subheader--collapsed {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  border-bottom-width: 0;
}

.card-subheader--expanded {
  max-height: 1000px; /* Sufficient for most content */
  padding-top: var(--space-4);
  padding-bottom: var(--space-4);
}

/* Sub-Header Content Layout */
.card-subheader-content {
  padding-left: var(--space-4);
  padding-right: var(--space-4);
}

/* Header with Collapse Trigger */
.card-header--collapsible {
  position: relative;
}

.collapse-trigger--header {
  position: absolute;
  right: var(--space-2);
  top: 50%;
  transform: translateY(-50%);
}
```

## Implementation Strategy

### Phase 1: Global Icon System

1. **Add Chevron Icon Classes:**
   - Create CSS classes for chevron icons in different orientations
   - Ensure consistent sizing and styling
   - Add hover/focus states for accessibility

2. **Add Collapse Trigger Button:**
   - Create reusable button component for triggering collapse/expand
   - Include proper accessibility attributes (aria-expanded, aria-controls)
   - Add keyboard navigation support

### Phase 2: Collapsible Sub-Header CSS

1. **Base Collapsible Classes:**
   - Add `.card-subheader` and state variants
   - Implement smooth height transitions
   - Ensure proper spacing and visual hierarchy

2. **Responsive Behavior:**
   - Consider mobile-first approach
   - Ensure touch targets meet accessibility standards
   - Test animations on various screen sizes

### Phase 3: Character Set Card Integration

1. **Structural Changes:**
   - Wrap collapsible content in `.card-subheader`
   - Add collapse trigger button to header
   - Implement expand/collapse state management

2. **Content Organization:**
   - Character set selector in collapsible area
   - Progress container in collapsible area
   - Grid filters in collapsible area
   - Keep character grid always visible

## Implementation Examples

### Before: Character Set Card

```tsx
<div className="card character-management-card">
  <div className="card-header">
    <h3 className="card-heading">Character Set</h3>
  </div>

  {/* Always visible character set selector */}
  <div className="character-selector-progress-container">
    <div className="character-set-section">
      <select className="form-select">...</select>
    </div>
    <div className="character-progress-container">
      {/* Progress stats */}
    </div>
  </div>

  {/* Always visible filters */}
  <div className="character-grid-section">
    <div className="character-grid-filters">
      {/* Filter buttons */}
    </div>
    <div className="character-grid">
      {/* Grid content */}
    </div>
  </div>
</div>
```

### After: Character Set Card with Collapsible Sub-Header

```tsx
<div className="card character-management-card">
  <div className="card-header card-header--collapsible">
    <h3 className="card-heading">Character Set</h3>
    <button
      className="collapse-trigger collapse-trigger--header"
      aria-expanded={isExpanded}
      aria-controls="character-set-subheader"
    >
      <span className={`chevron-icon ${isExpanded ? 'chevron-icon--up' : 'chevron-icon--down'}`}></span>
    </button>
  </div>

  {/* Collapsible Sub-Header */}
  <div
    id="character-set-subheader"
    className={`card-subheader ${isExpanded ? 'card-subheader--expanded' : 'card-subheader--collapsed'}`}
  >
    <div className="card-subheader-content">
      {/* Character set selector */}
      <div className="character-set-section">
        <select className="form-select">...</select>
      </div>

      {/* Progress container */}
      <div className="character-progress-container">
        {/* Progress stats */}
      </div>

      {/* Grid filters */}
      <div className="character-grid-filters">
        {/* Filter buttons */}
      </div>
    </div>
  </div>

  {/* Always visible character grid */}
  <div className="character-grid">
    {/* Grid content */}
  </div>
</div>
```

## Technical Implementation Details

### State Management

```tsx
const [isSubheaderExpanded, setIsSubheaderExpanded] = useState(true);

const toggleSubheader = () => {
  setIsSubheaderExpanded(!isSubheaderExpanded);
};
```

### Accessibility Considerations

1. **ARIA Attributes:**
   - `aria-expanded`: Indicates current state
   - `aria-controls`: Links trigger to controlled content
   - `aria-labelledby`: Links content to header

2. **Keyboard Navigation:**
   - Enter/Space to toggle
   - Focus management when expanding/collapsing
   - Screen reader announcements

3. **Visual Indicators:**
   - Clear chevron direction changes
   - Smooth transitions for state changes
   - Focus rings on interactive elements

## Responsive Considerations

1. **Mobile Behavior:**
   - Sub-headers collapsed by default on small screens
   - Larger touch targets for collapse triggers
   - Consider single-column layouts

2. **Desktop Behavior:**
   - Sub-headers expanded by default
   - Hover states for better UX
   - Keyboard shortcuts if appropriate

## Implementation Timeline

### Week 1: Foundation
- [ ] Add chevron icon CSS classes
- [ ] Create collapse trigger button styles
- [ ] Implement collapsible sub-header base classes
- [ ] Test animations and transitions

### Week 2: Character Set Integration
- [ ] Update Character Set card structure
- [ ] Add state management for collapse/expand
- [ ] Implement proper content organization
- [ ] Test accessibility and responsive behavior

### Week 3: Enhancement & Polish
- [ ] Add smooth animations and micro-interactions
- [ ] Implement keyboard navigation
- [ ] Cross-browser testing
- [ ] Performance optimization

## Success Metrics

1. **Improved UX**: Cleaner initial card view with controls hidden by default
2. **Space Efficiency**: Better use of screen real estate
3. **Consistency**: Reusable patterns across all cards that need collapsible content
4. **Accessibility**: Full keyboard and screen reader support
5. **Performance**: Smooth animations without layout thrashing

## Risks & Mitigations

1. **Animation Performance**: Use transform-based animations instead of height changes
2. **Content Jumping**: Ensure proper spacing calculations
3. **State Persistence**: Consider remembering user preferences
4. **Mobile UX**: Test extensively on touch devices

## Future Considerations

1. **Multiple Sub-Headers**: Support for cards with multiple collapsible sections
2. **Auto-Collapse**: Automatically collapse after periods of inactivity
3. **Animation Variants**: Different transition styles for different use cases
4. **Nested Collapsibles**: Support for nested expandable content
