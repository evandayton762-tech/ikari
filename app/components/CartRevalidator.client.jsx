import React from 'react';
import {useFetchers, useRevalidator} from '@remix-run/react';

export default function CartRevalidator() {
  const fetchers = useFetchers();
  const revalidator = useRevalidator();

  const anyCartCompleted = fetchers.some((f) => {
    const isCartPost = (f.formAction || '').includes('/cart');
    const completed = f.state === 'idle' && (f.data?.cart || f.data?.analytics?.cartId);
    return isCartPost && completed;
  });

  React.useEffect(() => {
    if (anyCartCompleted) revalidator.revalidate();
  }, [anyCartCompleted, revalidator]);

  return null;
}

