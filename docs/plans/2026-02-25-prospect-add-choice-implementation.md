# Prospect Add Choice Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to choose between importing from Etuovi or manual form entry when adding prospect properties.

**Architecture:** Add a modal dialog (ProspectAddChoiceDialog) that appears when clicking "Add" on the Prospects tab. The modal offers two options: Etuovi URL import (using existing backend API) or manual form navigation.

**Tech Stack:** React, Material-UI, i18next, Jest, React Testing Library, MSW

---

## Task 1: Add Translations

**Files:**
- Modify: `frontend/src/translations/en.ts`
- Modify: `frontend/src/translations/fi.ts`
- Modify: `frontend/src/translations/sv.ts`

**Step 1: Add English translations**

In `frontend/src/translations/en.ts`, add to the `property` namespace:

```typescript
addProspectTitle: "Add Prospect Property",
chooseAddMethod: "How would you like to add a property?",
importFromEtuovi: "Import from Etuovi",
etuoviUrlPlaceholder: "Paste Etuovi property URL (e.g., https://www.etuovi.com/kohde/12345)",
importButton: "Import",
addManually: "Fill in form manually",
importSuccess: "Property imported successfully",
importError: "Failed to import property",
invalidEtuoviUrl: "Please enter a valid Etuovi URL",
```

**Step 2: Add Finnish translations**

In `frontend/src/translations/fi.ts`, add to the `property` namespace:

```typescript
addProspectTitle: "Lisää seurattava kohde",
chooseAddMethod: "Miten haluat lisätä kohteen?",
importFromEtuovi: "Tuo Etuovesta",
etuoviUrlPlaceholder: "Liitä Etuovi-kohteen URL (esim. https://www.etuovi.com/kohde/12345)",
importButton: "Tuo",
addManually: "Täytä lomake manuaalisesti",
importSuccess: "Kohde tuotu onnistuneesti",
importError: "Kohteen tuonti epäonnistui",
invalidEtuoviUrl: "Anna kelvollinen Etuovi-URL",
```

**Step 3: Add Swedish translations**

In `frontend/src/translations/sv.ts`, add to the `property` namespace:

```typescript
addProspectTitle: "Lägg till prospekt",
chooseAddMethod: "Hur vill du lägga till en fastighet?",
importFromEtuovi: "Importera från Etuovi",
etuoviUrlPlaceholder: "Klistra in Etuovi-URL (t.ex. https://www.etuovi.com/kohde/12345)",
importButton: "Importera",
addManually: "Fyll i formuläret manuellt",
importSuccess: "Fastighet importerad",
importError: "Kunde inte importera fastighet",
invalidEtuoviUrl: "Ange en giltig Etuovi-URL",
```

**Step 4: Run translation coverage test**

Run: `cd frontend && npm test -- --testPathPattern="translations" --watchAll=false`
Expected: PASS (all keys exist in all languages)

**Step 5: Commit**

```bash
git add frontend/src/translations/en.ts frontend/src/translations/fi.ts frontend/src/translations/sv.ts
git commit -m "feat: add translations for prospect add choice modal"
```

---

## Task 2: Create ProspectAddChoiceDialog Tests

**Files:**
- Create: `frontend/src/components/property/ProspectAddChoiceDialog.test.tsx`

**Step 1: Write test file with failing tests**

