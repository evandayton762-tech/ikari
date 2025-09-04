import {useLoaderData, Link, useSearchParams} from '@remix-run/react';
import {getPaginationVariables} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';

export const meta = () => {
  return [{title: `Hydrogen | Collection`}];
};

export async function loader({request, context, params}) {
  const {handle} = params;
  const {storefront} = context;

  const url = new URL(request.url);
  const {first, last, startCursor, endCursor} = getPaginationVariables(request, {
    pageBy: 24,
  });
  const sortKey = url.searchParams.get('sort') || 'BEST_SELLING';
  const reverse = url.searchParams.get('reverse') === 'true';

  const variables = {
    handle,
    first,
    last,
    after: endCursor,
    before: startCursor,
    sortKey,
    reverse,
  };

  const data = await storefront.query(COLLECTION_QUERY, {variables});

  if (!data?.collection?.id) {
    throw new Response(null, {status: 404});
  }

  return data;
}

export default function CollectionHandle() {
  const {collection} = useLoaderData();
  const [params] = useSearchParams();
  const sort = params.get('sort') || 'BEST_SELLING';
  const reverse = params.get('reverse') === 'true';
  const pageInfo = collection?.products?.pageInfo;

  const makeUrl = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    return `?${next.toString()}`;
  };

  return (
    <div>
      <h1>{collection.title}</h1>
      <div style={{display:'flex', gap:'.75rem', alignItems:'center', margin:'0.5rem 0 1rem'}}>
        <label>
          Sort:&nbsp;
          <select
            defaultValue={sort}
            onChange={(e)=>{
              window.location.href = makeUrl({sort: e.target.value});
            }}
          >
            <option value="BEST_SELLING">Best selling</option>
            <option value="CREATED_AT">Newest</option>
            <option value="PRICE">Price</option>
            <option value="TITLE">Title</option>
          </select>
        </label>
        <label style={{display:'inline-flex', alignItems:'center', gap:'.25rem'}}>
          <input
            type="checkbox"
            defaultChecked={reverse}
            onChange={(e)=>{
              window.location.href = makeUrl({reverse: e.target.checked});
            }}
          />
          Reverse
        </label>
        <div style={{marginLeft:'auto', display:'flex', gap:'.75rem'}}>
          {pageInfo?.hasPreviousPage && (
            <Link to={makeUrl({startCursor: pageInfo.startCursor, endCursor: '', last: 24, first: ''})}>← Prev</Link>
          )}
          {pageInfo?.hasNextPage && (
            <Link to={makeUrl({endCursor: pageInfo.endCursor, startCursor: '', first: 24, last: ''})}>Next →</Link>
          )}
        </div>
      </div>
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
    $first: Int
    $last: Int
    $after: String
    $before: String
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      title
      products(
        first: $first
        last: $last
        after: $after
        before: $before
        sortKey: $sortKey
        reverse: $reverse
      ) {
        nodes {
          ...ProductItem
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
  ${PRODUCT_ITEM_FRAGMENT}
`;
