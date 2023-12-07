import { useEffect } from 'react';
import { toast as showToast } from 'sonner';

function AppToast({ toast }: { toast: any }) {
  const { id, type, title, description } = toast as {
    id: string;
    type: 'success' | 'message';
    title: string;
    description: string;
  };
  useEffect(() => {
    setTimeout(() => {
      showToast[type](title, { id, description });
    }, 0);
  }, [description, id, title, type]);
  return null;
}

export default AppToast;
