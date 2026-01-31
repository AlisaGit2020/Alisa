import { Box, Grid } from '@mui/material'
import { withTranslation } from 'react-i18next';
import ExpenseTypes from './expense-type/ExpenseTypes';
import SettingsMenu from './components/SettingsMenu';
import { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ExpenseTypeForm from './expense-type/ExpenseTypeForm';
import IncomeTypes from './income-type/IncomeTypes';
import IncomeTypeForm from './income-type/IncomeTypeForm';
import LoanSettings from './loan-settings/LoanSettings';

function Settings() {
    const { page = 'expense-types', action = ''} = useParams();
    const navigate = useNavigate();

    const handleMenuClick = (selectedItem: SettingsPage) => {
        navigate(`/settings/${selectedItem}`)
    }


    const getContent = (iPage: SettingsPage, iAction: Action, content: ReactNode) => {
        if (page === iPage && action === iAction) {
            return (
                <Box>{content}</Box>
            )
        }
        return ''
    }

    return (

        <Grid container>
            <Grid size={{ lg: 3 }} >
                <SettingsMenu onClick={handleMenuClick} selectedItem={page as SettingsPage} ></SettingsMenu>
            </Grid>
            <Grid size={{ xs: 12, lg: 9 }}>
                {getContent(SettingsPage.ExpenseTypes, Action.List, <ExpenseTypes></ExpenseTypes>)}
                {getContent(SettingsPage.ExpenseTypes, Action.Add, <ExpenseTypeForm></ExpenseTypeForm>)}
                {getContent(SettingsPage.ExpenseTypes, Action.Edit, <ExpenseTypeForm></ExpenseTypeForm>)}

                {getContent(SettingsPage.IncomeTypes, Action.List, <IncomeTypes></IncomeTypes>)}
                {getContent(SettingsPage.IncomeTypes, Action.Add, <IncomeTypeForm></IncomeTypeForm>)}
                {getContent(SettingsPage.IncomeTypes, Action.Edit, <IncomeTypeForm></IncomeTypeForm>)}

                {getContent(SettingsPage.LoanSettings, Action.List, <LoanSettings></LoanSettings>)}
            </Grid>
        </Grid>

    )
}

export enum SettingsPage {
    ExpenseTypes = 'expense-types',
    IncomeTypes = 'income-types',
    LoanSettings = 'loan-settings'
}

export enum Action {
    Add = 'add',
    Edit = 'edit',
    List = ''
}

export default withTranslation('settings')(Settings)
