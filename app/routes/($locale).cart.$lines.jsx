/* app/routes/($locale).cart.$lines.jsx */
import {CartLineProvider, Image} from '@shopify/hydrogen';
import {useLoaderData} from '@remix-run/react';
import {AddToCartButton} from '~/components/AddToCartButton';

export function loader() {
  /* cart data already comes from parent route; no extra loader needed */
  return null;
}

export default function CartLinesRoute() {
  const {cart} = useLoaderData();          /* comes from ($locale).cart.jsx */
  if (!cart?.lines?.nodes?.length) return <p>Your cart is empty.</p>;

  return (
    <ul className="cart-lines">
      {cart.lines.nodes.map((line) => (
        <CartLineProvider key={line.id} line={line}>
          <CartLineItem line={line} />
        </CartLineProvider>
      ))}
    </ul>
  );
}

function CartLineItem({line}) {
  return (
    <li className="cart-line">
      {line.merchandise.image && (
        <Image data={line.merchandise.image} width={80} height={80} />
      )}

      <div className="info">
        <p>{line.merchandise.product.title}</p>
        <p>{line.quantity} × {line.cost.amountPerQuantity.amount}&nbsp;{line.cost.amountPerQuantity.currencyCode}</p>

        {/* quick-add another of the same variant */}
        <AddToCartButton
          lines={[{merchandiseId: line.merchandise.id, quantity: 1}]}
          selectedVariant={line.merchandise}         {/* ⭐ pass variant */}
          className="quick-add"
        >
          +
        </AddToCartButton>
      </div>
    </li>
  );
}
