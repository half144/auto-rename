'use client';

import React from 'react';
import { WithContext } from 'schema-dts';

export default function JsonLdSchema() {
  const organizationSchema: WithContext<any> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Renomeador Automático',
    url: 'https://auto-rename-zeta.vercel.app',
    logo: 'https://auto-rename-zeta.vercel.app/logo.png',
    sameAs: [
      'https://github.com/half144/auto-rename',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+55-XX-XXXXX-XXXX',
      contactType: 'customer service',
      availableLanguage: {
        '@type': 'Language',
        name: 'Portuguese'
      }
    }
  };

  const webAppSchema: WithContext<any> = {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'SoftwareApplication'],
    name: 'Renomeador Automático de Arquivos',
    url: 'https://auto-rename-zeta.vercel.app',
    description: 'Ferramenta online gratuita para renomear arquivos em massa com base em planilhas Excel ou CSV.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '136'
    },
    featureList: [
      'Renomeação em lote de arquivos',
      'Suporte a Excel e CSV',
      'Personalização de formato',
      'Processamento no navegador'
    ]
  };

  const webPageSchema: WithContext<any> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Renomeador Automático de Arquivos',
    description: 'Ferramenta online gratuita para renomear arquivos em massa com base em planilhas Excel ou CSV.',
    url: 'https://auto-rename-zeta.vercel.app',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Renomeador Automático',
      url: 'https://auto-rename-zeta.vercel.app'
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['article', '.heading']
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://auto-rename-zeta.vercel.app'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Renomeador',
          item: 'https://auto-rename-zeta.vercel.app/renomeador'
        }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
    </>
  );
} 