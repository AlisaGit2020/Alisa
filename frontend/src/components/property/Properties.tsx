import { Box, Grid } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { Property } from "@alisa-backend/real-estate/property/entities/property.entity";
import AlisaCardList from "../alisa/AlisaCardList";
import { propertyContext } from "@alisa-lib/alisa-contexts";
import PageHeader from "../alisa/PageHeader";

function Properties({ t }: WithTranslation) {
  return (
    <Box>
      <PageHeader
        title={t("overviewTitle")}
        description={t("overviewDescription")}
      />
      <Grid container>
        <Grid size={{ xs: 12, lg: 12 }}>
          <AlisaCardList<Property>
            t={t}
            alisaContext={propertyContext}
            fields={[{ name: "name" }, { name: "size", format: "number" }]}
            fetchOptions={{ order: { name: "ASC" } }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default withTranslation(propertyContext.name)(Properties);
