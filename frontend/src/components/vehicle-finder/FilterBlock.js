import styles from "./VehicleFinderControls.module.css";

export default function FilterBlock({
                                        step,
                                        title,
                                        description,
                                        children,
                                    }) {
    return (
        <article className={styles.filterBlock}>
            <div className={styles.blockHeading}>
                <div>
                    <span>{step}</span>
                    <h2>{title}</h2>
                </div>

                <p>{description}</p>
            </div>

            <div className={styles.blockContent}>{children}</div>
        </article>
    );
}