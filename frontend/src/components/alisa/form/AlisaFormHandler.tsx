import React from "react"
import AlisaForm from "./AlisaForm"
import DataService from "../../../lib/data-service"
import { error } from "console"


function AlisaFormHandler<T extends { id: number }>(props: {
    formComponents: JSX.Element
    id?: number
    data?: T 
    dataService: DataService<T>
    submitButtonText: string
    cancelButtonText: string
    onCancel: () => void
    onAfterSubmit: () => void
    onSetData: React.Dispatch<React.SetStateAction<T>>;
}) {
    const [errorMessage] = React.useState<string>()
    const [validationMessage, setValidationMessage] = React.useState<string[]>([])

    React.useEffect(() => {
        const fetchData = async (id: number) => {
            const data = await props.dataService.read(id);            
            return data
        }

        if (props.id) {
            fetchData((props.id))
                .then(props.onSetData)
        }    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSubmit = async () => {

        if (props.data === undefined) {
            throw new Error('Cannot save when data is missing');
        }

        try{
            const result = await props.dataService.save(props.data, props.id)
            
            if (result.constructor.name === 'ValidationError') {
                setValidationMessage([])
                return;
            }
            
            props.onAfterSubmit()

        } catch (error: unknown) {
            //setErrorMessage(error)
        }        
                
    }

    return (
        <AlisaForm
            submitButtonText={props.submitButtonText}
            cancelButtonText={props.cancelButtonText}
            formComponents={props.formComponents}
            errorMessage={errorMessage}
            validationMessage={validationMessage}
            onSubmit={handleSubmit}
            onCancel={props.onCancel}
        ></AlisaForm>
    )
}

export default AlisaFormHandler