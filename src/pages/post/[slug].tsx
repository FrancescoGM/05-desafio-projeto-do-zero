import Head from 'next/head';
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import {
  FiCalendar as CalendarIcon,
  FiUser as UserIcon,
  FiClock as ClockIcon,
} from 'react-icons/fi';

import { useEffect } from 'react';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { getPrismicClient } from '../../services/prismic';
import { formatDate, formatLastPublication } from '../../utils/formatDate';

import Header from '../../components/Header';
import { PreviewButton } from '../../components/PreviewButton';
import { NeighborhoodPost, PostFooter } from '../../components/PostFooter';

import styles from './post.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    subtitle?: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  preview: boolean;
  post: Post;
  nextPost: NeighborhoodPost;
  previousPost: NeighborhoodPost;
  commentsGithubUrl: string;
}

const Post: NextPage<PostProps> = ({
  post,
  preview,
  nextPost,
  previousPost,
  commentsGithubUrl,
}) => {
  const { isFallback } = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('repo', commentsGithubUrl);
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-dark');
    anchor.appendChild(script);
  }, []);

  if (isFallback || !post) {
    return <p>Carregando...</p>;
  }
  const readingTime = Math.ceil(
    RichText.asText(
      post.data.content.reduce((acc, data) => [...acc, ...data.body], [])
    ).split(' ').length / 200
  );

  return (
    <>
      <Head>
        <title>
          {isFallback ? 'Carregando...' : post.data.title} | spacetraveling
        </title>
        <meta name="description" content={post.data.subtitle} />

        <meta property="og:site_name" content="spacetraveling" />

        <meta property="og:title" content={post.data.title} />
        <meta property="og:description" content={post.data.subtitle} />

        <meta property="og:image" content="/images/thumbnail.png" />
        <meta property="og:image:type" content="image/png" />

        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.data.title} />
        <meta name="twitter:description" content={post.data.subtitle} />
        <meta name="twitter:image" content="/images/thumbnail.png" />
      </Head>
      <main className={styles.container}>
        <Header />

        <div>
          <img src={post.data.banner.url} alt="banner" />
        </div>
        <article className={styles.content}>
          <h1>{post.data.title}</h1>
          <header>
            <div>
              <time>
                <CalendarIcon /> {formatDate(post.first_publication_date)}
              </time>
              <span>
                <UserIcon /> {post.data.author}
              </span>
              <span>
                <ClockIcon /> {readingTime} min
              </span>
            </div>
            {post.last_publication_date && (
              <i>{formatLastPublication(post.last_publication_date)}</i>
            )}
          </header>
          {post.data.content.map(({ heading, body }, key) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={`${post.uid}.${key}`}>
              {heading && <h2>{heading}</h2>}
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(body),
                }}
              />
            </div>
          ))}
          <hr />
          <PostFooter nextPost={nextPost} previousPost={previousPost} />
          <div id="inject-comments-for-uterances" />
          <PreviewButton preview={preview} />
        </article>
      </main>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const res = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    { pageSize: 2 }
  );

  const paths = res.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

function formatNeighborhoodPost(
  post: ApiSearchResponse,
  slug: string
): NeighborhoodPost | null {
  return slug === post.results[0].uid
    ? null
    : {
        title: post.results[0]?.data?.title,
        uid: post.results[0]?.uid,
      };
}

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
}) => {
  const { slug }: { slug?: string } = params;
  const prismic = getPrismicClient();
  const res = await prismic.getByUID('post', String(slug), {});

  const resPreviousPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: slug,
      orderings: '[document.first_publication_date desc]',
    }
  );
  const resNextPost = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    { pageSize: 1, after: slug, orderings: '[document.first_publication_date]' }
  );

  if (!res) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const nextPost = formatNeighborhoodPost(resNextPost, slug);
  const previousPost = formatNeighborhoodPost(resPreviousPost, slug);

  const post: Post = {
    uid: res.uid,
    first_publication_date: res.first_publication_date,
    last_publication_date: res.last_publication_date,
    data: {
      title: res.data.title,
      subtitle: res.data.subtitle,
      banner: {
        url: res.data.banner.url,
      },
      author: res.data.author,
      content: res.data.content,
    },
  };

  return {
    props: {
      commentsGithubUrl: process.env.COMMENTS_GITHUB_URL,
      preview,
      post,
      nextPost,
      previousPost,
    },
  };
};

export default Post;
