import { DataSaveResultDto } from "@alisa-backend/common/dtos/data-save-result.dto.ts";
import { DataSaveResultRowDto } from "@alisa-backend/common/dtos/data-save-result.dto.ts";
import { TFunction } from "i18next";
import Typography from "@mui/material/Typography";
import { Box, Chip, Stack, Tooltip } from "@mui/material";

interface AlisaDataSaveResultProps {
  result: DataSaveResultDto;
  visible: boolean;
  t: TFunction;
}

function AlisaDataSaveResult(props: AlisaDataSaveResultProps) {
  if (!props.visible) {
    return null;
  }
  return (
    <>
      <Stack direction={"row"} spacing={2} marginTop={2} marginBottom={2}>
        <Tooltip title={props.t("rowsSucceeded")}>
          <Chip color={"success"} label={props.result.rows.success}></Chip>
        </Tooltip>
        <Tooltip title={props.t("rowsFailed")}>
          <Chip color={"error"} label={props.result.rows.failed}></Chip>
        </Tooltip>
      </Stack>

      <Typography variant={"body2"}>
        {props.result.results.map((row: DataSaveResultRowDto) => (
          <Stack direction={"row"} spacing={2} sx={{ padding: 0.5 }}>
            {row.statusCode === 200 ? (
              <Box color={"success.main"}>✅</Box>
            ) : (
              <Box color={"error.main"}>❌</Box>
            )}
            <Box key={row.id}>
              [#{row.id}], {row.message}
            </Box>
          </Stack>
        ))}
      </Typography>
    </>
  );
}

export default AlisaDataSaveResult;
