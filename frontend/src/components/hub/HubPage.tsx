import {
  Card,
  CardActionArea,
  CardContent,
  Box,
  Grid,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { getMenuItemById, SubPageConfig } from "@alisa-lib/menu-config";
import { HubPageTemplate } from "../templates";

interface HubPageProps {
  menuId: string;
  translationNamespace: string;
}

function HubPage({ menuId, translationNamespace }: HubPageProps) {
  const { t } = useTranslation(translationNamespace);
  const menuItem = getMenuItemById(menuId);

  if (!menuItem || !menuItem.subPages) {
    return null;
  }

  return (
    <HubPageTemplate translationPrefix={translationNamespace}>
      <Grid container spacing={3}>
        {menuItem.subPages.map((page: SubPageConfig) => (
          <Grid key={page.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              elevation={3}
              sx={{
                height: "100%",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardActionArea
                href={page.routePath}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  p: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    bgcolor: page.color,
                    color: "white",
                    mb: 2,
                  }}
                >
                  {page.icon}
                </Box>
                <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
                  <Typography variant="h6" gutterBottom>
                    {t(page.titleKey)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t(page.descriptionKey)}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </HubPageTemplate>
  );
}

export default HubPage;
