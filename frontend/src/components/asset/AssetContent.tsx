import { ReactElement, ReactNode } from "react";
import Title from "../../Title";
import { Chip, Paper, Stack } from "@mui/material";

interface AssetContentProps {
  headerText?: string;
  chipText?: string;
  icon?: ReactElement | undefined;
  children: ReactNode;
}
function AssetContent(props: AssetContentProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Title>
          {props.headerText}
          {props.chipText && (
            <Chip
              sx={{ marginLeft: 1, padding: 1 }}
              variant="filled"
              icon={props.icon}
              label={props.chipText}
            ></Chip>
          )}
        </Title>
        {props.children}
      </Stack>
    </Paper>
  );
}

export default AssetContent;
