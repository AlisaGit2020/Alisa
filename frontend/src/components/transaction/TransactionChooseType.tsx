import { Stack, Box, Button } from "@mui/material";
import AlisaContent from "../alisa/AlisaContent";
import PaymentIcon from '@mui/icons-material/Payment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { WithTranslation, withTranslation } from "react-i18next";
import { transactionContext } from "@alisa-contexts";

function TransactionChooseType({t}: WithTranslation) {
    return (
        <AlisaContent
            headerText={t('add')}
            content={(
                <Stack spacing={2}>
                    <Box>{t('chooseTransactionType')}</Box>
                    <Stack direction={'row'} spacing={2}>
                        <Button variant="outlined" size="large" startIcon={<PaymentIcon />}
                            href={`${transactionContext.routePath}/add/expense`}
                        >{t('expense')}</Button>
                        <Button variant="outlined" size="large" startIcon={<MonetizationOnIcon />}
                            href={`${transactionContext.routePath}/add/income`}
                        >{t('income')}</Button>
                    </Stack>
                </Stack>

            )}
        ></AlisaContent>
    )
}

export default withTranslation(transactionContext.name)(TransactionChooseType);