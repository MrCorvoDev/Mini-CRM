import styles from './Home.module.scss';

export const Home = () => {
   return (
      <section className={styles.home}>
         <h1 className={styles.home__title}>
            Wassup, it's <strong>Nexty</strong>
            .<br />A template for Next.js projects
         </h1>
         <p className={styles.home__subtitle}>
            You can happily remove this, later on.
         </p>
      </section>
   );
};
