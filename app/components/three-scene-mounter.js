import {createRoot} from 'react-dom/client';
import ThreeHero from './ThreeHero.client';

export function mountThreeScene(container){
  const root = createRoot(container);
  root.render(<ThreeHero />);
}
