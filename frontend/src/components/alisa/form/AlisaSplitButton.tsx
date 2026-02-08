import * as React from "react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import { AlisaSelectFieldItem } from "./AlisaSelectField.tsx";
import { Box, Stack } from "@mui/material";
import Typography from "@mui/material/Typography";

function AlisaSplitButton(props: {
  label?: string;
  value: number;
  items: AlisaSelectFieldItem[];
  onChange: (value: number) => void;
  direction?: "row" | "column";
  width?: number;
  color?:
    | "primary"
    | "inherit"
    | "secondary"
    | "success"
    | "error"
    | "info"
    | "warning";
}) {
  const [open, setOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null);
  const width = props.width ? props.width : 175;
  const color = props.color ? props.color : "inherit";
  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event) => {
    if (anchorEl && anchorEl.contains(event.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };

  const handleSelect = (selelctedItem: AlisaSelectFieldItem) => {
    props.onChange(selelctedItem.id);
    setOpen(false);
  };

  const getSelectedIndex = () => {
    if (props.items === undefined || props.items.length === 0) {
      return 0;
    }
    const index = props.items.findIndex((item) => item.id === props.value);
    return index >= 0 ? index : 0;
  };

  return (
    <Stack spacing={1}>
      <Box>
        <Typography variant={"body2"}>{props.label}</Typography>
      </Box>
      <Box>
        <ButtonGroup
          variant="contained"
          ref={setAnchorEl}
          aria-label="Button group with a nested menu"
          color={color}
        >
          <Button sx={{ width: width }} color={color} onClick={handleToggle}>
            {props.items[getSelectedIndex()].name}
          </Button>
          <Button
            size="small"
            aria-controls={open ? "split-button-menu" : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-label="select merge strategy"
            aria-haspopup="menu"
            color={color}
            onClick={handleToggle}
          >
            <ArrowDropDownIcon />
          </Button>
        </ButtonGroup>
        <Popper
          sx={{
            zIndex: 10,
          }}
          open={open}
          anchorEl={anchorEl}
          role={undefined}
          transition
          disablePortal
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin:
                  placement === "bottom" ? "center top" : "center bottom",
              }}
            >
              <Paper sx={{ width: width }}>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList id="split-button-menu" autoFocusItem>
                    {props.items.map((item) => (
                      <MenuItem
                        key={item.id}
                        selected={item.id === props.value}
                        onClick={() => handleSelect(item)}
                      >
                        {item.name}
                      </MenuItem>
                    ))}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Box>
    </Stack>
  );
}

export default AlisaSplitButton;
