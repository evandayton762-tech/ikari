export const meta = () => {
  return [{title: `Hydrogen | Collections`}];
};

export async function loader({context}) {
  const {storefront} = context;
  const data = await storefront.query(COLLECTIONS_QUERY);
  return data;
}

export default function CollectionsIndex() {
  return (
    <div>
      <h1>Collections</h1>
      {/* Replace with a collections grid if desired */}
      <p>Select a collection to browse products.</p>
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

