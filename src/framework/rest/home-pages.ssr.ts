import type {
  HomePageProps,
  SettingsQueryOptions,
  TypeQueryOptions,
} from '@/types';
import type { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { QueryClient } from 'react-query';
import { dehydrate } from 'react-query/hydration';
import invariant from 'tiny-invariant';
import client from './client';
import { API_ENDPOINTS } from './client/api-endpoints';
import { PRODUCTS_PER_PAGE, TYPES_PER_PAGE } from './client/variables';

type ParsedQueryParams = {
  pages: string[];
};

// This function gets called at build time
export const getStaticPaths: GetStaticPaths<ParsedQueryParams> = async ({
  locales,
}) => {
  invariant(locales, 'locales is not defined');
  const data = await client.types.all({ limit: 100 });
  const paths = data?.flatMap((type) =>
    locales?.map((locale) => ({ params: { pages: [type.slug] }, locale }))
  );

  // We'll pre-render only these paths at build time also with the slash route.
  return {
    paths: paths.concat(
      locales?.map((locale) => ({ params: { pages: [] }, locale }))
    ),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<
  HomePageProps,
  ParsedQueryParams
> = async ({ locale, params }) => {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(
    [API_ENDPOINTS.SETTINGS, { language: locale }],
    ({ queryKey }) => client.settings.all(queryKey[1] as SettingsQueryOptions)
  );
  // const types = await queryClient.fetchQuery(
  //   [API_ENDPOINTS.TYPES, { limit: TYPES_PER_PAGE, language: locale }],
  //   ({ queryKey }) => client.types.all(queryKey[1] as TypeQueryOptions)
  // );

  const types = [
    {
      name: 'DropFlow',
      settings: {
        isHome: true,
        layoutType: 'classic',
        productCard: 'xenon',
      },
      slug: 'clothing',
      language: 'en',
      icon: 'DressIcon',
    },
  ];

  const { pages } = params!;
  let pageType: string | undefined;
  if (!pages) {
    pageType =
      types.find((type) => type?.settings?.isHome)?.slug ?? types?.[0]?.slug;
  } else {
    pageType = pages[0];
  }

  if (!types?.some((t) => t.slug === pageType)) {
    return {
      notFound: true,
      // This is require to regenerate the page
      revalidate: 120,
    };
  }

  // await queryClient.prefetchQuery(
  //   [API_ENDPOINTS.TYPES, { slug: pageType, language: locale }],
  //   ({ queryKey }: any) => client.types.get(queryKey[1])
  // );

  return {
    props: {
      variables: {
        types: {
          type: 'clothing',
        },
      },
      layout: 'classic',
      // ...(await serverSideTranslations(locale!, ['common', 'banner'])),
      dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
    },
    revalidate: 120,
  };
};

/* Fix : locales: 14kB,
popularProducts: 30kB,
category: 22kB,
groups: 8kB,
group: 2kB,
settings: 2kB,
perProduct: 4.2 * 30 = 120kB,
total = 14 + 30 + 22 + 8 + 2 + 2 + 120 = 198kB
others: 225 - 198 = 27kB

 */
