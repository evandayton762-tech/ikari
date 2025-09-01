import {json} from '@shopify/remix-oxygen';

export async function loader({params, context, request}) {
  const {handle} = params;
  const {storefront} = context;
  const url = new URL(request.url);
  const gid = url.searchParams.get('gid');

  if (gid) {
    const data = await storefront.query(PRODUCT_BY_ID_QUERY, {
      variables: {id: gid},
    });
    const product = data?.node?.__typename === 'Product' ? data.node : null;
    if (!product?.id) throw new Response('Not found', {status: 404});
    return json({product});
  }

  if (!handle) throw new Response('Missing handle', {status: 400});

  const {product} = await storefront.query(PRODUCT_MIN_QUERY, {
    variables: {handle},
  });

  if (!product?.id) throw new Response('Not found', {status: 404});
  return json({product});
}

const PRODUCT_MIN_QUERY = `#graphql
  query ProductQuick($country: CountryCode, $language: LanguageCode, $handle: String!) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      title
      vendor
      handle
      description
      descriptionHtml
      featuredImage { id url altText width height }
      selectedOrFirstAvailableVariant(selectedOptions: [], ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
        id
        title
        availableForSale
        image { id url altText width height }
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
      }
    }
  }
`;

const PRODUCT_BY_ID_QUERY = `#graphql
  query ProductById($country: CountryCode, $language: LanguageCode, $id: ID!) @inContext(country: $country, language: $language) {
    node(id: $id) {
      __typename
      ... on Product {
        id
        title
        vendor
        handle
        description
        descriptionHtml
        featuredImage { id url altText width height }
        selectedOrFirstAvailableVariant(selectedOptions: [], ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
          id
          title
          availableForSale
          image { id url altText width height }
          price { amount currencyCode }
          compareAtPrice { amount currencyCode }
        }
      }
    }
  }
`;
