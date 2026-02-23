import PaymentIcon from "@mui/icons-material/Payment";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import React from "react";
import CheckIcon from "@mui/icons-material/Check";
import EditIcon from "@mui/icons-material/Edit";
import { ClearIcon } from "@mui/x-date-pickers";
import { TransactionTypeName } from "@asset-types";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

interface IconProps {
  size?: "small" | "medium" | "large";
}

const AssetAddIcon: React.FC<IconProps> = (props: IconProps) => {
  return <AddIcon fontSize={props.size} />;
};
const AssetApproveIcon: React.FC<IconProps> = (props: IconProps) => {
  return <CheckIcon fontSize={props.size} />;
};
const AssetCloseIcon: React.FC<IconProps> = (props: IconProps) => {
  return <ClearIcon fontSize={props.size} />;
};
const AssetDeleteIcon: React.FC<IconProps> = (props: IconProps) => {
  return <DeleteIcon fontSize={props.size} />;
};
const AssetDepositIcon: React.FC<IconProps> = (props: IconProps) => {
  return <ArrowCircleDownIcon fontSize={props.size} />;
};
const AssetEditIcon: React.FC<IconProps> = (props: IconProps) => {
  return <EditIcon fontSize={props.size} />;
};
const AssetExpenseIcon: React.FC<IconProps> = (props: IconProps) => {
  return <PaymentIcon fontSize={props.size} />;
};
const AssetImportIcon: React.FC<IconProps> = (props: IconProps) => {
  return <CloudUploadIcon fontSize={props.size} />;
};
const AssetIncomeIcon: React.FC<IconProps> = (props: IconProps) => {
  return <MonetizationOnIcon fontSize={props.size} />;
};
const AssetWithdrawIcon: React.FC<IconProps> = (props: IconProps) => {
  return <ArrowCircleUpIcon fontSize={props.size} />;
};

const iconMap = {
  add: AssetAddIcon,
  approve: AssetApproveIcon,
  close: AssetCloseIcon,
  delete: AssetDeleteIcon,
  deposit: AssetDepositIcon,
  edit: AssetEditIcon,
  expense: AssetExpenseIcon,
  import: AssetImportIcon,
  income: AssetIncomeIcon,
  withdraw: AssetWithdrawIcon,
};

const getIcon = (iconName: TransactionTypeName, props: IconProps) => {
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  return IconComponent ? <IconComponent {...props} /> : undefined;
};

export {
  AssetAddIcon,
  AssetApproveIcon,
  AssetCloseIcon,
  AssetDeleteIcon,
  AssetDepositIcon,
  AssetEditIcon,
  AssetExpenseIcon,
  AssetImportIcon,
  AssetIncomeIcon,
  AssetWithdrawIcon,
  getIcon,
};
