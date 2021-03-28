import Link from 'next/link';
import styles from './postFooter.module.scss';

export interface NeighborhoodPost {
  title: string;
  uid: string;
}

interface PostFooterProps {
  previousPost: NeighborhoodPost | null;
  nextPost: NeighborhoodPost | null;
}

export const PostFooter: React.FC<PostFooterProps> = ({
  nextPost,
  previousPost,
}) => {
  return (
    <footer className={styles.footer}>
      {previousPost ? (
        <Link href={`/post/${previousPost.uid}`}>
          <a>
            <h3>{previousPost.title}</h3>
            <span>Post anterior</span>
          </a>
        </Link>
      ) : (
        <div />
      )}
      {nextPost ? (
        <Link href={`/post/${nextPost.uid}`}>
          <a>
            <h3>{nextPost.title}</h3>
            <span>Próximo post</span>
          </a>
        </Link>
      ) : (
        <div />
      )}
    </footer>
  );
};
