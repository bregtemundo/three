import styles from './layout.module.scss'

export default function ExperienceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div  className={styles.fullscreen}>{children}</div>
 
  )
}
