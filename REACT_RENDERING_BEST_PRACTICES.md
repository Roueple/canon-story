REACT_RENDERING_BEST_PRACTICES.md
The documentation has been completely rewritten to reflect the new, enforced architectural pattern of serialization at the boundary, providing clear "Do this / Don't do this" examples.
Generated markdown
# React Rendering Best Practices & Data Serialization

This document outlines the mandatory data serialization patterns to prevent runtime errors like "Objects are not valid as a React child" which arise from passing non-serializable data from Server Components to Client Components.

## The Golden Rule: Serialize at the Boundary

All data fetched on the server (in API Routes or Server Components) **MUST** be serialized before being passed to a Client Component or sent in an API response. This is not optional; it is an enforced architectural pattern.

**Why?**
Prisma returns special object types for certain data fields which are not valid for JSON serialization or as React children:
-   `Decimal`: For precise numbers like `chapterNumber`.
-   `BigInt`: For large numbers like `totalViews`.
-   `Date`: Standard JavaScript `Date` objects.

These must be converted to `number`, `string`, and `string (ISO 8601)` respectively.

## How We Enforce Serialization

### 1. For API Routes (`src/app/api/**`)

All API routes **MUST** use the response helpers from `src/lib/api/utils.ts`.

-   `successResponse(data)`: For successful non-paginated responses.
-   `paginatedResponse(data, ...)`: For successful paginated responses.
-   `errorResponse(message)`: For errors.

These helpers automatically call `serializeForJSON` on the data, ensuring all responses are safe.

**Example: DO THIS**
```typescript
// src/lib/api/utils.ts
import { successResponse } from '@/lib/api/utils';
import { novelService } from '@/services/novelService';

export async function GET(req, { params }) {
  const novel = await novelService.findById(params.id);
  // successResponse handles serialization automatically.
  return successResponse(novel);
}
Use code with caution.
Markdown
Example: DO NOT DO THIS
Generated typescript
// ANTI-PATTERN: Direct use of NextResponse.json bypasses our serializer.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req, { params }) {
  const novel = await prisma.novel.findUnique({ where: { id: params.id } });
  // THIS WILL CRASH if the novel contains Decimal, BigInt, or Date objects.
  return NextResponse.json(novel);
}
Use code with caution.
TypeScript
2. For Server Components (page.tsx, layout.tsx)
When fetching data in a Server Component that will be passed as props to a Client Component, you MUST wrap the data in serializeForJSON from src/lib/serialization.ts.
Most of our data fetching is encapsulated within services (e.g., novelService.ts). All service methods that return data are required to apply serializeForJSON before returning. This centralizes the logic and makes Server Components cleaner.
Example: Correct Service Implementation
Generated typescript
// src/services/novelService.ts
import { prisma } from '@/lib/db';
import { serializeForJSON } from '@/lib/serialization';

export const novelService = {
  async findById(id: string) {
    const novel = await prisma.novel.findUnique({ where: { id } });
    // Serialization happens here, inside the service.
    return serializeForJSON(novel);
  }
}
Use code with caution.
TypeScript
Example: Correct Server Component Usage
Generated typescript
// src/app/novels/[id]/page.tsx (Server Component)
import { novelService } from '@/services/novelService';
import { EditNovelForm } from '@/components/forms/EditNovelForm'; // Client Component

export default async function EditNovelPage({ params }) {
  // The service returns already-serialized data.
  const novel = await novelService.findById(params.id);

  // It is now safe to pass this `novel` object as a prop.
  return <EditNovelForm novel={novel} />;
}
Use code with caution.
TypeScript
Summary
API Routes: Use successResponse and paginatedResponse.
Services: All data-returning methods must call serializeForJSON before returning.
Server Components: Rely on services to provide pre-serialized data. If fetching data directly, manually use serializeForJSON before passing props to Client Components.
Following this pattern universally eliminates a whole class of critical runtime errors and makes the codebase more stable and predictable.