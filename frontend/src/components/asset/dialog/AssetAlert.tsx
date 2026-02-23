import { Alert, AlertColor, Box } from "@mui/material"

function AssetAlert(props: {
    severity: AlertColor,
    title?: string
    content?: string | string[]
}) {
    
    if (props.content === undefined || props.content?.length == 0) {
        return;
    }

    return (        
        <Alert severity={props.severity}>
            {(props.title !== undefined) && (
                <b>{props.title}</b>
            )}
            <Box>
                {(Array.isArray(props.content) && props.content.length > 0) ? (
                    props.content.map((item, index) => (
                        <Box key={index}>
                            {item}
                        </Box>
                    ))
                ) : (
                    props.content
                )}
            </Box>
        </Alert>
    )
}

export default AssetAlert