import { useEffect } from 'react';
import { toast as showToast } from 'sonner';
import { type Toast } from '~/utils/toast.server';

function AppToast({ toast }: { toast: Toast }) {
  const { id, type, title, description } = toast;
  useEffect(() => {
    setTimeout(() => {
      showToast[type](title, { id, description });
    }, 0);
  }, [description, id, title, type]);
  return null;
}

export default AppToast;
