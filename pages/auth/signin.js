import { getProviders, signIn, getCsrfToken } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "@/styles/Signin.module.css";

export default function SignIn({ providers, csrfToken }) {
  const router = useRouter();
  const { error } = router.query;

  return (
    <>
      <Head>
        <title>Sign In | Sonar</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>TIKO</div>
          <h1 className={styles.title}>Sign in to your account</h1>
          
          {error && (
            <div className={styles.error}>
              {error === "CredentialsSignin" 
                ? "Sign in failed. Check the details you provided are correct." 
                : "An error occurred while signing in. Please try again."}
            </div>
          )}
          
          <div className={styles.providers}>
            {Object.values(providers).map((provider) => (
              <div key={provider.name}>
                <button
                  className={styles.providerButton}
                  onClick={() => signIn(provider.id, { callbackUrl: '/users/dashboard' })}
                >
                  <span className={styles.providerIcon}>
                    {provider.name === "Spotify" ? "🎵" : "👤"}
                  </span>
                  <span>Sign in with {provider.name}</span>
                </button>
              </div>
            ))}
          </div>
          
          <p className={styles.terms}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const providers = await getProviders();
  const csrfToken = await getCsrfToken(context);
  return {
    props: { providers, csrfToken },
  };
}
