import { propertyContext, transactionContext } from "@alisa-lib/alisa-contexts"
import Transactions from "./Transactions"
import { WithTranslation, withTranslation } from "react-i18next"
import { Paper } from "@mui/material"
import AlisaSelect from "../alisa/AlisaSelect"
import DataService from "@alisa-lib/data-service"
import { Property } from "@alisa-backend/real-estate/property/entities/property.entity"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

function TransactionMain({ t }: WithTranslation) {
    let { propertyId } = useParams();
    propertyId = propertyId ?? '0';

    const [property, setProperty] = useState<number>(Number(propertyId))
    const navigate = useNavigate()

    const handleChange = (fieldName: string, selectedValue: number) => {
        if (fieldName === 'property') {
            navigate(`${transactionContext.routePath}/${selectedValue}`)
            setProperty(selectedValue)
        }
    }

    return (
        <>
            <Paper sx={{ p: 2, marginBottom: 3, display: 'flex', flexDirection: 'column' }}>
                <AlisaSelect<{ property: number }, Property>
                    dataService={new DataService({
                        context: propertyContext,
                        fetchOptions: {
                            order: {
                                name: 'ASC'
                            }
                        }
                    })}
                    label={t('property')}
                    onHandleChange={handleChange}
                    fieldName={'property'}
                    value={property}
                ></AlisaSelect>
            </Paper>
            <Transactions
                filter={{ propertyId: property }}
            ></Transactions>
        </>
    )

}

export default withTranslation(transactionContext.name)(TransactionMain)