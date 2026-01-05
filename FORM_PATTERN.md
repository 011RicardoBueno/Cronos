# Frontend Form Pattern (Official)

## Purpose

This document defines the official frontend form pattern for the Cronos SaaS, based on the `CustomerForm.jsx` implementation. Its purpose is to ensure consistency, maintainability, and adherence to established engineering, UX, and growth principles across all forms within the application. By centralizing these guidelines, we aim to streamline development, improve user experience, and provide a clear reference for both human developers and AI code assistants.

## Responsibilities Split (Form vs Hook vs Backend)

The Cronos frontend form architecture enforces a clear separation of concerns to ensure maintainability, scalability, and security.

*   **Form Component (e.g., `CustomerForm.jsx`)**:
    *   Manages local UI state for form inputs.
    *   Handles basic, immediate client-side validation for UX optimization (e.g., required fields, format hints).
    *   Renders form elements, loading indicators, and error messages based on states provided by the associated hook.
    *   Triggers form submission via the associated custom hook.
    *   Renders upsell components or other plan-related UI based on `errorCode` from the hook.
    *   Never implements business logic or hardcodes business limits.

*   **Custom Hook (e.g., `useCreateCustomer.js`)**:
    *   Encapsulates the asynchronous logic for form submission (e.g., API calls).
    *   Manages loading, general error, and specific `errorCode` states.
    *   Interprets backend API responses, extracting relevant error codes for frontend consumption.
    *   Provides a `reset` mechanism to clear its internal states.
    *   Acts as the single source of truth for the form's submission status and server-side feedback.
    *   Never implements UI rendering directly.

*   **Backend (Supabase Edge Functions / Database Policies)**:
    *   Enforces all business rules, data integrity, and security policies.
    *   Performs comprehensive server-side validation.
    *   Returns specific `errorCodes` for business rule violations (e.g., `PLAN_LIMIT_REACHED`, `DUPLICATE_CUSTOMER`, `INVALID_PHONE`).
    *   Triggers upsell conditions based on plan limits or feature access.
    *   Never dictates specific frontend UI implementation details.

## Required Building Blocks

Every form in Cronos must incorporate the following elements:

*   **State Management**: `useState` for local form data.
*   **Custom Hook Integration**: A dedicated custom hook (e.g., `useCreateCustomer`) to handle submission logic, loading states, and error propagation. This hook must expose `loading`, `error`, `errorCode`, and a `reset` function.
*   **Input Elements**: Standard HTML input types, appropriately styled and accessible.
*   **Loading Indicators**: Visual feedback (e.g., `Loader2` icon from `lucide-react`) when the form is submitting.
*   **Error Display**: A clear, prominent area to display both frontend validation errors and backend `error` messages.
*   **Call-to-Action Buttons**: Submit and Cancel/Close buttons. The Submit button must reflect the `loading` state.
*   **Conditional Upsell Component**: A dedicated component (e.g., `PlanLimitUpsell`) to be rendered when the associated hook returns an `errorCode` indicating a plan-related restriction.

## Error Handling Contract

Frontend forms and their associated hooks must adhere to a strict error handling contract:

*   **Hook (`use*`):**
    *   Must expose `error` (a general human-readable message) and `errorCode` (a machine-readable string, e.g., `PLAN_LIMIT_REACHED`, `DUPLICATE_CUSTOMER`).
    *   `errorCode` values should map directly to known business rule violations or system states.
    *   Must reset `error` and `errorCode` on new input changes or successful submission.
*   **Form Component:**
    *   Must display the `error` message to the user.
    *   Must use `errorCode` to trigger specific UI behaviors (e.g., render upsell, highlight specific fields).
    *   Must have a mapping (e.g., `ERROR_MESSAGES` object) to provide localized/user-friendly messages for known `errorCodes`.
    *   Should allow user input to clear `error` states if the error is tied to a specific input (e.g., typing in a field clears a "field required" error).

## Validation Rules (Frontend vs Backend)

A clear distinction governs validation:

*   **Frontend Validation (UX Optimization)**:
    *   **Purpose**: Improve immediate user feedback, prevent obviously invalid submissions, and guide user input.
    *   **Scope**: Basic format checks (e.g., valid email regex, minimum length for phone numbers), required field checks (empty).
    *   **Implementation**: Typically within the form component's `handleSubmit` or `handleChange` functions.
    *   **Constraint**: Never reimplement complex business rules or hardcode limits that are subject to change (e.g., plan quotas).
