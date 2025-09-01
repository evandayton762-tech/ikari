import {useLoaderData} from '@remix-run/react';
import {ProductItem} from '~/components/ProductItem';

export const meta = () => {
  return [{title: `Hydrogen | Collection`}];
};

export async function loader({request, context, params}) {
  const {handle} = params;
  const {storefront} = context;

  const data = await storefront.query(COLLECTION_QUERY, {
    variables: {handle},
  });

  if (!data?.collection?.id) {
    throw new Response(null, {status: 404});
  }

  return data;
}

export default function CollectionHandle() {
  const {collection} = useLoaderData();
  return (
    <div>
      <h1>{collection.title}</h1>
      <div className="products-grid">
        {(collection.products?.nodes ?? []).map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

const MONEY_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
`;

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment ProductItem on Product {
    availableForSale
    handle
    id
    title
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        ...MoneyProductItem
      }
      compareAtPrice {
        ...MoneyProductItem
      }
    }
  }
  ${MONEY_FRAGMENT}
`;

const COLLECTION_QUERY = `#graphql
  query CollectionProducts(
    $country: CountryCode
    $handle: String!
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      title
      products(first: 48) {
        nodes {
          ...ProductItem
        }
      }
    }
  }
  ${PRODUCT_ITEM_FRAGMENT}
`;

