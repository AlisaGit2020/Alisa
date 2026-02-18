import { Grid } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { Property } from '@alisa-types';
import AlisaCardList from "../alisa/AlisaCardList";
import { propertyContext } from "@alisa-lib/alisa-contexts";
import { CardGridPageTemplate } from "../templates";
import { PROPERTY_LIST_CHANGE_EVENT } from "../layout/PropertyBadge";

function Properties({ t }: WithTranslation) {
  const handleAfterDelete = () => {
    window.dispatchEvent(new CustomEvent(PROPERTY_LIST_CHANGE_EVENT));
  };

  return (
    <CardGridPageTemplate translationPrefix="property">
      <Grid container>
        <Grid size={{ xs: 12, lg: 12 }}>
          <AlisaCardList<Property>
            t={t}
            alisaContext={propertyContext}
            fields={[{ name: "name" }, { name: "size", format: "number" }]}
            fetchOptions={{ order: { name: "ASC" }, relations: { ownerships: true } }}
            onAfterDelete={handleAfterDelete}
          />
        </Grid>
      </Grid>
    </CardGridPageTemplate>
  );
}

export default withTranslation(propertyContext.name)(Properties);
