import Link from 'next/link';
import styles from './previewButton.module.scss';

interface PreviewButtonProps {
  preview: boolean;
}

export const PreviewButton: React.FC<PreviewButtonProps> = ({ preview }) => {
  return !preview ? (
    <aside>
      <Link href="/api/preview">
        <a className={styles.previewButton}>Entrar do modo Preview</a>
      </Link>
    </aside>
  ) : (
    <aside>
      <Link href="/api/exit-preview">
        <a className={styles.previewButton}>Sair do modo Preview</a>
      </Link>
    </aside>
  );
};
