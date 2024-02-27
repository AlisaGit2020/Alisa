import { ReactNode } from 'react';
import Title from '../../Title';
import { Paper, Stack } from "@mui/material"

interface AlisaContentProps {
    headerText: string
    children: ReactNode
}
function AlisaContent( props: AlisaContentProps ) {
    return (
        <Paper sx={{ p: 2 }}>
            <Stack spacing={4}>
                <Title>{props.headerText}</Title>
                {props.children}
            </Stack>

        </Paper>
    )
}

export default AlisaContent