import styles from "./HomeScreen.module.css";
import HomeScreenButton from "@/components/HomeScreen/HomeScreenButton";
import { useLanguage } from "@/components/Canvas/LanguageContext";

const HomeScreen = ({ onSelectCanvas }) => {
  const { language, setLanguage } = useLanguage();

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
    <>
      <div className={styles["home-container"]}>
        <div className={styles["language-switcher"]}>
          <button
            onClick={() => setLanguage("de")}
            className={`${styles["lang-button"]} ${
              language === "de" ? styles["active"] : ""
            }`}
            disabled={language === "de"}
          >
            De
          </button>
          <button
            onClick={() => setLanguage("en")}
            className={`${styles["lang-button"]} ${
              language === "en" ? styles["active"] : ""
            }`}
            disabled={language === "en"}
          >
            En
          </button>
        </div>
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
    </>
  );
};

export default HomeScreen;
