import { useRouter } from 'next/router';
import styles from '../../styles/Auth.module.css';

export default function ErrorPage() {
  const router = useRouter();
  const { error } = router.query;

  let errorMessage = 'An unknown error occurred';
  let errorDescription = 'Please try again or contact support if the problem persists.';

  // Handle different error types
  switch (error) {
    case 'Configuration':
      errorMessage = 'Server configuration error';
      errorDescription = 'There is a problem with the server configuration. Please contact support.';
      break;
    case 'AccessDenied':
      errorMessage = 'Access denied';
      errorDescription = 'You do not have permission to sign in.';
      break;
    case 'Verification':
      errorMessage = 'Verification error';
      errorDescription = 'The verification link may have expired or has already been used.';
      break;
    case 'OAuthSignin':
      errorMessage = 'OAuth sign in error';
      errorDescription = 'Error in the OAuth sign in process. Please try again.';
      break;
    case 'OAuthCallback':
      errorMessage = 'OAuth callback error';
      errorDescription = 'Error in the OAuth callback process. Please try again.';
      break;
    case 'OAuthCreateAccount':
      errorMessage = 'Account creation error';
      errorDescription = 'There was a problem creating your account. Please try again.';
      break;
    case 'EmailCreateAccount':
      errorMessage = 'Email account creation error';
      errorDescription = 'There was a problem creating your account with this email. Please try again.';
      break;
    case 'Callback':
      errorMessage = 'Callback error';
      errorDescription = 'There was a problem with the authentication callback. Please try again.';
      break;
    case 'OAuthAccountNotLinked':
      errorMessage = 'Account not linked';
      errorDescription = 'This email is already associated with another account. Please sign in with the original provider.';
      break;
    case 'EmailSignin':
      errorMessage = 'Email sign in error';
      errorDescription = 'The email could not be sent or there was a problem with the email sign in link.';
      break;
    case 'CredentialsSignin':
      errorMessage = 'Invalid credentials';
      errorDescription = 'The credentials you provided are invalid. Please try again.';
      break;
    case 'SessionRequired':
      errorMessage = 'Authentication required';
      errorDescription = 'You must be signed in to access this page.';
      break;
  }

  return (
    <div className={styles.container}>
      <div className={styles.errorCard}>
        <h1 className={styles.errorTitle}>Authentication Error</h1>
        <h2 className={styles.errorMessage}>{errorMessage}</h2>
        <p className={styles.errorDescription}>{errorDescription}</p>
        <div className={styles.buttonGroup}>
          <button 
            onClick={() => router.push('/auth/signin')}
            className={styles.button}
          >
            Try Again
          </button>
          <button 
            onClick={() => router.push('/')}
            className={`${styles.button} ${styles.secondaryButton}`}
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}