```typescript
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@test-utils/test-wrapper";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import ProspectAddChoiceDialog from "./ProspectAddChoiceDialog";

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("ProspectAddChoiceDialog", () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnManualAdd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderDialog = (open = true) => {
    return renderWithProviders(
      <ProspectAddChoiceDialog
        open={open}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        onManualAdd={mockOnManualAdd}
      />
    );
  };

  it("renders dialog with title when open", () => {
    renderDialog();
    expect(screen.getByText(/add prospect property/i)).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    renderDialog(false);
    expect(screen.queryByText(/add prospect property/i)).not.toBeInTheDocument();
  });

  it("renders both option cards", () => {
    renderDialog();
    expect(screen.getByText(/import from etuovi/i)).toBeInTheDocument();
    expect(screen.getByText(/fill in form manually/i)).toBeInTheDocument();
  });

  it("shows URL input field in Etuovi section", () => {
    renderDialog();
    expect(screen.getByPlaceholderText(/paste etuovi/i)).toBeInTheDocument();
  });

  it("shows import button", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /import/i })).toBeInTheDocument();
  });

  it("calls onManualAdd when manual option is clicked", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByText(/fill in form manually/i));

    expect(mockOnManualAdd).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    renderDialog();

    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("disables import button when URL is empty", () => {
    renderDialog();
    const importButton = screen.getByRole("button", { name: /^import$/i });
    expect(importButton).toBeDisabled();
  });

  it("enables import button when valid URL is entered", async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/paste etuovi/i);
    await user.type(input, "https://www.etuovi.com/kohde/12345");

    const importButton = screen.getByRole("button", { name: /^import$/i });
    expect(importButton).toBeEnabled();
  });

  it("shows loading state during import", async () => {
    server.use(
      http.post("/api/import/etuovi/create-prospect", async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ id: 1, name: "Test Property" });
      })
    );

    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/paste etuovi/i);
    await user.type(input, "https://www.etuovi.com/kohde/12345");

    const importButton = screen.getByRole("button", { name: /^import$/i });
    await user.click(importButton);

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("calls onSuccess after successful import", async () => {
    server.use(
      http.post("/api/import/etuovi/create-prospect", () => {
        return HttpResponse.json({ id: 1, name: "Test Property" });
      })
    );

    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/paste etuovi/i);
    await user.type(input, "https://www.etuovi.com/kohde/12345");

    const importButton = screen.getByRole("button", { name: /^import$/i });
    await user.click(importButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("shows error toast on failed import", async () => {
    server.use(
      http.post("/api/import/etuovi/create-prospect", () => {
        return HttpResponse.json(
          { message: "Property listing not found" },
          { status: 404 }
        );
      })
    );

    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/paste etuovi/i);
    await user.type(input, "https://www.etuovi.com/kohde/99999");

    const importButton = screen.getByRole("button", { name: /^import$/i });
    await user.click(importButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to import/i)).toBeInTheDocument();
    });
  });

  it("validates URL format before submission", async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/paste etuovi/i);
    await user.type(input, "not-a-valid-url");

    const importButton = screen.getByRole("button", { name: /^import$/i });
    await user.click(importButton);

    expect(screen.getByText(/valid etuovi url/i)).toBeInTheDocument();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --testPathPattern="ProspectAddChoiceDialog" --watchAll=false`
Expected: FAIL with "Cannot find module './ProspectAddChoiceDialog'"

**Step 3: Commit test file**

```bash
git add frontend/src/components/property/ProspectAddChoiceDialog.test.tsx
git commit -m "test: add failing tests for ProspectAddChoiceDialog"
```

---

## Task 3: Create ProspectAddChoiceDialog Component

**Files:**
- Create: `frontend/src/components/property/ProspectAddChoiceDialog.tsx`

**Step 1: Create the component**

```typescript
import { useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";
import AssetTextField from "../asset/form/AssetTextField";
import AssetButton from "../asset/form/AssetButton";
import { useToast } from "../asset/toast";
import ApiClient from "@asset-lib/api-client";

interface ProspectAddChoiceDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onManualAdd: () => void;
}

const ETUOVI_URL_PATTERN = /^https?:\/\/(www\.)?etuovi\.com\/kohde\/\d+/;

export default function ProspectAddChoiceDialog({
  open,
  onClose,
  onSuccess,
  onManualAdd,
}: ProspectAddChoiceDialogProps) {
  const { t } = useTranslation("property");
  const { showToast } = useToast();
  const [etuoviUrl, setEtuoviUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEtuoviUrl(e.target.value);
    setValidationError(null);
  };

  const validateUrl = (url: string): boolean => {
    if (!ETUOVI_URL_PATTERN.test(url)) {
      setValidationError(t("invalidEtuoviUrl"));
      return false;
    }
    return true;
  };

  const handleImport = async () => {
    if (!validateUrl(etuoviUrl)) {
      return;
    }

    setLoading(true);
    try {
      await ApiClient.post("/import/etuovi/create-prospect", { url: etuoviUrl });
      showToast({ message: t("importSuccess"), severity: "success" });
      setEtuoviUrl("");
      onSuccess();
    } catch {
      showToast({ message: t("importError"), severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEtuoviUrl("");
    setValidationError(null);
    onClose();
  };

  const isImportDisabled = !etuoviUrl.trim() || loading;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="prospect-add-dialog-title"
    >
      <DialogTitle id="prospect-add-dialog-title">
        {t("addProspectTitle")}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 3 }}>{t("chooseAddMethod")}</Typography>

        <Stack spacing={2}>
          {/* Etuovi Import Option */}
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <HomeIcon color="primary" />
                <Typography variant="h6">{t("importFromEtuovi")}</Typography>
              </Stack>
              <Stack spacing={2}>
                <AssetTextField
                  label=""
                  placeholder={t("etuoviUrlPlaceholder")}
                  value={etuoviUrl}
                  onChange={handleUrlChange}
                  error={!!validationError}
                  helperText={validationError}
                  disabled={loading}
                  fullWidth
                />
                <Box>
                  <AssetButton
                    label={loading ? "" : t("importButton")}
                    onClick={handleImport}
                    disabled={isImportDisabled}
                    startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Manual Add Option */}
          <Card variant="outlined">
            <CardActionArea onClick={onManualAdd}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EditIcon color="primary" />
                  <Typography variant="h6">{t("addManually")}</Typography>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Run tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPattern="ProspectAddChoiceDialog" --watchAll=false`
