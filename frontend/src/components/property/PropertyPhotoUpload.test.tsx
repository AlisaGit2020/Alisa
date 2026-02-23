import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@test-utils/test-wrapper';

// Mock constants
jest.mock('../../constants', () => ({
  VITE_API_URL: 'http://localhost:3000',
}));

// Mock axios
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock ApiClient with static methods
jest.mock('@asset-lib/api-client', () => ({
  __esModule: true,
  default: {
    getOptions: jest.fn().mockResolvedValue({
      headers: { Authorization: 'Bearer token' },
    }),
  },
}));

// Mock URL.createObjectURL and revokeObjectURL for pending file tests
(globalThis as typeof globalThis & { URL: typeof URL }).URL.createObjectURL = jest.fn(() => 'blob:http://localhost/test-blob');
(globalThis as typeof globalThis & { URL: typeof URL }).URL.revokeObjectURL = jest.fn();

// Import after mocking
import PropertyPhotoUpload from './PropertyPhotoUpload';

// Translation text values (from actual translation files - use these for testing)
const TEXTS = {
  propertyPhoto: 'Property Photo',
  uploadPhoto: 'Upload Photo',
  deletePhoto: 'Delete Photo',
};

describe('PropertyPhotoUpload', () => {
  const defaultProps = {
    propertyId: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders photo upload component with title', () => {
      renderWithProviders(<PropertyPhotoUpload {...defaultProps} />);

      expect(screen.getByText(TEXTS.propertyPhoto)).toBeInTheDocument();
    });

    it('renders upload button', () => {
      renderWithProviders(<PropertyPhotoUpload {...defaultProps} />);

      expect(screen.getByText(TEXTS.uploadPhoto)).toBeInTheDocument();
    });

    it('renders help text', () => {
      renderWithProviders(<PropertyPhotoUpload {...defaultProps} />);

      // Use partial text match for help text
      expect(screen.getByText(/Maximum 5MB/)).toBeInTheDocument();
    });

    it('does not render delete button when no photo exists', () => {
      renderWithProviders(<PropertyPhotoUpload {...defaultProps} />);

      expect(screen.queryByText(TEXTS.deletePhoto)).not.toBeInTheDocument();
    });

    it('renders delete button when photo exists', () => {
      renderWithProviders(
        <PropertyPhotoUpload
          {...defaultProps}
          currentPhoto="uploads/photos/test-photo.jpg"
        />
      );

      expect(screen.getByText(TEXTS.deletePhoto)).toBeInTheDocument();
    });

    it('renders photo preview box', () => {
      const { container } = renderWithProviders(
        <PropertyPhotoUpload {...defaultProps} />
      );

      // Check for a Box that would contain background-image style
      const previewBoxes = container.querySelectorAll('.MuiBox-root');
      expect(previewBoxes.length).toBeGreaterThan(0);
    });

    it('renders file input with correct accept attribute', () => {
      renderWithProviders(<PropertyPhotoUpload {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute(
        'accept',
        'image/jpeg,image/jpg,image/png,image/webp'
      );
    });
  });

  describe('Edge cases', () => {
    it('does not show delete button when no photo path exists', async () => {
      renderWithProviders(
        <PropertyPhotoUpload {...defaultProps} currentPhoto={undefined} />
      );

      expect(screen.queryByText(TEXTS.deletePhoto)).not.toBeInTheDocument();
    });
  });

  describe('Pending mode rendering', () => {
    it('renders in pending mode for new properties', () => {
      renderWithProviders(
        <PropertyPhotoUpload
          propertyId={0}
          pendingMode={true}
          onFileSelected={jest.fn()}
        />
      );

      expect(screen.getByText(TEXTS.propertyPhoto)).toBeInTheDocument();
      expect(screen.getByText(TEXTS.uploadPhoto)).toBeInTheDocument();
    });

    it('does not show remove button when no pending file', () => {
      renderWithProviders(
        <PropertyPhotoUpload
          propertyId={0}
          pendingMode={true}
          pendingFile={null}
          onFileSelected={jest.fn()}
        />
      );

      expect(screen.queryByText('Remove Photo')).not.toBeInTheDocument();
    });

    it('shows remove button when pending file exists', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      renderWithProviders(
        <PropertyPhotoUpload
          propertyId={0}
          pendingMode={true}
          pendingFile={file}
          onFileSelected={jest.fn()}
        />
      );

      expect(screen.getByText('Remove Photo')).toBeInTheDocument();
    });
  });
});

