import { Grid, Paper, Typography } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import PropertyBalance from "../widgets/PropertyBalance.tsx";
import Balances from "../widgets/Balances.tsx";

function Dashboard({ t }: WithTranslation) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper elevation={5} sx={{ p: "10px" }}>
          <Typography sx={{ fontSize: "medium" }}>{t("slogan")}</Typography>
        </Paper>
      </Grid>
      {/* Chart */}
      <Grid item xs={12} md={8} lg={9}>
        <Paper
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: 340,
          }}
        >
          <PropertyBalance />
        </Paper>
      </Grid>
      {/* Recent Deposits */}
      <Grid item xs={12} md={4} lg={3}>
        <Paper
          sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: 240,
          }}
        >
          <Balances />
        </Paper>
      </Grid>
      {/* Recent Orders */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}></Paper>
      </Grid>
    </Grid>
  );
}

export default withTranslation("appBar")(Dashboard);
