import PaymentIcon from "@mui/icons-material/Payment";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import React from "react";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import { ClearIcon } from "@mui/x-date-pickers";

interface IconProps {
  size?: "small" | "medium" | "large";
}

const AlisaApproveIcon: React.FC<IconProps> = (props: IconProps) => {
  return <CheckIcon fontSize={props.size} />;
};
const AlisaCloseIcon: React.FC<IconProps> = (props: IconProps) => {
  return <ClearIcon fontSize={props.size} />;
};
const AlisaDepositIcon: React.FC<IconProps> = (props: IconProps) => {
  return <ArrowCircleDownIcon fontSize={props.size} />;
};
const AlisaEditIcon: React.FC<IconProps> = (props: IconProps) => {
  return <EditIcon fontSize={props.size} />;
};
const AlisaExpenseIcon: React.FC<IconProps> = (props: IconProps) => {
  return <PaymentIcon fontSize={props.size} />;
};
const AlisaImportIcon: React.FC<IconProps> = (props: IconProps) => {
  return <CloudUploadIcon fontSize={props.size} />;
};
const AlisaIncomeIcon: React.FC<IconProps> = (props: IconProps) => {
  return <MonetizationOnIcon fontSize={props.size} />;
};
const AlisaWithdrawIcon: React.FC<IconProps> = (props: IconProps) => {
  return <ArrowCircleUpIcon fontSize={props.size} />;
};

const iconMap = {
  approve: AlisaApproveIcon,
  close: AlisaCloseIcon,
  deposit: AlisaDepositIcon,
  edit: AlisaEditIcon,
  expense: AlisaExpenseIcon,
  import: AlisaImportIcon,
  income: AlisaIncomeIcon,
  withdraw: AlisaWithdrawIcon,
};

const getIcon = (iconName: keyof typeof iconMap, props: IconProps) => {
  const IconComponent = iconMap[iconName];
  return IconComponent ? <IconComponent {...props} /> : undefined;
};

export {
  AlisaApproveIcon,
  AlisaCloseIcon,
  AlisaDepositIcon,
  AlisaEditIcon,
  AlisaExpenseIcon,
  AlisaImportIcon,
  AlisaIncomeIcon,
  AlisaWithdrawIcon,
  getIcon,
};
