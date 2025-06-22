# React Rendering Best Practices

## Common Causes of "Objects are not valid as a React child"

1. **Prisma Decimal Types**
   - Appears as: {s, e, d}
   - Fix: Convert to number with `.toNumber()` or `parseFloat()`

2. **BigInt Values**
   - Fix: Convert to string with `.toString()`

3. **Date Objects**
   - Fix: Format with `.toISOString()` or date formatter

4. **User/Author Relations**
   - Fix: Select only needed fields, not entire object

## Prevention Strategies

### 1. Always Serialize API Responses
```typescript
return NextResponse.json({
  data: serializeForJSON(data)
})
```

### 2. Type Your Data Properly
```typescript
interface Chapter {
  chapterNumber: number | string // Not Decimal
  author: string // Not User object
}
```

### 3. Safe Rendering Patterns
```jsx
// Bad
<span>{chapter.chapterNumber}</span>

// Good
<span>{formatChapterNumber(chapter.chapterNumber)}</span>
```

### 4. Add Fallbacks
```jsx
// Safe number display
{typeof value === 'number' ? value : String(value)}
```

### 5. Debug Rendering Issues
```jsx
console.log('Type:', typeof value);
console.log('Value:', value);
console.log('Keys:', Object.keys(value));
```

## Prisma Schema Best Practices

1. Use appropriate types:
   - `Int` for whole numbers
   - `Float` for decimals (not Decimal unless needed)
   - `String` for text

2. Select only what you need:
   ```typescript
   select: {
     id: true,
     title: true,
     author: true // Not authorData relation
   }
   ```

3. Transform in queries:
   ```typescript
   const chapters = await prisma.chapter.findMany({
     select: {
       chapterNumber: true
     }
   }).then(chapters => 
     chapters.map(ch => ({
       ...ch,
       chapterNumber: ch.chapterNumber.toNumber()
     }))
   )
   ```
