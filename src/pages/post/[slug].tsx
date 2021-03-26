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

import Header from '../../components/Header';
import { formatDate } from '../../utils/formatdate';
import { getPrismicClient } from '../../services/prismic';

// import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
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
  post: Post;
}

const Post: NextPage<PostProps> = ({ post }) => {
  const { isFallback } = useRouter();

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
      </Head>
      <main className={styles.container}>
        <Header />

        <div>
          <img src={post.data.banner.url} alt="banner" />
        </div>
        <article className={styles.content}>
          <h1>{post.data.title}</h1>
          <header>
            <time>
              <CalendarIcon /> {formatDate(post.first_publication_date)}
            </time>
            <span>
              <UserIcon /> {post.data.author}
            </span>
            <span>
              <ClockIcon /> {readingTime} min
            </span>
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

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const res = await prismic.getByUID('post', String(slug), {});
  if (!res) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const post: Post = {
    uid: res.uid,
    first_publication_date: res.first_publication_date,
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
      post,
    },
  };
};

export default Post;
