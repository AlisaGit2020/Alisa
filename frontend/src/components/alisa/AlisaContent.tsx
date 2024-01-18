import Title from '../../Title';
import { Paper, Stack } from "@mui/material"

interface AlisaContentProps {
    headerText: string
    content: JSX.Element
}
function AlisaContent({ headerText, content }: AlisaContentProps) {
    return (
        <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
                <Title>{headerText}</Title>
                {content}
            </Stack>

        </Paper>
    )
}

export default AlisaContent