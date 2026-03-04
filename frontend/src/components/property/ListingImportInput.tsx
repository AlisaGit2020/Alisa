import { useState, ChangeEvent } from "react";
import { Box, CircularProgress, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import AssetTextField from "../asset/form/AssetTextField";
import AssetNumberField from "../asset/form/AssetNumberField";
import AssetSelectField from "../asset/form/AssetSelectField";
import AssetButton from "../asset/form/AssetButton";
import { useToast } from "../asset/toast";
import ApiClient from "@asset-lib/api-client";
import { VITE_API_URL } from "../../constants";
import { ListingSource } from "../../types/inputs";

// URL validation patterns
const ETUOVI_URL_PATTERN = /^https?:\/\/(www\.)?etuovi\.com\/kohde\/\d+/;
const OIKOTIE_URL_PATTERN = /^https?:\/\/(www\.)?asunnot\.oikotie\.fi\//;

export interface PropertyData {
  url: string;
  deptFreePrice: number;
  deptShare?: number;
  apartmentSize: number;
  maintenanceFee: number;
  waterCharge?: number;
  chargeForFinancialCosts?: number;
  address?: string;
}

export interface ListingImportInputProps {
  mode: "prospect" | "fetch";
  onSuccess?: () => void;
  onDataFetched?: (data: PropertyData) => void;
  showRentInput?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

const SOURCE_ITEMS = [
  { id: 1, name: "Etuovi", key: "etuovi" },
  { id: 2, name: "Oikotie", key: "oikotie" },
];

export default function ListingImportInput({
  mode,
  onSuccess,
  onDataFetched,
  showRentInput = false,
  loading: externalLoading = false,
  disabled = false,
}: ListingImportInputProps) {
  const { t } = useTranslation(["property", "common"]);
  const { showToast } = useToast();

  const [source, setSource] = useState<ListingSource>("etuovi");
  const [url, setUrl] = useState("");
  const [monthlyRent, setMonthlyRent] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>(
    undefined
  );

  const loading = isLoading || externalLoading;
  const isDisabled = disabled || loading;

  const getSourceFromId = (id: number): ListingSource => {
    return id === 2 ? "oikotie" : "etuovi";
  };

  const getIdFromSource = (src: ListingSource): number => {
    return src === "oikotie" ? 2 : 1;
  };

  const handleSourceChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newSource = getSourceFromId(Number(e.target.value));
    setSource(newSource);
    setValidationError(undefined);
  };

  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setValidationError(undefined);
  };

  const getPlaceholder = (): string => {
    return source === "oikotie"
      ? t("oikotieUrlPlaceholder")
      : t("etuoviUrlPlaceholder");
  };

  const validateUrl = (urlToValidate: string): boolean => {
    const pattern =
      source === "oikotie" ? OIKOTIE_URL_PATTERN : ETUOVI_URL_PATTERN;
    const errorKey =
      source === "oikotie" ? "invalidOikotieUrl" : "invalidEtuoviUrl";

    if (!pattern.test(urlToValidate)) {
      setValidationError(t(errorKey));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateUrl(url)) {
      return;
    }

    setIsLoading(true);
    try {
      const payload: { url: string; monthlyRent?: number } = { url };
      if (showRentInput && monthlyRent !== undefined && monthlyRent > 0) {
        payload.monthlyRent = monthlyRent;
      }

      if (mode === "fetch" && onDataFetched) {
        // Use fetch API for fetch mode (returns data for form population)
        const fetchResponse = await fetch(
          `${VITE_API_URL}/import/${source}/fetch`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        if (!fetchResponse.ok) {
          throw new Error('Fetch failed');
        }
        const data: PropertyData = await fetchResponse.json();
        onDataFetched(data);
      } else if (mode === "prospect" && onSuccess) {
        // Use ApiClient for prospect mode (creates property in database)
        await ApiClient.post(`import/${source}/create-prospect`, payload);
        showToast({ message: t("importSuccess"), severity: "success" });
        setUrl("");
        setMonthlyRent(undefined);
        onSuccess();
      }
    } catch {
      showToast({ message: t("importError"), severity: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = !url.trim() || isDisabled;

  const buttonLabel =
    mode === "prospect" ? t("importButton") : t("common:search");

  return (
    <Stack spacing={2}>
      <AssetSelectField
        label={t("listingSource")}
        value={getIdFromSource(source)}
        items={SOURCE_ITEMS}
        onChange={handleSourceChange}
        disabled={isDisabled}
        fullWidth
      />
      <AssetTextField
        label=""
        placeholder={getPlaceholder()}
        value={url}
        onChange={handleUrlChange}
        error={!!validationError}
        helperText={validationError}
        disabled={isDisabled}
        fullWidth
      />
      {showRentInput && (
        <AssetNumberField
          label={t("expectedRent")}
          value={monthlyRent ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            setMonthlyRent(value ? Number(value) : undefined);
          }}
          disabled={isDisabled}
          adornment={"euro"}
          fullWidth
        />
      )}
      <Box>
        <AssetButton
          label={loading ? "" : buttonLabel}
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        />
      </Box>
    </Stack>
  );
}
