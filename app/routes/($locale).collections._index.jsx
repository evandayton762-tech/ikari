export const meta = () => {
  return [{title: `Hydrogen | Collections`}];
};

import {useLoaderData, Link} from '@remix-run/react';

export async function loader({context}) {
  const {storefront} = context;
  const data = await storefront.query(COLLECTIONS_QUERY);
  return data;
}

export default function CollectionsIndex() {
  const data = useLoaderData();
  const collections = data?.collections?.nodes ?? [];
  return (
    <div>
      <h1>Collections</h1>
      <ul>
        {collections.map((c) => (
          <li key={c.id}>
            <Link to={`/collections/${c.handle}`}>{c.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const COLLECTIONS_QUERY = `#graphql
  query CollectionsIndex(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: 20) {
      nodes {
        id
        title
        handle
      }
    }
  }
`;
