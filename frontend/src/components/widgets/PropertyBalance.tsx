import * as React from "react";
import { useTheme } from "@mui/material/styles";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Label,
  ResponsiveContainer,
} from "recharts";
import Title from "../../Title.tsx";
import DataService from "@alisa-lib/data-service.ts";
import { Transaction } from "@alisa-backend/accounting/transaction/entities/transaction.entity.ts";
import {
  propertyContext,
  transactionContext,
} from "@alisa-lib/alisa-contexts.ts";
import { WithTranslation, withTranslation } from "react-i18next";
import {
  Avatar,
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";

import { Property } from "@alisa-backend/real-estate/property/entities/property.entity.ts";

type BalanceData = {
  transactionDate: string;
  balance: number;
};

interface PropertyBalanceProps extends WithTranslation {}

function PropertyBalance(props: PropertyBalanceProps) {
  const theme = useTheme();
  const [data, setData] = React.useState<BalanceData[]>([]);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [propertyId, setPropertyId] = React.useState<number>(0);
  const [propertyName, setPropertyName] = React.useState<string>("");

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
  );

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
      setPropertyId(properties[0].id);
    };
    fetchData().then(() => {});
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!propertyId) {
        return;
      }
      const fetchOptions = {
        select: ["transactionDate", "balance"],
        relations: { property: true },
        where: {
          transactionDate: { $between: [startDate, endDate] },
          propertyId: propertyId,
        },
      };

      const dataService = new DataService<Transaction>({
        context: transactionContext,
        fetchOptions: fetchOptions,
      });

      const transactions: Transaction[] = await dataService.search();

      const newData: BalanceData[] = [];
      const transactionBalanceData: BalanceData[] = [];
      const today = now.getDate();

      transactions.forEach((transaction) => {
        const transactionDate = props.t("format.date", {
          val: new Date(transaction.transactionDate),
          formatParams: {
            val: { month: "numeric", day: "numeric" },
          },
        });
        transactionBalanceData.push({
          transactionDate: transactionDate,
          balance: transaction.balance,
        });
      });

      let previousBalance = 0;
      if (transactionBalanceData.length > 0) {
        previousBalance = transactionBalanceData[0].balance;
      }

      for (let i = 0; i < today; i++) {
        const transactionDate = props.t("format.date", {
          val: new Date(now.getFullYear(), now.getMonth(), i + 1),
          formatParams: {
            val: { month: "numeric", day: "numeric" },
          },
        });
        const found = transactionBalanceData.find(
          (item) => item.transactionDate === transactionDate,
        );
        const balance = found ? found.balance : previousBalance;
        previousBalance = balance;
        newData.push({
          transactionDate: transactionDate,
          balance: balance,
        });
      }

      setData(newData);
    };

    fetchData().then(() => {});
  }, [propertyId]);

  const handlePropertyChange = (
    event: React.MouseEvent<HTMLElement>,
    propertyId: number,
  ) => {
    if (!propertyId) {
      return;
    }
    setPropertyId(propertyId);
    const property = properties.find((item) => item.id === propertyId);
    if (property) {
      setPropertyName(property.name);
    }
  };

  return (
    <React.Fragment>
      <Stack direction={"row"}>
        <Title>
          {props.t("balance")} - {propertyName}
        </Title>
        <Box sx={{ textAlign: "right", flexGrow: 1, height: 20 }}>
          <ToggleButtonGroup
            size={"small"}
            value={propertyId}
            exclusive
            onChange={handlePropertyChange}
          >
            {properties.map((item) => (
              <Tooltip title={item.name}>
                <ToggleButton value={item.id} key={item.id}>
                  <Avatar
                    aria-label={item.name}
                    sx={{ width: 32, height: 32 }}
                    src={`/assets/properties/${item.name}.jpg`}
                  ></Avatar>
                </ToggleButton>
              </Tooltip>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Stack>
      <ResponsiveContainer>
        <LineChart
          data={data}
          margin={{
            top: 16,
            right: 16,
            bottom: 0,
            left: 24,
          }}
        >
          <XAxis
            dataKey="transactionDate"
            stroke={theme.palette.text.secondary}
            style={theme.typography.body2}
          />
          <YAxis
            stroke={theme.palette.text.secondary}
            style={theme.typography.body2}
          >
            <Label
              angle={270}
              position="left"
              style={{
                textAnchor: "middle",
                fill: theme.palette.text.primary,
                ...theme.typography.body1,
              }}
            >
              €
            </Label>
          </YAxis>
          <Line
            isAnimationActive={false}
            type="monotone"
            dataKey="balance"
            stroke={theme.palette.primary.main}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </React.Fragment>
  );
}
export default withTranslation(transactionContext.name)(PropertyBalance);
