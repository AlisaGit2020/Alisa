import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Tab, Tabs } from "@mui/material";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import DoneIcon from "@mui/icons-material/Done";
import TransactionsPending from "./pending/TransactionsPending";
import TransactionMain from "./TransactionMain";

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

function BankTransactions() {
  const { t } = useTranslation("accounting");
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
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
          icon={<HourglassTopIcon />}
          iconPosition="start"
          label={t("pending")}
          sx={{ gap: 1 }}
        />
        <Tab
          icon={<DoneIcon />}
          iconPosition="start"
          label={t("accepted")}
          sx={{ gap: 1 }}
        />
      </Tabs>

      <TabPanel value={tabIndex} index={0}>
        <TransactionsPending />
      </TabPanel>

      <TabPanel value={tabIndex} index={1}>
        <TransactionMain />
      </TabPanel>
    </Box>
  );
}

export default BankTransactions;
