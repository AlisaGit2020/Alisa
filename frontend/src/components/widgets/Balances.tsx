import * as React from "react";
import Title from "../../Title.tsx";
import DataService from "@alisa-lib/data-service.ts";
import {
  propertyContext,
  transactionContext,
} from "@alisa-lib/alisa-contexts.ts";
import { WithTranslation, withTranslation } from "react-i18next";
import { Avatar } from "@mui/material";

import { Property } from "@alisa-backend/real-estate/property/entities/property.entity.ts";
import Table from "@mui/material/Table";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";

interface PropertyBalanceProps extends WithTranslation {}

function Balances(props: PropertyBalanceProps) {
  const [properties, setProperties] = React.useState<Property[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      const dataService = new DataService<Property>({
        context: propertyContext,
      });

      const properties: Property[] = await dataService.search();
      if (properties.length === 0) {
        return;
      }
      setProperties(properties);
    };
    fetchData().then(() => {});
  }, []);

  return (
    <React.Fragment>
      <Title>{props.t("balance")}</Title>
      <Table size={"small"}>
        <TableHead></TableHead>
        <TableBody>
          {properties.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Avatar
                  src={`/assets/properties/${item.name}.jpg`}
                  sx={{ width: 32, height: 32 }}
                ></Avatar>
              </TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell sx={{ textAlign: "right" }}>
                <Link href={`${transactionContext.routePath}/${item.name}`}>
                  {props.t("format.currency.euro", { val: 3646.32 })}
                </Link>
              </TableCell>
            </TableRow>
          ))}
          <TableRow sx={{ "&:last-child": { borderBottom: "none" } }}>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell sx={{ textAlign: "right" }}>
              <Typography variant="body1">
                {props.t("format.currency.euro", { val: 3646.32 })}
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </React.Fragment>
  );
}
export default withTranslation(transactionContext.name)(Balances);
