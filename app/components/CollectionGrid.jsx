import {Link} from '@remix-run/react';
import CollectionIcon from './CollectionIcon';

export default function CollectionGrid({collections}) {
  return (
    <section className="py-12 grid gap-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
      {collections.map((c) => (
        <Link key={c.id} to={`/collections/${c.handle}`} prefetch="viewport">
          <CollectionIcon
            modelUrl={c.metafield?.reference?.url || '/models/dragon-ball.glb'}
            label={c.title}
          />
        </Link>
      ))}
    </section>
  );
}
