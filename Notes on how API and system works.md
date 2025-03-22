As a friendly reminder, this is the API documentation we're trying to hit.
@https://docs.api.bible/tutorials/getting-a-specific-verse 
@https://docs.api.bible/tutorials/getting-a-list-of-verses 
@https://docs.api.bible/tutorials/getting-a-list-of-chapters 
@https://docs.api.bible/tutorials/getting-a-list-of-books 

# How we use the BIBLE API (simplified)

The Bible API requires a two-step process to fetch verses:

1. First, get a list of verses for a chapter (metadata only)
2. Then, fetch the actual content for each verse individually

# How we use the BIBLE API (longer description)

## API Structure

The Bible API (api.scripture.api.bible) is structured hierarchically:
- Bibles (versions like KJV) -> Books -> Chapters -> Verses

Our current implementation uses the KJV Bible (ID: de4e12af7f28f599-01).

## Fetching Verses

### Step 1: Get Verse List
```typescript
GET /bibles/{bibleId}/chapters/{bookId}.{chapterNum}/verses
```
This returns metadata for each verse, including:
- id (e.g., "GEN.1.1")
- reference (e.g., "Genesis 1:1")
- bookId, chapterId, etc.

### Step 2: Get Verse Content
For each verse, make a separate request:
```typescript
GET /bibles/{bibleId}/verses/{verseId}?content-type=text&include-notes=false&include-verse-numbers=false&include-chapter-numbers=false
```

Important query parameters:
- content-type=text: Get plain text instead of HTML
- include-notes=false: Exclude footnotes
- include-verse-numbers=false: Remove verse numbers from content
- include-chapter-numbers=false: Remove chapter numbers from content

## Implementation Details

1. Our frontend makes requests through a proxy endpoint (/api/bible) that adds the API key
2. We use TypeScript interfaces to ensure type safety:
   ```typescript
   interface VerseMetadata {
     id: string;
     orgId: string;
     bookId: string;
     chapterId: string;
     bibleId: string;
     reference: string;
   }

   interface Verse extends VerseMetadata {
     content: string;
   }
   ```

3. The process is handled in two functions:
   - loadVerses(): Gets the initial list of verses
   - loadVerseContent(): Fetches content for each individual verse

## Error Handling

- We check response.ok for each API call
- We validate the response data structure
- We provide fallbacks for missing content
- Errors are displayed to the user with clear messages

How we cache the Bible API in Firebase and call it correctly (this might need to be filled out later as we don't have this setup yet I don't think.)