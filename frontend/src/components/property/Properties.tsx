import { Grid } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { Property } from '@alisa-types';
import AlisaCardList from "../alisa/AlisaCardList";
import { propertyContext } from "@alisa-lib/alisa-contexts";
import { CardGridPageTemplate } from "../templates";

function Properties({ t }: WithTranslation) {
  return (
    <CardGridPageTemplate translationPrefix="property">
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
    </CardGridPageTemplate>
  );
}

export default withTranslation(propertyContext.name)(Properties);
