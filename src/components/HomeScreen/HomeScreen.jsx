import styles from "./HomeScreen.module.css";
import HomeScreenButton from "@/components/HomeScreen/HomeScreenButton";

const HomeScreen = ({ onSelectCanvas }) => {
  const buttons = [
    { label: "Demo 1" },
    { label: "Demo 2" },
    { label: "Demo 3" },
    { label: "Demo 4" },
    { label: "Demo 5" },
    { label: "Demo 6" },
    { label: "Demo 7" },
    { label: "Demo 8" },
  ];

  return (
    <div className={styles["home-container"]}>
      <h1>Wähle eine Demo</h1>
      <div className={styles["button-grid"]}>
        {buttons.map((btn, index) => (
          <HomeScreenButton
            key={index}
            label={btn.label}
            onClick={() => onSelectCanvas(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HomeScreen;
