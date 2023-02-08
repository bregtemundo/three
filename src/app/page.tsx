import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "./page.module.css";
import { readdirSync } from "fs";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

const getExperiences = async () => {
  // get all pages inside experiences and return them
  const paths = readdirSync("src/app/experiences", { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  return paths;
};
export default async function Home() {
  const experiences = await getExperiences();
  console.log(experiences);

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        {/* TODO get a link to all pages inside experiences */}
        <h1 className={styles.title}>Experiences</h1>
        {experiences.map((experience, i) => (
          <Link key={i} href={`/experiences/${experience}`}>
            {experience} &rarr;
          </Link>
        ))}
      </div>
    </main>
  );
}
