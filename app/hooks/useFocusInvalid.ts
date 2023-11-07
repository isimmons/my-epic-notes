import { useEffect } from 'react';

export function useFocusInvalid(
  formEl: HTMLFormElement | null,
  formDependants: Array<boolean>,
) {
  useEffect(() => {
    if (!formEl) return;
    if (!formDependants.some(d => true)) return;

    if (formEl.matches('[aria-invalid="true"]')) {
      formEl.focus();
    } else {
      const firstInvalid = formEl.querySelector('[aria-invalid="true"]');
      if (firstInvalid instanceof HTMLElement) {
        firstInvalid.focus();
      }
    }
  }, [formEl, formDependants]);
}