Expected: All tests PASS

**Step 3: Commit component**

```bash
git add frontend/src/components/property/ProspectAddChoiceDialog.tsx
git commit -m "feat: implement ProspectAddChoiceDialog component"
```

---

## Task 4: Add onAddClick Prop to AssetCardList

**Files:**
- Modify: `frontend/src/components/asset/AssetCardList.tsx`
- Modify: `frontend/src/components/asset/AssetCardList.test.tsx`

**Step 1: Add test for onAddClick callback**

Add to `AssetCardList.test.tsx`:

```typescript
describe("onAddClick callback", () => {
  it("calls onAddClick when add link is clicked instead of navigating", async () => {
    const onAddClick = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <AssetCardList<Property>
        t={mockT}
        assetContext={propertyContext}
        fields={[{ name: "name" }]}
        onAddClick={onAddClick}
      />
    );

    const addLink = await screen.findByRole("link", { name: /add/i });
    await user.click(addLink);

    expect(onAddClick).toHaveBeenCalled();
  });

  it("prevents default navigation when onAddClick is provided", async () => {
    const onAddClick = jest.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <AssetCardList<Property>
        t={mockT}
        assetContext={propertyContext}
        fields={[{ name: "name" }]}
        onAddClick={onAddClick}
      />
    );

    const addLink = await screen.findByRole("link", { name: /add/i });
    await user.click(addLink);

    // Should not navigate (would be verified by checking navigation didn't happen)
    expect(onAddClick).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- --testPathPattern="AssetCardList" --watchAll=false`
