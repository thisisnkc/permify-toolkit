import Layout from '@theme/Layout';
import { useEffect } from 'react';
import Masthead from '../components/landing/Masthead';
import Hero from '../components/landing/Hero';
import FeatureTable from '../components/landing/FeatureTable';
import Tour from '../components/landing/Tour';
import Packages from '../components/landing/Packages';
import Closing from '../components/landing/Closing';

export default function Home() {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.getAttribute('data-theme');
    html.setAttribute('data-theme', 'light');
    return () => {
      if (prev) html.setAttribute('data-theme', prev);
      else html.removeAttribute('data-theme');
    };
  }, []);

  return (
    <Layout
      title="permify-toolkit"
      description="Type-safe authorization for TypeScript"
      noFooter={false}
    >
      <Masthead />
      <Hero />
      <FeatureTable />
      <Tour />
      <Packages />
      <Closing />
    </Layout>
  );
}
