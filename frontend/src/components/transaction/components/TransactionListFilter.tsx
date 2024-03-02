import { WithTranslation, withTranslation } from "react-i18next";
import { propertyContext, transactionContext } from "@alisa-lib/alisa-contexts";
import AlisaSelect from "../../../components/alisa/AlisaSelect";
import DataService from "@alisa-lib/data-service";
import { Property } from "@alisa-backend/real-estate/property/entities/property.entity";
import { Stack } from "@mui/material";
import AlisaSelectField from "../../../components/alisa/form/AlisaSelectField";
import { TFunction } from "i18next";

interface TransactionListFilterProps extends WithTranslation {
    onChange: (fieldName: string, selectedValue: number) => void
    filter: TransactionFilter
}

export type TransactionFilter = {
    propertyId: number
    year: number
    month: number
}

function TransactionListFilter({ t, onChange, filter }: TransactionListFilterProps) {
    const getYearList = () => {
        const currentYear = new Date().getFullYear();
        const startYear = 2020;
        const endYear = currentYear + 1;

        const yearList = [];

        for (let year = startYear; year <= endYear; year++) {
            yearList.push({ id: year, name: year.toString() });
        }

        return yearList;
    };
    
    return (
        <Stack spacing={2} marginTop={10} width={400} padding={3}>
            <AlisaSelect<TransactionFilter, Property>
                dataService={new DataService({
                    context: propertyContext,
                    fetchOptions: {
                        order: {
                            name: 'ASC'
                        }
                    }
                })}
                label={t('property')}
                onHandleChange={onChange}
                fieldName={'propertyId'}
                value={filter.propertyId}
            ></AlisaSelect>
            <AlisaSelectField
                label={t('year')}
                value={filter.year}
                onChange={(e) => onChange('year', Number(e.target.value))}
                items={getYearList()}
            ></AlisaSelectField>
            <AlisaSelectField
                label={t('month')}
                value={filter.month}
                onChange={(e) => onChange('month', Number(e.target.value))}
                items={ getMonthList(t)}
            ></AlisaSelectField>
        </Stack>
    )
}

export default withTranslation(transactionContext.name)(TransactionListFilter);

export const getMonthList = (t: TFunction) => {
    return [
        { id: 1, name: t('january') },
        { id: 2, name: t('february') },
        { id: 3, name: t('march') },
        { id: 4, name: t('april') },
        { id: 5, name: t('may') },
        { id: 6, name: t('june') },
        { id: 7, name: t('july') },
        { id: 8, name: t('august') },
        { id: 9, name: t('september') },
        { id: 10, name: t('october') },
        { id: 11, name: t('november') },
        { id: 12, name: t('december') },
    ]
};