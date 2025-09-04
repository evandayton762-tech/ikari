import {json} from '@shopify/remix-oxygen';

export const loader = async ({request, context}) => {
  const {storefront} = context;
  const {searchParams} = new URL(request.url);
  const q = searchParams.get('q') || '';
  const limit = Number(searchParams.get('limit') || 8);

  if (!q) return json({products: [], queries: []});

  try {
    // Prefer Storefront predictiveSearch if available; fallback to product search
    const data = await storefront.query(PREDICTIVE_QUERY, {
      variables: {query: q, limit},
    });
    return json({
      products: data?.predictiveSearch?.products?.nodes ?? [],
      queries: data?.predictiveSearch?.queries ?? [],
    }, {
      headers: {'Cache-Control': 'public, max-age=15'},
    });
  } catch (e) {
    console.error('Predictive search failed', e);
    // Soft-fail with empty results so UI degrades gracefully
    return json({products: [], queries: []}, {status: 200});
  }
};

const PREDICTIVE_QUERY = `#graphql
  query Predictive($query: String!, $limit: Int!) {
    predictiveSearch(query: $query, limit: $limit) {
      queries
      products {
        nodes {
          id
          title
          handle
          featuredImage { url altText width height }
          priceRange { minVariantPrice { amount currencyCode } }
        }
      }
    }
  }
`;

export default null;

