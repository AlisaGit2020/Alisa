import { WithTranslation, withTranslation } from "react-i18next";

import AlisaDataTable from "../../alisa/datatable/AlisaDataTable.tsx";
import { incomeTypeContext } from "@alisa-lib/alisa-contexts";
import { IncomeType } from "@alisa-backend/accounting/income/entities/income-type.entity";
import DataService from "@alisa-lib/data-service";
import AlisaContent from "../../alisa/AlisaContent";

interface IncomeTypesProps extends WithTranslation {
  onAdd: () => void;
  onEdit: (id: number) => void;
}

function IncomeTypes({ t, onAdd, onEdit }: IncomeTypesProps) {
  const handleEdit = (id: number) => {
    onEdit(id);
  };

  const handleAdd = () => {
    onAdd();
  };

  return (
    <AlisaContent headerText={t("incomeTypes")}>
      <AlisaDataTable<IncomeType>
        t={t}
        dataService={new DataService({ context: incomeTypeContext })}
        fields={[{ name: "name" }, { name: "description" }]}
        onNewRow={handleAdd}
        onEdit={handleEdit}
        onOpen={() => {}}
        onDelete={() => {}}
      />
    </AlisaContent>
  );
}

export default withTranslation(incomeTypeContext.name)(IncomeTypes);