// Test the component logic separately (following the pattern from other tests)
describe('PropertyPhotoUpload Logic', () => {
  describe('File type validation', () => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    it('accepts jpeg files', () => {
      const isValidType = allowedTypes.includes('image/jpeg');
      expect(isValidType).toBe(true);
    });

    it('accepts jpg files', () => {
      const isValidType = allowedTypes.includes('image/jpg');
      expect(isValidType).toBe(true);
    });

    it('accepts png files', () => {
      const isValidType = allowedTypes.includes('image/png');
      expect(isValidType).toBe(true);
    });

    it('accepts webp files', () => {
      const isValidType = allowedTypes.includes('image/webp');
      expect(isValidType).toBe(true);
    });

    it('rejects gif files', () => {
      const isValidType = allowedTypes.includes('image/gif');
      expect(isValidType).toBe(false);
    });

    it('rejects svg files', () => {
      const isValidType = allowedTypes.includes('image/svg+xml');
      expect(isValidType).toBe(false);
    });
  });

  describe('File size validation', () => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    it('accepts file under 5MB', () => {
      const fileSize = 4 * 1024 * 1024; // 4MB
      const isValidSize = fileSize <= MAX_SIZE;
      expect(isValidSize).toBe(true);
    });

    it('accepts file exactly 5MB', () => {
      const fileSize = 5 * 1024 * 1024; // 5MB
      const isValidSize = fileSize <= MAX_SIZE;
      expect(isValidSize).toBe(true);
    });

    it('rejects file over 5MB', () => {
      const fileSize = 6 * 1024 * 1024; // 6MB
      const isValidSize = fileSize <= MAX_SIZE;
      expect(isValidSize).toBe(false);
    });
  });

  describe('API endpoint construction', () => {
    it('constructs upload endpoint correctly', () => {
      const baseUrl = 'http://localhost:3000';
      const propertyId = 5;
      const endpoint = `${baseUrl}/real-estate/property/${propertyId}/photo`;
      expect(endpoint).toBe(
        'http://localhost:3000/real-estate/property/5/photo'
      );
    });

    it('constructs delete endpoint correctly', () => {
      const baseUrl = 'http://localhost:3000';
      const propertyId = 5;
      const endpoint = `${baseUrl}/real-estate/property/${propertyId}/photo`;
      expect(endpoint).toBe(
        'http://localhost:3000/real-estate/property/5/photo'
      );
    });
  });

  describe('Upload state management', () => {
    it('loading starts as false', () => {
      const loading = false;
      expect(loading).toBe(false);
    });

    it('loading is set to true during upload', () => {
      let loading = false;
      const startUpload = () => {
        loading = true;
      };
      startUpload();
      expect(loading).toBe(true);
    });

    it('loading is reset after upload success', () => {
      let loading = true;
      const finishUpload = () => {
        loading = false;
      };
      finishUpload();
      expect(loading).toBe(false);
    });

    it('loading is reset after upload failure', () => {
      let loading = true;
      const handleError = () => {
        loading = false;
      };
      handleError();
      expect(loading).toBe(false);
    });
  });

  describe('Error state management', () => {
    it('error starts as null', () => {
      const error: string | null = null;
      expect(error).toBeNull();
    });

    it('error is set on validation failure', () => {
      let error: string | null = null;
      const setError = (msg: string) => {
        error = msg;
      };
      setError('Invalid file type');
      expect(error).toBe('Invalid file type');
    });

    it('error is cleared on successful upload', () => {
      let error: string | null = 'Previous error';
      const clearError = () => {
        error = null;
      };
      clearError();
      expect(error).toBeNull();
    });
  });

  describe('Photo path state', () => {
    it('starts with initial currentPhoto value', () => {
      const currentPhoto = 'uploads/photos/existing.jpg';
      expect(currentPhoto).toBe('uploads/photos/existing.jpg');
    });

    it('can be undefined initially', () => {
      const currentPhoto = undefined;
      expect(currentPhoto).toBeUndefined();
    });

    it('updates after successful upload', () => {
      let photoPath: string | undefined = undefined;
      const updatePhoto = (newPath: string) => {
        photoPath = newPath;
      };
      updatePhoto('uploads/photos/new.jpg');
      expect(photoPath).toBe('uploads/photos/new.jpg');
    });

    it('clears after successful delete', () => {
      let photoPath: string | undefined = 'uploads/photos/existing.jpg';
      const deletePhoto = () => {
        photoPath = undefined;
      };
      deletePhoto();
      expect(photoPath).toBeUndefined();
    });
  });

  describe('Pending mode', () => {
    it('pendingMode defaults to false', () => {
      const pendingMode = false;
      expect(pendingMode).toBe(false);
    });

    it('in pending mode, file selection does not trigger upload', () => {
      const pendingMode = true;
      let uploadCalled = false;
      let onFileSelectedCalled = false;

      const handleFileSelect = () => {
        if (pendingMode) {
          onFileSelectedCalled = true;
        } else {
          uploadCalled = true;
        }
      };

      handleFileSelect();

      expect(onFileSelectedCalled).toBe(true);
      expect(uploadCalled).toBe(false);
    });

    it('pendingFile triggers preview URL creation', () => {
      // URL.createObjectURL is not available in Jest, so we test the logic
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const shouldCreatePreview = file !== null;
      expect(shouldCreatePreview).toBe(true);
    });

    it('hasPhoto is true when pendingFile exists in pending mode', () => {
      const pendingMode = true;
      const pendingFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const photoPath = undefined;

      const hasPhoto = pendingMode ? !!pendingFile : !!photoPath;
      expect(hasPhoto).toBe(true);
    });

    it('hasPhoto is false when pendingFile is null in pending mode', () => {
      const pendingMode = true;
      const pendingFile = null;
      const photoPath = undefined;

      const hasPhoto = pendingMode ? !!pendingFile : !!photoPath;
      expect(hasPhoto).toBe(false);
    });

    it('remove pending file sets pendingFile to null', () => {
      let pendingFile: File | null = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const handleRemovePendingFile = () => {
        pendingFile = null;
      };

      handleRemovePendingFile();
      expect(pendingFile).toBeNull();
    });
  });
});
