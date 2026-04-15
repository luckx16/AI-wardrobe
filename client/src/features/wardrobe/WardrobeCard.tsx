import type { WardrobeItem } from '../../app/wardrobe/types';
import styles from './WardrobeCard.module.css';

interface WardrobeCardProps {
  item: WardrobeItem;
  index: number;
}

const WardrobeCard = ({ item, index }: WardrobeCardProps) => {
  return (
    <div className={styles.card} style={{ animationDelay: `${index * 60}ms` }}>
      <div className={styles.imageWrap}>
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          width={512}
          height={640}
          className={styles.image}
        />
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{item.name}</h3>
        <div className={styles.metaRow}>
          <span className={styles.text}>{item.category}</span>
          <span className={styles.badge}>{item.season}</span>
        </div>
        <p className={styles.text}>{item.color}</p>
      </div>
    </div>
  );
};

export default WardrobeCard;
