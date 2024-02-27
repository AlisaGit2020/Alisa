import { WithTranslation, withTranslation } from "react-i18next"

import AlisaDataTable from "../../alisa/AlisaDataTable"
import { incomeTypeContext } from "@alisa-lib/alisa-contexts"
import { IncomeType } from "@alisa-backend/accounting/income/entities/income-type.entity"
import DataService from "@alisa-lib/data-service"
import { useNavigate } from "react-router-dom"
import AlisaContent from "../../alisa/AlisaContent"

function IncomeTypes({ t }: WithTranslation) {
    const navigate = useNavigate()

    const handleEdit = (id: number) => {
        navigate(`${incomeTypeContext.routePath}/edit/${id}`)
    }
    return (
        <AlisaContent headerText={t('incomeTypes')}>
            <AlisaDataTable<IncomeType>
                t={t}
                dataService={new DataService({ context: incomeTypeContext })}
                fields={[
                    { name: 'name' },
                    { name: 'description' },
                ]}
                onNewRow={() => navigate(`${incomeTypeContext.routePath}/add`)}
                onEdit={handleEdit}
                onOpen={() => { }}
            />
        </AlisaContent>
    )
}

export default withTranslation(incomeTypeContext.name)(IncomeTypes)