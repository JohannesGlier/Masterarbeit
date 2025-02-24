import styles from "./HomeScreen.module.css";
import HomeScreenButton from "@/components/HomeScreen/HomeScreenButton";

const HomeScreen = ({ onSelectCanvas }) => {
  const buttons = ["Demo 1", "Demo 2", "Demo 3", "Demo 4", "Demo 5", "Demo 6", "Demo 7", "Demo 8"];
  
  return (
    <div className={styles['home-container']}>
      <h1>Wähle eine Demo</h1>
      <div className={styles['button-grid']}>
        {buttons.map((btn, index) => (
          <HomeScreenButton key={index} label={btn} onClick={() => onSelectCanvas(index)} />
        ))}
      </div>
    </div>
  );
};

export default HomeScreen;