*   **Backend Validation (Business Logic Enforcement)**:
    *   **Purpose**: Guarantee data integrity, enforce all business rules, and protect system resources. This is the ultimate source of truth.
    *   **Scope**: All business-critical validation, uniqueness constraints (e.g., duplicate customer phone), plan-based limits (e.g., `PLAN_LIMIT_REACHED`), permissions.
    *   **Implementation**: Supabase Edge Functions, database RLS policies, and service layers.
    *   **Output**: Must return distinct `errorCodes` for the frontend to interpret.

## Loading & Disabled States

All interactive form elements (inputs, buttons) must visually reflect the form's submission status:

*   **Inputs**: Must be `disabled` when the form is in a `loading` state (i.e., `loading` from the custom hook is `true`).
*   **Submit Buttons**: Must be `disabled` and typically display a loading indicator (e.g., spinner icon) when the form is `loading`.
*   **Cancel Buttons**: Should also be `disabled` during the `loading` state to prevent race conditions or unexpected state changes.

## Upsell Handling Pattern

Upsell flows are a critical part of Cronos's growth strategy and must be handled consistently:

*   **Trigger**: An upsell is triggered exclusively by a specific `errorCode` returned from the backend via the custom hook (e.g., `PLAN_LIMIT_REACHED`).
*   **UI Isolation**: The upsell user interface (e.g., `PlanLimitUpsell` component) must be a separate, dedicated React component.
*   **Conditional Rendering**: The main form component will conditionally render the upsell component when the relevant `errorCode` is detected, replacing the standard form UI.
*   **Actions**: The upsell component should provide clear call-to-actions, typically:
    *   An "Upgrade Now" button that navigates to the subscription/billing page.
    *   A "Cancel" or "Go Back" button that allows the user to dismiss the upsell and return to the form (often resetting the form's error state).
*   **No Hardcoding**: Forms must never hardcode business limits or directly check user plan types to determine upsell conditions. This logic resides solely in the backend and is communicated via `errorCode`.

## Accessibility Rules

Forms must adhere to Web Content Accessibility Guidelines (WCAG) to ensure usability for all users:

*   **Labels**: All input fields must have explicitly associated `<label>` elements using the `htmlFor`/`id` pattern.
*   **Keyboard Navigation**: Forms must be fully navigable and operable using only a keyboard. Ensure logical tab order.
*   **Error Announcements**: Error messages should be programmatically associated with their respective fields (e.g., `aria-describedby`) and ideally announced to screen reader users (e.g., using `aria-live` regions for dynamic error displays).
*   **State Feedback**: `disabled` and `required` attributes should be correctly applied to inputs.
*   **Semantic HTML**: Use appropriate HTML5 input types (e.g., `type="email"`, `type="tel"`) to leverage browser-native validation and keyboard optimizations.

## Anti-Patterns (What NOT to do)

These practices are forbidden in Cronos form development:

*   **Hardcoding Business Limits**: Directly embedding `FREE_PLAN_LIMIT` or similar values in form components for validation or upsell logic.
*   **Reimplementing Backend Validation**: Writing complex business rule validation in the frontend that duplicates backend logic (beyond basic UX improvements).
*   **Feature Checks in UI**: Deciding whether a user can perform an action based on their subscription plan directly within the form component without relying on backend `errorCodes` or `usePlanFeatures` hook.
*   **Silent Blocking**: Preventing an action without clear user feedback or an explanation (e.g., a disabled button with no tooltip or error message).
*   **Inconsistent Error Messages**: Using disparate error messaging styles or locations across different forms.
*   **Direct API Calls in Components**: Making `fetch` or `axios` calls directly from a form component; always abstract this into a custom hook or service.

## Reference Implementation (CustomerForm)

The `src/pages/customers/CustomerForm.jsx` component and its accompanying `src/hooks/useCreateCustomer.js` hook serve as the canonical example for implementing forms in Cronos.

**Key aspects demonstrated:**

*   **Separation of Concerns**: `CustomerForm.jsx` handles UI and local state, while `useCreateCustomer.js` manages API interaction and state (`loading`, `error`, `errorCode`).
*   **Frontend Validation**: Basic phone number length validation for immediate user feedback.
*   **Backend Error Handling**: Displays `errorCode`-driven messages from `ERROR_MESSAGES` and general `error` messages.
*   **Loading/Disabled States**: Inputs and buttons are disabled during `loading`.
*   **Upsell Integration**: Conditionally renders `PlanLimitUpsell` when `errorCode === 'PLAN_LIMIT_REACHED'`.
*   **Reset Mechanism**: The `reset` function from `useCreateCustomer` is used to clear errors on input change or cancel.

**Code Snippets:**

```javascript
// src/hooks/useCreateCustomer.js (Core Logic)
import { useState } from 'react';
import { customerService } from '@/services/customerService';

export function useCreateCustomer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  const createCustomer = async (payload) => {
    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const { data, error: apiError } = await customerService.create(payload);

      if (apiError) {
        const code = apiError?.code || 'INTERNAL_ERROR';
        const message = apiError?.error || 'Failed to create customer';

        setErrorCode(code);
        setError(message);
        return { success: false, error: apiError };
      }
      return { success: true, data };
    } catch (err) {
      const message = err.message || 'An unexpected error occurred';
      setError(message);
      setErrorCode('INTERNAL_ERROR');
      return { success: false, error: { error: message, code: 'INTERNAL_ERROR' } };
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setError(null); setErrorCode(null); };

  return { createCustomer, loading, error, errorCode, reset };
}
```

```javascript
// src/pages/customers/CustomerForm.jsx (Error Display & Upsell Trigger)
// ... imports
import { Loader2, AlertCircle, Lock, CheckCircle } from 'lucide-react';

const ERROR_MESSAGES = {
  DUPLICATE_CUSTOMER: 'Este cliente já está cadastrado.',
  INVALID_PHONE: 'Número de telefone inválido.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  INTERNAL_ERROR: 'Ocorreu um erro inesperado. Tente novamente.',
};

function PlanLimitUpsell({ onUpgrade, onCancel }) { /* ... component implementation ... */ }

export default function CustomerForm({ onSuccess, onCancel }) {
  // ... state and handlers
  const { createCustomer, loading, error, errorCode, reset } = useCreateCustomer();
  // ...
  // Upsell View for Plan Limit Reached
  if (errorCode === 'PLAN_LIMIT_REACHED') {
    return (
      <PlanLimitUpsell 
        onUpgrade={() => navigate('/admin/settings/subscription')}
        onCancel={handleCancel}
      />
    );
  }

  const displayedError = validationError || (errorCode && ERROR_MESSAGES[errorCode]) || error;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {displayedError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2" role="alert">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{displayedError}</span>
        </div>
      )}
      {/* ... form inputs */}
      <div className="pt-4 flex gap-3">
        <button 
          type="button" 
          onClick={handleCancel} 
          disabled={loading}
          className="flex-1 py-3 rounded-xl font-bold text-brand-muted hover:bg-brand-surface transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-colors flex justify-center items-center disabled:opacity-70">
          {loading ? <Loader2 className="animate-spin" /> : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
}
```

```javascript
// src/pages/customers/CustomerForm.jsx (Frontend Validation Example)
// ... inside handleSubmit
    const cleanPhone = formData.phone.trim();
    if (cleanPhone.length < 8) {
      setValidationError('O telefone deve ter pelo menos 8 dígitos.');
      return;
    }
```

```javascript
// src/pages/customers/CustomerForm.jsx (Reset on Change)
// ... inside handleChange
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errorCode) reset(); // Reset hook error state
    if (validationError) setValidationError(null); // Reset local validation error
  };
```

**Do and Don't Examples:**

**DO:** Use an `errorCode` from the backend to trigger specific UI, like an upsell, and display user-friendly messages.
```javascript
// DO: Use an errorCode from the backend to trigger specific UI, like an upsell.
if (errorCode === 'PLAN_LIMIT_REACHED') {
  return <PlanLimitUpsell onUpgrade={handleUpgrade} onCancel={handleCancel} />;
}

// DO: Display a user-friendly message based on a backend errorCode, mapping to predefined messages.
const displayedError = validationError || (errorCode && ERROR_MESSAGES[errorCode]) || error;
// ... render displayedError in UI
```

**DON'T:** Hardcode business limits in the frontend, reimplement complex backend validation, or make direct API calls from the component.
```javascript
// DON'T: Hardcode business limits in the frontend.
// const FREE_PLAN_LIMIT = 50; 
// if (customerCount >= FREE_PLAN_LIMIT) { /* This logic should be on the backend */ }

// DON'T: Reimplement complex business logic or feature checks directly in the component.
// if (user.plan === 'free' && tryingToAddTooManyCustomers) { /* This logic should be handled by backend and communicated via errorCode */ }

// DON'T: Make direct API calls from the component.
// const handleSubmit = async (e) => {
//   e.preventDefault();
//   setLoading(true);
//   const response = await fetch('/api/create-customer', { method: 'POST', body: JSON.stringify(formData) });
//   // ... handle response directly here (use a hook instead)
// };
```