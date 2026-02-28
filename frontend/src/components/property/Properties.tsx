import React, { useState } from "react";
import { Box, Grid, Tab, Tabs } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import SellIcon from "@mui/icons-material/Sell";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ListIcon from "@mui/icons-material/List";
import { Property } from "@asset-types";
import { PropertyStatus } from "@asset-types/common";
import AssetCardList from "../asset/AssetCardList";
import { propertyContext } from "@asset-lib/asset-contexts";
import { CardGridPageTemplate } from "../templates";
import { PROPERTY_LIST_CHANGE_EVENT } from "../layout/PropertyBadge";
import ProspectAddChoiceDialog from "./ProspectAddChoiceDialog";
import InvestmentCalculatorProtected from "../investment-calculator/InvestmentCalculatorProtected";
import ProspectCompareView from "../investment-calculator/ProspectCompareView";

const TAB_OWN = 0;
const TAB_PROSPECT = 1;
const TAB_SOLD = 2;
const TAB_CALCULATOR = 3;

const ROUTE_OWN = "own";
const ROUTE_PROSPECT = "prospects";
const ROUTE_SOLD = "sold";
const ROUTE_CALCULATOR = "investment-calculator";

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
  if (tabSegment === ROUTE_CALCULATOR) return TAB_CALCULATOR;
  return TAB_OWN;
}

function getRouteFromTabIndex(tabIndex: number): string {
  if (tabIndex === TAB_PROSPECT) return ROUTE_PROSPECT;
  if (tabIndex === TAB_SOLD) return ROUTE_SOLD;
  if (tabIndex === TAB_CALCULATOR) return ROUTE_CALCULATOR;
  return ROUTE_OWN;
}

const PROSPECT_VIEW_LIST = 0;
const PROSPECT_VIEW_COMPARE = 1;

function Properties({ t }: WithTranslation) {
  const location = useLocation();
  const navigate = useNavigate();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [prospectView, setProspectView] = useState(PROSPECT_VIEW_LIST);

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
    if (index === TAB_OWN) return PropertyStatus.OWN;
    if (index === TAB_PROSPECT) return PropertyStatus.PROSPECT;
    return PropertyStatus.SOLD;
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
          <Tab
            icon={<SellIcon />}
            iconPosition="start"
            label={t("soldProperties")}
            sx={{ gap: 1 }}
          />
          <Tab
            icon={<TrendingUpIcon />}
            iconPosition="start"
            label={t("investmentCalculator")}
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
          <Tabs
            value={prospectView}
            onChange={(_e, v) => setProspectView(v)}
            sx={{ mb: 2 }}
          >
            <Tab
              icon={<ListIcon />}
              iconPosition="start"
              label={t("properties")}
              sx={{ gap: 1 }}
            />
            <Tab
              icon={<CompareArrowsIcon />}
              iconPosition="start"
              label={t("compare")}
              sx={{ gap: 1 }}
            />
          </Tabs>

          {prospectView === PROSPECT_VIEW_LIST && (
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
          )}

          {prospectView === PROSPECT_VIEW_COMPARE && (
            <ProspectCompareView />
          )}
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

        <TabPanel value={tabIndex} index={TAB_CALCULATOR}>
          <InvestmentCalculatorProtected />
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
