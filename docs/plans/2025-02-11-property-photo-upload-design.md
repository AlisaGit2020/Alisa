# Property Photo Upload for New Properties

**Date:** 2025-02-11
**Status:** Approved

## Overview

Add photo selection to the "Add Property" form. The photo is held in state during form entry, then uploaded automatically after the property is successfully saved.

## Approach

**Hybrid approach:** Allow photo selection during creation, but the actual file upload happens automatically after the property is saved. This provides a seamless single-step UX while reusing the existing photo upload API.

## Component Changes

### PropertyForm.tsx

Main changes:
- Add state for pending photo file: `pendingPhoto: File | null`
- Show photo picker UI for new properties (when `id === 0`)
- After successful property save, if `pendingPhoto` exists, call the photo upload API
- Pass photo preview and handlers to PropertyPhotoUpload

### PropertyPhotoUpload.tsx

Add "pending mode" for new properties:
- Only handles file selection (no immediate upload)
- Shows preview of selected file before save
- New props to control this behavior

```typescript
interface Props {
  propertyId: number;
  currentPhoto?: string;
  pendingMode?: boolean;                         // true = just select, don't upload
  onFileSelected?: (file: File | null) => void;  // callback for pending mode
  pendingFile?: File | null;                     // file to preview in pending mode
}
```

## State Management

```typescript
// Existing state
const [data, setData] = useState<PropertyInput>(initialData);

// New state for pending photo
const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
```

## User Flow

1. User opens "Add Property" form
2. User fills in property details (name, address, etc.)
3. User selects a photo using the file picker at the bottom
4. Photo preview displays immediately (from local file)
5. User can remove/change the selected photo before saving
6. User clicks "Save"
7. PropertyForm saves property data via existing API
8. On success, if `pendingPhoto` exists, upload it to `POST /:id/photo`
9. If photo upload fails, show toast error (property still saved)
10. Navigate to property view

## Save Handler

```typescript
async function handleSave() {
  const savedProperty = await saveProperty(data);

  if (pendingPhoto && savedProperty.id) {
    setIsUploadingPhoto(true);
    try {
      await uploadPhoto(savedProperty.id, pendingPhoto);
    } catch (error) {
      showToast('error', t('property:photoUploadError'));
    }
    setIsUploadingPhoto(false);
  }

  navigateToProperty(savedProperty.id);
}
```

## Error Handling

If the property saves successfully but the photo upload fails:
- Property data is preserved (no data loss)
- Toast error shown about photo failure
- Photo upload section becomes visible since property now exists
- User can retry upload manually

## Validation

Client-side validation on file selection (reuse existing):
- Max size: 5MB
- Allowed types: JPEG, PNG, WebP

## Preview Display

For pending photos, create a local object URL:
```typescript
const previewUrl = pendingPhoto ? URL.createObjectURL(pendingPhoto) : null;
// Clean up with URL.revokeObjectURL when component unmounts or file changes
```

## UI Placement

Photo upload field appears at the bottom of the form (after all other fields, before save button) - consistent with edit form.

## Files to Modify

- `frontend/src/components/property/PropertyForm.tsx`
- `frontend/src/components/property/PropertyPhotoUpload.tsx`
- `frontend/src/components/property/PropertyPhotoUpload.test.tsx`
- `frontend/src/components/property/PropertyForm.test.tsx`

## Testing

### PropertyForm.test.tsx
- Photo picker visible on new property form
- Selected photo shows preview
- Photo uploaded after property save
- Error toast shown if photo upload fails (property still saved)

### PropertyPhotoUpload.test.tsx
- Pending mode only selects, doesn't upload
- `onFileSelected` callback fires correctly
- Preview works with `pendingFile` prop

## Backend Changes

None required - reuses existing `POST /real-estate/property/:id/photo` endpoint.
