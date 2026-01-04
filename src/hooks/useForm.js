import { useState, useCallback } from 'react';

export const useForm = (initialValues = {}, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    
    // Limpa o erro do campo assim que o usuário começa a corrigir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    let validationErrors = {};
    if (validate) {
      validationErrors = validate(values);
    }

    // Filtra apenas erros que têm mensagem
    const hasErrors = Object.values(validationErrors).some(error => error);

    if (hasErrors) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return false;
    }

    try {
      await onSubmit(values);
    } catch (error) {
      console.error(error);
      setSubmitError(error.message || "Ocorreu um erro ao enviar o formulário.");
    } finally {
      setIsSubmitting(false);
    }
    return true;
  }, [values, validate]);

  const resetForm = useCallback((newValues) => {
    setValues(newValues || initialValues);
    setErrors({});
    setSubmitError(null);
  }, [initialValues]);

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    handleChange,
    setFieldValue,
    handleSubmit,
    resetForm,
    setValues
  };
};