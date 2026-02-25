import { Grid } from "@mui/material";
import { WithTranslation, withTranslation } from "react-i18next";
import { Property } from '@asset-types';
import AssetCardList from "../asset/AssetCardList";
import { propertyContext } from "@asset-lib/asset-contexts";
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
          <AssetCardList<Property>
            t={t}
            assetContext={propertyContext}
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