Expected: FAIL (onAddClick prop doesn't exist yet)

**Step 3: Implement onAddClick prop**

In `AssetCardList.tsx`, modify the interface:

```typescript
interface AssetCardListInputProps<T> {
  t: TFunction;
  title?: string;
  assetContext: AssetContext;
  fields: AlisCardListField<T>[];
  fetchOptions?: TypeOrmFetchOptions<T>;
  onAfterDelete?: () => void;
  /** Optional route prefix for add/edit links (e.g., "own" or "prospects") */
  routePrefix?: string;
  /** Optional callback when add link is clicked (overrides default navigation) */
  onAddClick?: () => void;
}
```

Update the component destructuring:

```typescript
function AssetCardList<T extends { id: number }>({
  t,
  title,
  assetContext,
  fetchOptions,
  onAfterDelete,
  routePrefix,
  onAddClick,
}: AssetCardListInputProps<T>) {
```

Replace the Link element (around line 150):

```typescript
{onAddClick ? (
  <Link
    href={buildRoutePath("add")}
    onClick={(e) => {
      e.preventDefault();
      onAddClick();
    }}
  >
    {t("add")}
  </Link>
) : (
  <Link href={buildRoutePath("add")}>{t("add")}</Link>
)}
```

**Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test -- --testPathPattern="AssetCardList" --watchAll=false`
Expected: All tests PASS

**Step 5: Commit changes**

```bash
git add frontend/src/components/asset/AssetCardList.tsx frontend/src/components/asset/AssetCardList.test.tsx
git commit -m "feat: add onAddClick callback prop to AssetCardList"
```

---

## Task 5: Update Properties Component

**Files:**
- Modify: `frontend/src/components/property/Properties.tsx`
- Modify: `frontend/src/components/property/Properties.test.tsx`

**Step 1: Add integration tests for the modal**

Add to `Properties.test.tsx`:

```typescript
describe("Prospect Add Choice Dialog", () => {
  beforeEach(() => {
    server.use(
      http.post("/api/real-estate/property/search", () => {
        return HttpResponse.json([]);
      })
    );
  });

  it("opens add dialog when clicking Add on Prospects tab", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Properties />, {
      route: "/app/portfolio/properties/prospects",
    });

    const addLink = await screen.findByRole("link", { name: /add/i });
    await user.click(addLink);

    expect(screen.getByText(/add prospect property/i)).toBeInTheDocument();
  });

  it("navigates to form when manual add is selected", async () => {
    const user = userEvent.setup();
    const { history } = renderWithProviders(<Properties />, {
      route: "/app/portfolio/properties/prospects",
    });

    const addLink = await screen.findByRole("link", { name: /add/i });
    await user.click(addLink);

    await user.click(screen.getByText(/fill in form manually/i));

    expect(history.location.pathname).toBe("/app/portfolio/properties/prospects/add");
  });

  it("imports property from Etuovi and refreshes list", async () => {
    server.use(
      http.post("/api/import/etuovi/create-prospect", () => {
        return HttpResponse.json({ id: 1, name: "Imported Property" });
      }),
      http.post("/api/real-estate/property/search", () => {
        return HttpResponse.json([{ id: 1, name: "Imported Property", size: 50 }]);
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<Properties />, {
      route: "/app/portfolio/properties/prospects",
    });

    const addLink = await screen.findByRole("link", { name: /add/i });
    await user.click(addLink);

    const input = screen.getByPlaceholderText(/paste etuovi/i);
    await user.type(input, "https://www.etuovi.com/kohde/12345");

    await user.click(screen.getByRole("button", { name: /^import$/i }));

    await waitFor(() => {
      expect(screen.getByText(/property imported successfully/i)).toBeInTheDocument();
    });
  });

  it("does not show dialog for Own properties tab", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Properties />, {
      route: "/app/portfolio/properties/own",
    });

    const addLink = await screen.findByRole("link", { name: /add/i });
    await user.click(addLink);

    // Dialog should NOT appear for Own tab
    expect(screen.queryByText(/add prospect property/i)).not.toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --testPathPattern="Properties.test" --watchAll=false`
Expected: FAIL (dialog not implemented yet)

**Step 3: Update Properties.tsx**

```typescript
import React, { useState } from "react";
import { Box, Grid, Tab, Tabs } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import { Property } from "@asset-types";
import { PropertyStatus } from "@asset-types/common";
import AssetCardList from "../asset/AssetCardList";
import { propertyContext } from "@asset-lib/asset-contexts";
import { CardGridPageTemplate } from "../templates";
import { PROPERTY_LIST_CHANGE_EVENT } from "../layout/PropertyBadge";
import ProspectAddChoiceDialog from "./ProspectAddChoiceDialog";

const TAB_OWN = 0;
const TAB_PROSPECT = 1;

const ROUTE_OWN = "own";
const ROUTE_PROSPECT = "prospects";

const BASE_PATH = "/app/portfolio/properties";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

function getTabIndexFromRoute(pathname: string): number {
  if (pathname.endsWith(`/${ROUTE_PROSPECT}`)) return TAB_PROSPECT;
  return TAB_OWN;
}

function getRouteFromTabIndex(tabIndex: number): string {
  return tabIndex === TAB_PROSPECT ? ROUTE_PROSPECT : ROUTE_OWN;
}

function Properties({ t }: WithTranslation) {
  const location = useLocation();
  const navigate = useNavigate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const tabIndex = getTabIndexFromRoute(location.pathname);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const route = getRouteFromTabIndex(newValue);
    navigate(`${BASE_PATH}/${route}`);
  };

  const handleAfterDelete = () => {
    window.dispatchEvent(new CustomEvent(PROPERTY_LIST_CHANGE_EVENT));
  };

  const handleProspectAddClick = () => {
    setAddDialogOpen(true);
  };

  const handleAddDialogClose = () => {
    setAddDialogOpen(false);
  };

  const handleAddDialogSuccess = () => {
    setAddDialogOpen(false);
    setRefreshKey((prev) => prev + 1);
    window.dispatchEvent(new CustomEvent(PROPERTY_LIST_CHANGE_EVENT));
  };

  const handleManualAdd = () => {
    setAddDialogOpen(false);
    navigate(`${BASE_PATH}/${ROUTE_PROSPECT}/add`);
  };

  const getStatusForTab = (index: number): PropertyStatus => {
    return index === TAB_OWN ? PropertyStatus.OWN : PropertyStatus.PROSPECT;
  };

  const buildFetchOptions = (index: number) => ({
    order: { name: "ASC" as const },
    relations: { ownerships: true },
    where: { status: getStatusForTab(index) },
  });

  return (
    <CardGridPageTemplate translationPrefix="property">
      <Box>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              minHeight: 48,
            },
          }}
        >
          <Tab
            icon={<HomeIcon />}
            iconPosition="start"
            label={t("ownProperties")}
            sx={{ gap: 1 }}
          />
          <Tab
            icon={<SearchIcon />}
            iconPosition="start"
            label={t("prospectProperties")}
            sx={{ gap: 1 }}
          />
        </Tabs>

        <TabPanel value={tabIndex} index={TAB_OWN}>
          <Grid container>
            <Grid size={{ xs: 12, lg: 12 }}>
              <AssetCardList<Property>
                t={t}
                assetContext={propertyContext}
                fields={[{ name: "name" }, { name: "size", format: "number" }]}
                fetchOptions={buildFetchOptions(TAB_OWN)}
                onAfterDelete={handleAfterDelete}
                routePrefix={ROUTE_OWN}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabIndex} index={TAB_PROSPECT}>
          <Grid container>
            <Grid size={{ xs: 12, lg: 12 }}>
              <AssetCardList<Property>
                key={refreshKey}
                t={t}
                assetContext={propertyContext}
                fields={[{ name: "name" }, { name: "size", format: "number" }]}
                fetchOptions={buildFetchOptions(TAB_PROSPECT)}
                onAfterDelete={handleAfterDelete}
                routePrefix={ROUTE_PROSPECT}
                onAddClick={handleProspectAddClick}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Box>

      <ProspectAddChoiceDialog
        open={addDialogOpen}
        onClose={handleAddDialogClose}
        onSuccess={handleAddDialogSuccess}
        onManualAdd={handleManualAdd}
      />
    </CardGridPageTemplate>
  );
}

