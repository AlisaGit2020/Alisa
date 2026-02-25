import React, { useState } from "react";
import { Box, Grid, Tab, Tabs } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import { Property } from "@asset-types";
import { PropertyStatus } from "@asset-types/common";
import AssetCardList from "../asset/AssetCardList";
import { propertyContext } from "@asset-lib/asset-contexts";
import { CardGridPageTemplate } from "../templates";
import { PROPERTY_LIST_CHANGE_EVENT } from "../layout/PropertyBadge";

const TAB_OWN = 0;
const TAB_PROSPECT = 1;

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

function Properties({ t }: WithTranslation) {
  const [tabIndex, setTabIndex] = useState(TAB_OWN);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleAfterDelete = () => {
    window.dispatchEvent(new CustomEvent(PROPERTY_LIST_CHANGE_EVENT));
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
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabIndex} index={TAB_PROSPECT}>
          <Grid container>
            <Grid size={{ xs: 12, lg: 12 }}>
              <AssetCardList<Property>
                t={t}
                assetContext={propertyContext}
                fields={[{ name: "name" }, { name: "size", format: "number" }]}
                fetchOptions={buildFetchOptions(TAB_PROSPECT)}
                onAfterDelete={handleAfterDelete}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </CardGridPageTemplate>
  );
}

export default withTranslation(propertyContext.name)(Properties);
