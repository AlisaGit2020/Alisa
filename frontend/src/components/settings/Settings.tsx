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
import ThemeSettings from './theme/ThemeSettings';

function Settings() {
    const { page = 'expense-types', action = '', idParam } = useParams();
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

    const parsedId = idParam ? Number(idParam) : undefined;

    return (

        <Grid container>
            <Grid size={{ lg: 3 }} >
                <SettingsMenu onClick={handleMenuClick} selectedItem={page as SettingsPage} ></SettingsMenu>
            </Grid>
            <Grid size={{ xs: 12, lg: 9 }}>
                {getContent(SettingsPage.ExpenseTypes, Action.List,
                    <ExpenseTypes
                        onAdd={() => navigate('/settings/expense-types/add')}
                        onEdit={(id) => navigate(`/settings/expense-types/edit/${id}`)}
                    />
                )}
                {getContent(SettingsPage.ExpenseTypes, Action.Add,
                    <ExpenseTypeForm
                        onCancel={() => navigate('/settings/expense-types')}
                        onAfterSubmit={() => navigate('/settings/expense-types')}
                    />
                )}
                {getContent(SettingsPage.ExpenseTypes, Action.Edit,
                    <ExpenseTypeForm
                        id={parsedId}
                        onCancel={() => navigate('/settings/expense-types')}
                        onAfterSubmit={() => navigate('/settings/expense-types')}
                    />
                )}

                {getContent(SettingsPage.IncomeTypes, Action.List,
                    <IncomeTypes
                        onAdd={() => navigate('/settings/income-types/add')}
                        onEdit={(id) => navigate(`/settings/income-types/edit/${id}`)}
                    />
                )}
                {getContent(SettingsPage.IncomeTypes, Action.Add,
                    <IncomeTypeForm
                        onCancel={() => navigate('/settings/income-types')}
                        onAfterSubmit={() => navigate('/settings/income-types')}
                    />
                )}
                {getContent(SettingsPage.IncomeTypes, Action.Edit,
                    <IncomeTypeForm
                        id={parsedId}
                        onCancel={() => navigate('/settings/income-types')}
                        onAfterSubmit={() => navigate('/settings/income-types')}
                    />
                )}

                {getContent(SettingsPage.LoanSettings, Action.List, <LoanSettings></LoanSettings>)}

                {getContent(SettingsPage.Theme, Action.List, <ThemeSettings></ThemeSettings>)}
            </Grid>
        </Grid>

    )
}

export enum SettingsPage {
    ExpenseTypes = 'expense-types',
    IncomeTypes = 'income-types',
    LoanSettings = 'loan-settings',
    Theme = 'theme'
}

export enum Action {
    Add = 'add',
    Edit = 'edit',
    List = ''
}

export default withTranslation('settings')(Settings)
