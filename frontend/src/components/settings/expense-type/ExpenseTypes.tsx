import { WithTranslation, withTranslation } from "react-i18next";

import AlisaDataTable from "../../alisa/datatable/AlisaDataTable.tsx";
import { expenseTypeContext } from "@alisa-lib/alisa-contexts";
import { ExpenseType } from "@alisa-types";
import DataService from "@alisa-lib/data-service";
import AlisaContent from "../../alisa/AlisaContent";

interface ExpenseTypesProps extends WithTranslation {
  onAdd: () => void;
  onEdit: (id: number) => void;
}

function ExpenseTypes({ t, onAdd, onEdit }: ExpenseTypesProps) {
  const handleEdit = (id: number) => {
    onEdit(id);
  };

  const handleAdd = () => {
    onAdd();
  };

  return (
    <AlisaContent headerText={t("expenseTypes")}>
      <AlisaDataTable<ExpenseType>
        t={t}
        dataService={new DataService({ context: expenseTypeContext, fetchOptions: { order: { name: 'ASC' } } })}
        fields={[
          { name: "name" },
          { name: "description" },
          { name: "isTaxDeductible", format: "boolean" },
        ]}
        onNewRow={handleAdd}
        onEdit={handleEdit}
        onOpen={() => {}}
        onDelete={() => {}}
      />
    </AlisaContent>
  );
}

export default withTranslation(expenseTypeContext.name)(ExpenseTypes);
