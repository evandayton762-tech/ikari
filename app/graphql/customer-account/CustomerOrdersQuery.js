// Customer Account API query for order list
export const CUSTOMER_ORDERS_QUERY = `#graphql
  fragment OrderCard on Order {
    id
    orderNumber
    processedAt
    fulfillmentStatus
    totalPriceV2 {
      amount
      currencyCode
    }
    lineItems(first: 2) {
      edges {
        node {
          variant {
            image {
              url
              altText
              width
              height
            }
          }
          title
        }
      }
    }
  }
  query CustomerOrders(
    $country: CountryCode
    $language: LanguageCode
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    customer {
      orders(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor
      ) {
        nodes {
          ...OrderCard
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
      }
    }
  }
`;