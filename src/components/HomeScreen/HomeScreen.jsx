import styles from "./HomeScreen.module.css";
import HomeScreenButton from "@/components/HomeScreen/HomeScreenButton";
import { useLanguage } from "@/components/Canvas/LanguageContext";

const HomeScreen = ({ onSelectCanvas }) => {
  const { language, setLanguage } = useLanguage();

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
        <h1>Go to Canvas</h1>
        <div className={styles["button-grid"]}>
            <HomeScreenButton
              label="Demo"
              // Ruft die erste Demo (Index 0) auf, wenn geklickt wird.
              onClick={() => onSelectCanvas(0)}
            />
        </div>
      </div>
    </>
  );
};

export default HomeScreen;
