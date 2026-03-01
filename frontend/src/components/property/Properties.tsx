import React, { useState } from "react";
import { Box, CircularProgress, Grid, Tab, Tabs } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import SellIcon from "@mui/icons-material/Sell";
import AddIcon from "@mui/icons-material/Add";
import { Property } from "@asset-types";
import { PropertyStatus } from "@asset-types/common";
import AssetCardList from "../asset/AssetCardList";
import { AssetButton } from "../asset";
import { propertyContext } from "@asset-lib/asset-contexts";
import { CardGridPageTemplate } from "../templates";
import { PROPERTY_LIST_CHANGE_EVENT } from "../layout/PropertyBadge";
import ProspectAddChoiceDialog from "./ProspectAddChoiceDialog";
import ProspectsPanel from "./ProspectsPanel";

const TAB_OWN = 0;
const TAB_PROSPECT = 1;
const TAB_SOLD = 2;

const ROUTE_OWN = "own";
const ROUTE_PROSPECT = "prospects";
const ROUTE_SOLD = "sold";

const BASE_PATH = "/app/portfolio";

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
  const segments = pathname.split('/');
  const portfolioIndex = segments.indexOf('portfolio');
  const tabSegment = portfolioIndex !== -1 ? segments[portfolioIndex + 1] : undefined;
  if (tabSegment === ROUTE_PROSPECT) return TAB_PROSPECT;
  if (tabSegment === ROUTE_SOLD) return TAB_SOLD;
  return TAB_OWN;
}

function getRouteFromTabIndex(tabIndex: number): string {
  if (tabIndex === TAB_PROSPECT) return ROUTE_PROSPECT;
  if (tabIndex === TAB_SOLD) return ROUTE_SOLD;
  return ROUTE_OWN;
}

function Properties({ t }: WithTranslation) {
  const location = useLocation();
  const navigate = useNavigate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);

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

  const handleOwnAddClick = () => {
    navigate(`${BASE_PATH}/${ROUTE_OWN}/add`);
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
    const route = getRouteFromTabIndex(tabIndex);
    navigate(`${BASE_PATH}/${route}/add`);
  };

  const getStatusForTab = (index: number): PropertyStatus => {
    if (index === TAB_OWN) return PropertyStatus.OWN;
    if (index === TAB_PROSPECT) return PropertyStatus.PROSPECT;
    return PropertyStatus.SOLD;
  };

  const buildFetchOptions = (index: number) => ({
    order: { name: "ASC" as const },
    relations: { ownerships: true },
    where: { status: getStatusForTab(index) },
  });

  // Handle loading state when switching tabs
  const handleTabChangeWithLoading = (_event: React.SyntheticEvent, newValue: number) => {
    setLoading(true);
    handleTabChange(_event, newValue);
    // Reset loading after a short delay
    setTimeout(() => setLoading(false), 100);
  };

  return (
    <CardGridPageTemplate translationPrefix="property">
      <Box>
        <Tabs
          value={tabIndex}
          onChange={handleTabChangeWithLoading}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              minHeight: 48,
              minWidth: { xs: 'auto', sm: 120 },
              px: { xs: 1, sm: 2 },
            },
          }}
        >
          <Tab
            icon={<HomeIcon data-testid="HomeIcon" />}
            iconPosition="start"
            label={t("ownProperties")}
            sx={{ gap: 1 }}
          />
          <Tab
            icon={<SearchIcon data-testid="SearchIcon" />}
            iconPosition="start"
            label={t("prospectProperties")}
            sx={{ gap: 1 }}
          />
          <Tab
            icon={<SellIcon data-testid="SellIcon" />}
            iconPosition="start"
            label={t("soldProperties")}
            sx={{ gap: 1 }}
          />
        </Tabs>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <>
            <TabPanel value={tabIndex} index={TAB_OWN}>
              <Box sx={{ mb: 2 }}>
                <AssetButton
                  label={t("add")}
                  startIcon={<AddIcon />}
                  onClick={handleOwnAddClick}
                />
              </Box>
              <Grid container>
                <Grid size={{ xs: 12, lg: 12 }}>
                  <AssetCardList<Property>
                    t={t}
                    assetContext={propertyContext}
                    fields={[{ name: "name" }, { name: "size", format: "number" }]}
                    fetchOptions={buildFetchOptions(TAB_OWN)}
                    onAfterDelete={handleAfterDelete}
                    routePrefix={ROUTE_OWN}
                    hideAddLink={true}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabIndex} index={TAB_PROSPECT}>
              <ProspectsPanel
                onAddClick={handleProspectAddClick}
                refreshKey={refreshKey}
              />
            </TabPanel>

            <TabPanel value={tabIndex} index={TAB_SOLD}>
              <Grid container>
                <Grid size={{ xs: 12, lg: 12 }}>
                  <AssetCardList<Property>
                    t={t}
                    assetContext={propertyContext}
                    fields={[{ name: "name" }, { name: "size", format: "number" }]}
                    fetchOptions={buildFetchOptions(TAB_SOLD)}
                    onAfterDelete={handleAfterDelete}
                    routePrefix={ROUTE_SOLD}
                    hideAddLink={true}
                  />
                </Grid>
              </Grid>
            </TabPanel>
          </>
        )}
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