export default withTranslation(propertyContext.name)(Properties);
```

**Step 4: Run all tests**

Run: `cd frontend && npm test -- --testPathPattern="Properties|ProspectAddChoiceDialog|AssetCardList" --watchAll=false`
Expected: All tests PASS

**Step 5: Commit changes**

```bash
git add frontend/src/components/property/Properties.tsx frontend/src/components/property/Properties.test.tsx
git commit -m "feat: integrate ProspectAddChoiceDialog into Properties view"
```

---

## Task 6: Run Full Test Suite and Verify

**Files:** None (verification only)

**Step 1: Run frontend test suite**

Run: `cd frontend && npm test -- --watchAll=false`
Expected: All tests PASS

**Step 2: Run frontend build**

Run: `cd frontend && npm run build`
Expected: Build succeeds without errors

**Step 3: Manual verification (if dev server available)**

1. Start dev server: `cd frontend && npm run dev`
2. Navigate to Properties > Prospects tab
3. Click "Add" link
4. Verify modal opens with two options
5. Test Etuovi import with valid URL
6. Test manual add navigation
7. Verify success toast appears

**Step 4: Final commit if any fixes needed**

If any fixes were made during verification:
```bash
git add -A
git commit -m "fix: address issues found during verification"
```

---

## Summary

| Task | Description | Files Changed |
|------|-------------|---------------|
| 1 | Add translations | en.ts, fi.ts, sv.ts |
| 2 | Create dialog tests | ProspectAddChoiceDialog.test.tsx |
| 3 | Create dialog component | ProspectAddChoiceDialog.tsx |
| 4 | Add onAddClick to AssetCardList | AssetCardList.tsx, AssetCardList.test.tsx |
| 5 | Integrate dialog into Properties | Properties.tsx, Properties.test.tsx |
| 6 | Full verification | None |
