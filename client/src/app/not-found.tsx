'use client';

import Link from 'next/link';

import { CLIENT_ROUTES } from '@/shared/constants/clientRoutes';
import formStyles from '@/shared/styles/form.module.css';

import styles from './notFound.module.css';

function NotFoundPage() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>404</h1>
      <p className={styles.lead}>This route does not exist.</p>
      <div className={styles.row}>
        <Link className={`${formStyles.btnPrimary} ${styles.linkBtn}`} href={CLIENT_ROUTES.HOME}>
          Home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
