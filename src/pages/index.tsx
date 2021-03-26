import { GetStaticProps, NextPage } from 'next';
import Link from 'next/link';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { FiCalendar as CalendarIcon, FiUser as UserIcon } from 'react-icons/fi';
import { useState } from 'react';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { getPrismicClient } from '../services/prismic';

// import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { formatDate } from '../utils/formatdate';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

const Home: NextPage<HomeProps> = ({ postsPagination }) => {
  const [posts, setPost] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  function handleLoadingMorePosts(): void {
    fetch(postsPagination.next_page)
      .then(res => res.json())
      .then((res: ApiSearchResponse) => {
        const newPosts = res.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              author: post.data.author,
              title: post.data.title,
              subtitle: post.data.subtitle,
            },
          };
        });
        setPost(oldPosts => [...oldPosts, ...newPosts]);
        setNextPage(res.next_page);
      });
  }
  return (
    <>
      <Head>
        <title>spacetraveling.</title>
      </Head>
      <main className={styles.container}>
        <img src="/images/logo.svg" alt="logo" />
        <article className={styles.content}>
          {posts.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <time>
                    <CalendarIcon /> {formatDate(post.first_publication_date)}
                  </time>
                  <p>
                    <UserIcon /> {post.data.author}
                  </p>
                </div>
              </a>
            </Link>
          ))}
          {nextPage && (
            <button type="button" onClick={handleLoadingMorePosts}>
              Carregar mais posts
            </button>
          )}
        </article>
      </main>
    </>
  );
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient();
  const res = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
    }
  );

  return {
    props: {
      postsPagination: {
        next_page: res.next_page,
        results: res.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              author: post.data.author,
              title: post.data.title,
              subtitle: post.data.subtitle,
            },
          };
        }),
      },
    },
  };
};
export default Home;
