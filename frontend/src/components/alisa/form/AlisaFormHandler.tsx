import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import AlisaForm from "./AlisaForm";
import DataService from "../../../lib/data-service";
import AlisaLoadingProgress from "../AlisaLoadingProgress";
import { useToast } from "../toast";
import { AxiosError } from "axios";
import { useFormValidation, FieldRules } from "../../../lib/useFormValidation";

interface AlisaFormHandlerProps<T extends object> {
  formComponents?: React.JSX.Element;
  renderForm?: (fieldErrors: Partial<Record<keyof T, string>>) => React.JSX.Element;
  id?: number;
  data?: T;
  dataService: DataService<T>;
  translation: {
    submitButton: string;
    cancelButton: string;
    errorMessageTitle?: string;
    validationMessageTitle?: string;
  };
  validationRules?: Partial<Record<keyof T, FieldRules>>;
  submitButtonIcon?: ReactNode;
  onCancel: () => void;
  onAfterSubmit: () => void;
  onSetData: React.Dispatch<React.SetStateAction<T>>;
  onSaveResult?: (result: T) => Promise<void>;
}

function AlisaFormHandler<T extends object>(props: AlisaFormHandlerProps<T>) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const [validationMessage, setValidationMessage] = React.useState<string[]>(
    [],
  );
  const [dataService] = React.useState<DataService<T>>(props.dataService);
  const [ready, setReady] = React.useState<boolean>(false);

  const { fieldErrors, validate, clearErrors } = useFormValidation<T>(
    props.validationRules ?? {},
    t
  );

  React.useEffect(() => {
    const fetchData = async (id: number) => {
      return await dataService.read(id);
    };

    if (props.id) {
      fetchData(props.id).then((data: T) => {
        props.onSetData(data);
        setReady(true);
      });
    } else {
      setReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    resetErrorMessages();
    clearErrors();

    if (props.data === undefined) {
      setErrorMessage("Cannot save when data is missing");
      return;
    }

    // Frontend validation
    if (props.validationRules && !validate(props.data)) {
      showToast({ message: t("common:validation.checkFields"), severity: "warning" });
      return;
    }

    try {
      const result = await dataService.save(props.data, props.id);
      showToast({ message: t("common:toast.saveSuccess"), severity: "success" });
      if (props.onSaveResult) {
        await props.onSaveResult(result);
      }
      props.onAfterSubmit();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 400) {
          // Backend validation errors
          const message = error.response.data.message;
          if (Array.isArray(message)) {
            setValidationMessage(message);
          } else {
            setValidationMessage([message]);
          }
          return;
        }
        if (error.response?.data?.message) {
          setErrorMessage(error.response.data.message);
          return;
        }
      }

      setErrorMessage(JSON.stringify(error));
    }
  };

  const resetErrorMessages = () => {
    setValidationMessage([]);
    setErrorMessage("");
  };

  // Determine which form components to render
  const formContent = props.renderForm
    ? props.renderForm(fieldErrors)
    : props.formComponents;

  if (ready) {
    return (
      <AlisaForm
        submitButtonIcon={props.submitButtonIcon}
        submitButtonText={props.translation.submitButton}
        cancelButtonText={props.translation.cancelButton}
        errorMessageTitle={props.translation.errorMessageTitle}
        validationMessageTitle={props.translation.validationMessageTitle}
        formComponents={formContent!}
        errorMessage={errorMessage}
        validationMessage={validationMessage}
        onSubmit={handleSubmit}
        onCancel={props.onCancel}
      ></AlisaForm>
    );
  } else {
    return <AlisaLoadingProgress></AlisaLoadingProgress>;
  }
}

export default AlisaFormHandler;
