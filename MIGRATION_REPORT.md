# Editor Migration Readiness Report

## Executive Summary
The prosemirror-blocknote-test editor has been successfully refactored and aligned with the main StridOS application. However, there are critical schema misalignments and structural differences that need to be addressed before migration.

## 🔴 Critical Issues

### 1. Schema Misalignment - Documents Table
**Issue**: The schema structures are fundamentally different between the two projects.

**Test Project (prosemirror-blocknote-test)**:
- Simple document structure
- Fields: `title`, `createdAt`, `ownerId`, `archivedAt`, `shareId`, `publishedAt`, `templateId`, `templateKey`
- No project/client/department relationships

**Main App (StridOS)**:
- Complex document structure with business context
- Additional fields: `projectId`, `clientId`, `departmentId`, `documentType`, `status`, `metadata`
- Required relationships to projects, clients, and departments

**Impact**: Direct migration will fail due to missing required fields and relationships.

### 2. Schema Misalignment - DocumentPages Table
**Issue**: Both apps have `documentPages` table but with different purposes and relationships.

**Test Project**:
- Clean hierarchy for editor pages
- Fields match what the editor expects

**Main App**:
- Same structure exists
- Properly indexed

**Status**: ✅ This table appears aligned and ready.

### 3. User Schema Differences
**Test Project**:
- Simplified user structure
- Basic fields: `email`, `name`, `role`, `status`

**Main App**:
- Complex user structure with organization context
- Additional fields: `organizationId`, `clientId`, `departmentIds`, `jobTitle`, `timezone`, etc.
- Different role types: `admin`, `pm`, `task_owner`, `client`

**Impact**: User context and permissions will need mapping.

## ✅ Aligned Components

### 1. Core Dependencies
Both projects share the same core editor dependencies:
- `@blocknote/core: ^0.35.0`
- `@blocknote/react: ^0.35.0`
- `@blocknote/shadcn: ^0.35.0`
- `@convex-dev/prosemirror-sync: 0.1.27`
- `convex: ^1.25.4`
- `emoji-picker-react: ^4.13.2`

### 2. Comments System
Both projects have similar comment structures with:
- Thread-based commenting
- Block-level comments
- Resolution status
- Target type/ID for cross-context support

## ⚠️ Dependencies Comparison

### Additional Dependencies in Main App
The main app has many additional dependencies not present in the test project:
- UI Libraries: Multiple Radix UI components, Tabler icons, Recharts
- Utilities: date-fns, motion, next-themes, sonner, vaul
- Data Management: @tanstack/react-table, yjs, y-websocket
- Drag & Drop: @dnd-kit/*, @hello-pangea/dnd

**Impact**: These won't conflict but indicate the main app has more complex UI requirements.

### Version Discrepancies
- `lucide-react`: Test has `^0.539.0`, Main has `^0.533.0` (minor difference)
- TypeScript and build tools have minor version differences

## 📋 Migration Checklist

### Phase 1: Schema Alignment (Required Before Migration)

- [ ] **Update Test Project Documents Schema**
  - Add `projectId`, `clientId`, `departmentId` fields (make optional initially)
  - Add `documentType` and `status` fields with proper enums
  - Add `metadata` object field for flexibility

- [ ] **Create Migration Scripts**
  - Script to map existing documents to new schema
  - Default values for required fields
  - Relationship mapping for existing documents

### Phase 2: Component Preparation

- [ ] **Extract Editor Components**
  - `/src/components/editor/` entire directory
  - `/src/hooks/editor/` hooks
  - `/src/app/editor/` pages

- [ ] **Identify Shared Dependencies**
  - Comment system components
  - Presence/collaboration features
  - Custom blocks and schema

### Phase 3: Integration Steps

1. **Copy Editor Components**
   - Move editor components to main app
   - Update import paths
   - Ensure Convex API alignment

2. **Update Routing**
   - Main app uses `/editor/[documentId]` pattern
   - Test project uses `/editor/[id]` pattern
   - Align route parameters

3. **Merge Custom Blocks**
   - Test project has: alert, datatable, metadata, weekly-update blocks
   - Main app has: alert, section-header, overview, project-info blocks
   - Consolidate and deduplicate

4. **Handle Legacy Editor**
   - Main app has `/legacy-editor/` components
   - Plan deprecation path
   - Ensure no conflicts during transition

### Phase 4: Testing & Validation

- [ ] Test document creation with proper context
- [ ] Verify collaboration features
- [ ] Test comment system integration
- [ ] Validate permission handling
- [ ] Performance testing with larger documents

## Recommendations

### Immediate Actions Required

1. **Schema Alignment First**
   - The document schema MUST be aligned before any code migration
   - Add missing fields to test project schema
   - Create data migration scripts

2. **Create Feature Flags**
   - Add feature flag for new editor in main app
   - Allow gradual rollout and testing
   - Maintain fallback to legacy editor

3. **Build Integration Layer**
   - Create adapter functions for schema differences
   - Map test project's simple structure to main app's complex structure
   - Handle missing relationships gracefully

### Migration Approach

**Recommended: Gradual Integration**
1. First add schema fields to test project
2. Test with sample data from main app
3. Create new `/editor-v2/` route in main app
4. Run both editors in parallel initially
5. Migrate users gradually
6. Deprecate legacy editor after validation

**Not Recommended: Direct Replacement**
- Too many schema differences
- Risk of data loss or corruption
- No rollback path

## Conclusion

The editor refactoring is complete and well-structured, but **the projects are NOT ready for direct migration** due to schema misalignments. The main blockers are:

1. Document schema differences (missing business context fields)
2. User/permission model differences
3. Project/client/department relationships

With proper schema alignment and migration scripts, the integration should be straightforward since the core editor dependencies and patterns are already aligned.

**Estimated Timeline**: 
- Schema alignment: 2-3 days
- Integration and testing: 3-5 days
- Gradual rollout: 1-2 weeks

## Next Steps

1. Review this report with the team
2. Decide on schema alignment strategy
3. Create migration scripts
4. Set up feature flags in main app
5. Begin gradual integration