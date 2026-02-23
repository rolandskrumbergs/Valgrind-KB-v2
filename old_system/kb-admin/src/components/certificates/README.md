# Certificate Generation Components

This directory contains modular components for generating Swedish course completion certificates in PDF format.

## Architecture

The certificate generation system is split into focused, reusable modules:

### Core Files

- **`index.ts`** - Public API exports
- **`types.ts`** - TypeScript type definitions
- **`pdf-generator.ts`** - Main PDF generation orchestrator
- **`certificate-utils.ts`** - Certificate ID management and data preparation
- **`font-loader.ts`** - Font loading with fallback support
- **`colors.ts`** - Certificate color scheme definitions
- **`certificate-layout.ts`** - PDF page layout and drawing logic
- **`layout-utils.ts`** - Layout helper functions (centering, dimensions)

## Usage

### Basic Usage

```typescript
import {
  generateCertificatePDF,
  prepareCertificateData,
  generateCertificateFilename,
} from "@/components/certificates";

// Prepare certificate data
const certificatesData = await prepareCertificateData(
  userId,
  completedCourses,
  userName,
  userLastName,
);

// Generate PDF
const pdfBytes = await generateCertificatePDF(certificatesData);

// Generate filename
const filename = generateCertificateFilename(userName);
```

### API Route Example

See `src/app/api/courses/certificate/route.ts` for a complete implementation.

## Features

- **Multi-page PDFs** - One certificate page per completed course
- **Swedish Design** - Dark theme with Swedish text and date formatting
- **Custom Fonts** - Roboto Regular and Bold with Helvetica fallback
- **A4 Dimensions** - Standard A4 (595x842pt) with 40px print-safe margins
- **Certificate IDs** - Unique 9-character IDs with database persistence
- **Modular Architecture** - Easy to test, maintain, and extend

## Certificate Layout

Each certificate page includes:

1. **Logo** - "intresse bevakaren" in top-left corner
2. **Header** - "CERTIFIKAT" with cyan underline
3. **Subtitle** - "Detta intygar att" in cyan
4. **User Name** - In brackets, centered
5. **Completion Text** - "har framgångsrikt genomfört utbildningen"
6. **Course Title** - In bordered box with cyan border
7. **Star Rating** - Three gold stars (★ ★ ★)
8. **Completion Date** - Swedish format (e.g., "15 november 2025")
9. **Ribbon Seal** - Decorative seal at bottom center
10. **Footer** - "Utfärdare: Intressebevakaren AB"
11. **Certificate ID** - Right-aligned at bottom

## Color Scheme

- Background: Dark gray `rgb(0.27, 0.29, 0.33)`
- Primary Text: White `rgb(1, 1, 1)`
- Accent: Cyan `rgb(0.5, 0.8, 0.9)`
- Highlights: Gold `rgb(1, 0.84, 0)`
- Secondary: Light gray `rgb(0.85, 0.85, 0.85)`

## Fonts

- **Primary**: Roboto Regular and Bold (TTF files in `src/assets/fonts/`)
- **Fallback**: Helvetica and Helvetica Bold (PDF standard fonts)

## Database Integration

Certificate IDs are automatically generated and persisted:

- IDs are 9 characters from `crypto.randomUUID()`
- Stored in `user_courses.certificate_id` column
- Unique constraint enforced at database level
- Existing completions backfilled with IDs

## Testing

Individual components can be tested in isolation:

```typescript
import { getCenteredX } from "@/components/certificates/layout-utils";
import { getCertificateColors } from "@/components/certificates/colors";
import { loadCertificateFonts } from "@/components/certificates/font-loader";
```

## Extending

To modify the certificate design:

1. Update colors in `colors.ts`
2. Modify layout in `certificate-layout.ts`
3. Adjust dimensions in `layout-utils.ts`
4. Change fonts in `font-loader.ts`

## Dependencies

- `pdf-lib` - PDF generation library
- `node:fs` - File system access for font files
- `node:path` - Path resolution
- `node:crypto` - Certificate ID generation
